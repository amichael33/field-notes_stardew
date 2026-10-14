import schedulesJson from './schedules.json'
import { WEEKDAYS, weekdayOf } from '../state/clock'
import type { Location, Season, Stop } from './types'

const schedules = schedulesJson as unknown as Record<string, Record<string, Stop[]>>

// Rule precedence, first existing key wins. This order is the controller's
// reading of the game data; it has NOT been verified against the game's code
// or the wiki (which blocks automated clients). It is pinned by the tests in
// schedules.test.ts.
//  - Date rules (`spring_4`, then the bare day-of-month `11`) outrank weather.
//  - `rain` comes before every weekday and season rule.
//  - Many villagers (Pierre, Pam, Sandy, Clint, Gus, Kent, Robin, George,
//    Emily, Willy, ...) only have `spring`-prefixed rules, and the game falls
//    back to them in other seasons, so `spring_${dow}` and `spring` come last
//    before `default`. Duplicates (in spring) are harmless.
export function ruleKeys(season: Season, day: number, raining: boolean): string[] {
  const dow = WEEKDAYS[weekdayOf(day)]
  return [
    `${season}_${day}`,
    `${day}`,
    ...(raining ? ['rain'] : []),
    `${season}_${dow}`,
    dow,
    season,
    `spring_${dow}`,
    'spring',
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
