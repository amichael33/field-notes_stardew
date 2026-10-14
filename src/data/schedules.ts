import schedulesJson from './schedules.json'
import { WEEKDAYS, weekdayOf } from '../state/clock'
import type { Location, Season, Stop } from './types'

const schedules = schedulesJson as unknown as Record<string, Record<string, Stop[]>>

// Rule precedence comes from the game's schedule format as understood and is
// pinned by the tests in schedules.test.ts. It has not been checked against
// the wiki page, which blocks automated clients.
export function ruleKeys(season: Season, day: number, raining: boolean): string[] {
  const dow = WEEKDAYS[weekdayOf(day)]
  return [
    ...(raining ? ['rain'] : []),
    `${season}_${day}`,
    `${season}_${dow}`,
    dow,
    season,
    'default',
  ]
}

export function scheduleFor(
  name: string,
  season: Season,
  day: number,
  raining: boolean,
): Stop[] | null {
  const rules = schedules[name]
  if (!rules) return null
  const key = ruleKeys(season, day, raining).find((k) => k in rules)
  return key ? rules[key] : null
}

export function rainMayVary(name: string, raining: boolean): boolean {
  return raining && schedules[name] !== undefined && 'rain2' in schedules[name]
}

export function locationAt(stops: Stop[], minutes: number): Location {
  let idx = -1
  for (let i = 0; i < stops.length; i++) if (stops[i].time <= minutes) idx = i
  if (idx === -1) return { place: 'At home', since: null, next: stops[0] }
  const loc: Location = { place: stops[idx].place, since: stops[idx].time }
  if (idx + 1 < stops.length) loc.next = stops[idx + 1]
  return loc
}
