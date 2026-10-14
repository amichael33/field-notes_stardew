import type { SaveData } from '../data/types'

type ParseResult = { ok: true; data: SaveData } | { ok: false; error: string }

export function defaultSave(): SaveData {
  return {
    version: 1,
    profile: { route: 'community-center', farmType: 'standard' },
    checked: [],
    notes: '',
  }
}

export function toggleChecked(save: SaveData, id: string): SaveData {
  const checked = save.checked.includes(id)
    ? save.checked.filter((c) => c !== id)
    : [...save.checked, id]
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
  if (!Array.isArray(raw.checked) || !raw.checked.every((c) => typeof c === 'string')) {
    return { ok: false, error: 'The save checklist is invalid.' }
  }
  if (typeof raw.notes !== 'string') return { ok: false, error: 'The save notes are invalid.' }
  return {
    ok: true,
    data: {
      version: 1,
      profile: { route: profile.route, farmType: profile.farmType },
      checked: [...raw.checked],
      notes: raw.notes,
    },
  }
}
