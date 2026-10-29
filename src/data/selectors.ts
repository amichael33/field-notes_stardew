import type { Bundle, BundleItem, PathStep, Season, Villager } from './types'

const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter']

export function bundleItemsBySeason(
  bundles: Bundle[],
  season: Season | 'all',
): { bundle: Bundle; item: BundleItem; index: number }[] {
  return bundles.flatMap((bundle) =>
    bundle.items
      .map((item, index) => ({ bundle, item, index }))
      .filter(
        ({ item }) =>
          season === 'all' || item.seasons === 'any' || item.seasons.includes(season),
      ),
  )
}

export function birthdaysBySeason(villagers: Villager[], season: Season | 'all'): Villager[] {
  return villagers
    .filter((v) => season === 'all' || v.birthday.season === season)
    .sort(
      (a, b) =>
        SEASON_ORDER.indexOf(a.birthday.season) - SEASON_ORDER.indexOf(b.birthday.season) ||
        a.birthday.day - b.birthday.day,
    )
}

export function sortedPathSteps(steps: PathStep[]): PathStep[] {
  return [...steps].sort((a, b) => a.order - b.order)
}

export function pathId(step: PathStep): string {
  return `path:${step.order}`
}

export function firstUnchecked(steps: PathStep[], checked: string[]): PathStep | undefined {
  return sortedPathSteps(steps).find((step) => !checked.includes(pathId(step)))
}

const SHOP_OWNER = /\b([A-Z][a-z]+)'s(?: [A-Z][a-z]+)* (?:Shop|Store)\b/g

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Villagers (and shop owners) mentioned in unchecked steps; empty once "Meet the town" is done. */
export function peopleToVisit(
  steps: PathStep[],
  checked: string[],
  villagers: Villager[],
): { who: string; step: PathStep }[] {
  const ordered = sortedPathSteps(steps)
  const meet = ordered.find((s) => s.order === 2)
  if (meet && checked.includes(pathId(meet))) return []
  const result: { who: string; step: PathStep }[] = []
  for (const step of ordered) {
    if (checked.includes(pathId(step))) continue
    const text = `${step.title} ${step.detail}`
    const found: string[] = []
    for (const { name } of villagers) {
      if (new RegExp(`\\b${escapeRegExp(name)}\\b`).test(text)) found.push(name)
    }
    for (const match of text.matchAll(SHOP_OWNER)) found.push(match[1])
    for (const who of new Set(found)) result.push({ who, step })
  }
  return result
}

/**
 * Id of an item within its bundle. The first item of a given name keeps
 * `bundle:<id>:<name>`; a later same-name item gets `#2`, `#3`, ... by position.
 * Pass `index` (position in bundle.items) when known; otherwise it is looked up by reference.
 */
export function bundleItemId(bundle: Bundle, item: BundleItem, index?: number): string {
  const at = index ?? bundle.items.indexOf(item)
  const base = `bundle:${bundle.id}:${item.name}`
  if (at < 0) return base
  const occurrence = bundle.items.slice(0, at).filter((i) => i.name === item.name).length + 1
  return occurrence === 1 ? base : `${base}#${occurrence}`
}

export function bundleProgress(
  bundle: Bundle,
  checked: string[],
): { obtained: number; required: number; complete: boolean } {
  const obtained = bundle.items.filter((item, i) => checked.includes(bundleItemId(bundle, item, i))).length
  const required = bundle.slotsRequired
  return { obtained, required, complete: obtained >= required }
}

/** Rooms in the order the Community Center opens them up, with how many bundles must be complete first. */
export const ROOM_ORDER = [
  'Crafts Room',
  'Pantry',
  'Fish Tank',
  'Boiler Room',
  'Bulletin Board',
  'Vault',
  'Abandoned JojaMart',
]
const ROOM_NEEDS: Record<string, number> = {
  'Crafts Room': 0,
  Pantry: 1,
  'Fish Tank': 1,
  'Boiler Room': 2,
  'Bulletin Board': 3,
  Vault: 4,
}

export function roomRank(room: string): number {
  const i = ROOM_ORDER.indexOf(room)
  return i === -1 ? ROOM_ORDER.length : i
}

/**
 * A room appears after a number of bundles are complete anywhere in the Community Center (per the wiki);
 * the Missing Bundle's JojaMart only opens once every other bundle is complete.
 */
export function roomStatus(
  room: string,
  bundles: Bundle[],
  checked: string[],
): { unlocked: boolean; need: number; have: number; hint: string } {
  const others = bundles.filter((b) => b.room !== 'Abandoned JojaMart')
  const have = others.filter((b) => bundleProgress(b, checked).complete).length
  if (room === 'Abandoned JojaMart') {
    const need = others.length
    return {
      unlocked: have >= need,
      need,
      have,
      hint: 'Opens after every other bundle is complete, on the next rainy night.',
    }
  }
  const need = ROOM_NEEDS[room] ?? 0
  return {
    unlocked: have >= need,
    need,
    have,
    hint: need === 0 ? 'Open from the start.' : `Appears after ${need} bundle${need === 1 ? '' : 's'} are complete.`,
  }
}
