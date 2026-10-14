import { placeName as defaultPlaceName } from './places.mjs'

export function parseTime(token) {
  if (!/^a?[0-9]+$/.test(token ?? '')) throw new Error(`bad time token "${token}"`)
  const n = parseInt(token.replace(/^a/, ''), 10)
  return Math.floor(n / 100) * 60 + (n % 100)
}

// Returns Stop[] | { goto } | null (null = no schedule).
export function parseRule(rule, placeName = defaultPlaceName) {
  let segs = rule.split('/')
  for (;;) {
    if (/^NOT friendship /.test(segs[0])) segs = segs.slice(1)
    else if (/^MAIL /.test(segs[0])) segs = segs.slice(2) // drop the flag and the received branch
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
  return stops
}

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
const KEPT = new RegExp(`^(?:rain[0-9]*|default|${DAY}|${SEASON}(?:_(?:${DAY}|[0-9]+))?)$`)

export function isKeptKey(key) {
  return KEPT.test(key)
}
