import { placeName as defaultPlaceName } from './places.mjs'

export function parseTime(token) {
  if (!/^a?[0-9]+$/.test(token ?? '')) throw new Error(`bad time token "${token}"`)
  const n = parseInt(token.replace(/^a/, ''), 10)
  return Math.floor(n / 100) * 60 + (n % 100)
}

// Returns Stop[] | { goto } | null (null = no schedule).
//
// Leading conditions, as ruled from the game data (not checked against the
// game's code): we model a year-1 player at 0 hearts with no special mail.
//  - `NOT friendship <who> <n>/...` is true at 0 hearts, so the tail applies.
//  - `MAIL <flag>/<A>/<B...>`: A applies when the mail has NOT been received
//    (the year-1 default), B... when it has. Evidence: Leah `summer` sends the
//    not-received case to `summer_noBridge`; Emily/Sandy `fall_15` keep the
//    Desert trip (needs the bus) for the received case; Alex `Sun` keeps the
//    sports room for the received case. So we follow only segment A.
export function parseRule(rule, placeName = defaultPlaceName) {
  let segs = rule.split('/')
  for (;;) {
    if (/^NOT friendship /.test(segs[0])) segs = segs.slice(1)
    else if (/^MAIL /.test(segs[0])) segs = segs.slice(1, 2) // keep only the not-received branch
    else break
    if (segs.length === 0) return null
  }
  if (segs.length === 1 && segs[0].startsWith('GOTO ')) {
    const target = segs[0].slice(5).trim()
    return target === 'NO_SCHEDULE' ? null : { goto: target }
  }
  const stops = []
  for (const seg of segs) {
    const [time, place] = seg.replace(/"[^"]*"/g, '').trim().split(/[ 	]+/)
    if (!place) throw new Error(`stop "${seg}" has no place`)
    // A numeric second token means "same map as the previous stop" (e.g. 1900 35 25 0).
    if (/^[0-9]+$/.test(place)) {
      if (stops.length === 0) throw new Error(`stop "${seg}" has no map and no previous stop`)
      stops.push({ time: parseTime(time), place: stops[stops.length - 1].place })
    } else {
      stops.push({ time: parseTime(time), place: placeName(place) })
    }
  }
  return mergeRepeatedPlaces(stops)
}

// Collapse consecutive stops at the same place into the first one (keeping its
// time), so "since" reads from when the villager arrived.
export function mergeRepeatedPlaces(stops) {
  const out = []
  for (const s of stops) if (out.length === 0 || out[out.length - 1].place !== s.place) out.push(s)
  return out
}

// `GOTO season` means "the current season's rule", which depends on the date.
// A rule that resolves to it is left out of the output: the runtime lookup then
// falls through to the season rule, which is the same result.
export const DYNAMIC_SEASON = 'season'

export function resolveRules(raw, placeName = defaultPlaceName) {
  const rules = {}
  const errors = []
  const failed = []
  for (const key of Object.keys(raw)) {
    const seen = new Set()
    let cur = key
    try {
      for (;;) {
        if (seen.has(cur)) throw new Error(`GOTO loop via ${[...seen].join(' -> ')}`)
        seen.add(cur)
        if (!Object.hasOwn(raw, cur)) throw new Error(`unresolved GOTO target "${cur}"`)
        const parsed = parseRule(raw[cur], placeName)
        if (parsed === null) break
        if (Array.isArray(parsed)) {
          rules[key] = parsed
          break
        }
        if (parsed.goto === DYNAMIC_SEASON) break // omitted on purpose, see above
        cur = parsed.goto
      }
    } catch (e) {
      errors.push(`${key}: ${e.message}`)
      failed.push({ key, message: e.message })
    }
  }
  return { rules, errors, failed }
}

const SEASON = '(?:spring|summer|fall|winter)'
const DAY = '(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)'
// Kept: rain rules, default, weekdays, seasons, season_weekday, season_date,
// and bare numbers, which are day-of-month rules (Abigail `11`, Lewis `3`).
// Dropped: `N_M` / `Wed_6` heart variants, marriage, festival and special keys.
const KEPT = new RegExp(`^(?:rain[0-9]*|default|[0-9]+|${DAY}|${SEASON}(?:_(?:${DAY}|[0-9]+))?)$`)

export function isKeptKey(key) {
  return KEPT.test(key)
}
