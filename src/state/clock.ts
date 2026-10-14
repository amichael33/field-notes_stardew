import type { Clock, ClockStatus, Season, Weather } from '../data/types'

export const MORNING = 360
export const NIGHT = 1560
export const STEP_MS = 7000
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']
const WEATHERS: Weather[] = ['sunny', 'rain']
const STATUSES: ClockStatus[] = ['idle', 'running', 'paused', 'ended']

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

// Null starts Spring 1. Any other clock (running, paused or ended: players
// often sleep before 2:00 AM) moves to the next date at 6:00 AM, sunny, running.
export function startDay(clock: Clock | null): Clock {
  if (!clock) return { season: 'spring', day: 1, minutes: MORNING, weather: 'sunny', status: 'running' }
  let { season, day } = clock
  if (day >= 28) {
    day = 1
    season = SEASONS[(SEASONS.indexOf(season) + 1) % 4]
  } else {
    day += 1
  }
  return { season, day, minutes: MORNING, weather: 'sunny', status: 'running' }
}

export function tick(clock: Clock, steps: number): Clock {
  if (clock.status !== 'running') return clock
  const minutes = Math.min(NIGHT, clock.minutes + steps * 10)
  return { ...clock, minutes, status: minutes >= NIGHT ? 'ended' : 'running' }
}

export function nudge(clock: Clock, deltaMinutes: number): Clock {
  if (clock.status === 'idle') return clock
  const minutes = clamp(clock.minutes + deltaMinutes, MORNING, NIGHT)
  let status = clock.status
  if (minutes >= NIGHT) status = 'ended'
  else if (status === 'ended') status = 'paused'
  return { ...clock, minutes, status }
}

export function togglePause(clock: Clock): Clock {
  if (clock.status === 'running') return { ...clock, status: 'paused' }
  if (clock.status === 'paused') return { ...clock, status: 'running' }
  return clock
}

export function setWeather(clock: Clock, weather: Weather): Clock {
  return { ...clock, weather }
}

export function setDateTime(
  clock: Clock,
  p: { season: Season; day: number; minutes: number },
): Clock {
  const day = clamp(Math.round(p.day), 1, 28)
  const minutes = clamp(Math.round(p.minutes / 10) * 10, MORNING, NIGHT)
  // 2:00 AM is the end of the day, so a paused clock set there offers Start day.
  const status = minutes >= NIGHT ? 'ended' : clock.status === 'running' ? 'running' : 'paused'
  return { ...clock, season: p.season, day, minutes, status }
}

export function restoreClock(clock: Clock | null): Clock | null {
  if (!clock) return null
  return clock.status === 'running' ? { ...clock, status: 'paused' } : clock
}

export function isClock(v: unknown): v is Clock {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  const o = v as Record<string, unknown>
  return (
    SEASONS.includes(o.season as Season) &&
    Number.isInteger(o.day) &&
    (o.day as number) >= 1 &&
    (o.day as number) <= 28 &&
    Number.isInteger(o.minutes) &&
    (o.minutes as number) >= MORNING &&
    (o.minutes as number) <= NIGHT &&
    (o.minutes as number) % 10 === 0 &&
    WEATHERS.includes(o.weather as Weather) &&
    STATUSES.includes(o.status as ClockStatus)
  )
}

export function weekdayOf(day: number): number {
  return (day - 1) % 7
}

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`
}
