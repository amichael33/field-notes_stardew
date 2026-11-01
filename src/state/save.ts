import type { Clock, CustomTask, RemixState, SaveData } from '../data/types'
import { DEFAULT_PLAN_GOAL, isPlanGoal } from '../data/plans'
import { isClock } from './clock'
import { defaultFarm, parseFarm } from './farm-save'

type ParseResult = { ok: true; data: SaveData } | { ok: false; error: string }

export function defaultSave(): SaveData {
  return {
    version: 1,
    profile: {
      route: 'community-center',
      farmType: 'standard',
      planGoal: 'community-center',
      remixed: false,
    },
    checked: [],
    notes: '',
    clock: null,
    customTasks: [],
    farm: defaultFarm(),
    remix: { picks: {} },
  }
}

export function toggleChecked(save: SaveData, id: string): SaveData {
  const checked = save.checked.includes(id) ? save.checked.filter((c) => c !== id) : [...save.checked, id]
  return { ...save, checked }
}

export function serializeSave(save: SaveData): string {
  return JSON.stringify(save, null, 2)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function parseSave(json: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!isRecord(raw)) return { ok: false, error: 'The save data has the wrong shape.' }
  if (typeof raw.version !== 'number') {
    return { ok: false, error: 'The save data has no version number.' }
  }
  if (raw.version > 1) {
    return { ok: false, error: 'This save was made by a newer version of the app.' }
  }
  if (raw.version !== 1) return { ok: false, error: 'Unsupported save version.' }
  const profile = raw.profile
  if (!isRecord(profile)) return { ok: false, error: 'The save profile is invalid.' }
  if (profile.route !== 'community-center' && profile.route !== 'joja') {
    return { ok: false, error: 'The save route is invalid.' }
  }
  if (typeof profile.farmType !== 'string') {
    return { ok: false, error: 'The save farm type is invalid.' }
  }
  const planGoal = profile.planGoal === undefined ? DEFAULT_PLAN_GOAL : profile.planGoal
  if (!isPlanGoal(planGoal)) return { ok: false, error: 'The save plan goal is invalid.' }
  const remixed = profile.remixed === undefined ? false : profile.remixed
  if (typeof remixed !== 'boolean') return { ok: false, error: 'The save remix setting is invalid.' }
  if (!Array.isArray(raw.checked) || !raw.checked.every((c) => typeof c === 'string')) {
    return { ok: false, error: 'The save checklist is invalid.' }
  }
  if (typeof raw.notes !== 'string') return { ok: false, error: 'The save notes are invalid.' }
  let clock: Clock | null = null
  if (raw.clock !== undefined && raw.clock !== null) {
    if (!isClock(raw.clock)) return { ok: false, error: 'The save clock is invalid.' }
    // Copy only the validated fields so unknown keys in a file never enter the save.
    const { season, day, minutes, weather, status } = raw.clock
    clock = { season, day, minutes, weather, status }
  }
  const customTasks: CustomTask[] = []
  if (raw.customTasks !== undefined) {
    if (!Array.isArray(raw.customTasks)) return { ok: false, error: 'The save custom tasks are invalid.' }
    for (const t of raw.customTasks) {
      if (
        !isRecord(t) ||
        typeof t.id !== 'string' ||
        typeof t.text !== 'string' ||
        typeof t.day !== 'number' ||
        !Number.isInteger(t.day) ||
        t.day < 1 ||
        t.day > 28 ||
        !['spring', 'summer', 'fall', 'winter'].includes(t.season as string)
      ) {
        return { ok: false, error: 'The save custom tasks are invalid.' }
      }
      customTasks.push({ id: t.id, text: t.text, day: t.day, season: t.season as CustomTask['season'] })
    }
  }
  let farm = defaultFarm()
  if (raw.farm !== undefined) {
    const parsedFarm = parseFarm(raw.farm)
    if (!parsedFarm) return { ok: false, error: 'The save farm is invalid.' }
    farm = parsedFarm
  }
  let remix: RemixState = { picks: {} }
  if (raw.remix !== undefined) {
    if (!isRecord(raw.remix) || !isRecord(raw.remix.picks)) {
      return { ok: false, error: 'The save remix picks are invalid.' }
    }
    const entries: [string, string[]][] = []
    for (const [slot, ids] of Object.entries(raw.remix.picks)) {
      if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
        return { ok: false, error: 'The save remix picks are invalid.' }
      }
      entries.push([slot, [...ids]])
    }
    // fromEntries defines own properties, so a "__proto__" slot cannot swap the prototype.
    remix = { picks: Object.fromEntries(entries) }
  }
  return {
    ok: true,
    data: {
      version: 1,
      profile: { route: profile.route, farmType: profile.farmType, planGoal, remixed },
      checked: [...raw.checked],
      notes: raw.notes,
      clock,
      customTasks,
      farm,
      remix,
    },
  }
}
