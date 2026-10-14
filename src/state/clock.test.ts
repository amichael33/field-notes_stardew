import { describe, expect, it } from 'vitest'
import type { Clock } from '../data/types'
import {
  formatTime,
  isClock,
  nudge,
  restoreClock,
  setDateTime,
  setWeather,
  startDay,
  tick,
  togglePause,
  weekdayOf,
} from './clock'

const c = (o: Partial<Clock> = {}): Clock => ({
  season: 'spring',
  day: 5,
  minutes: 360,
  weather: 'sunny',
  status: 'running',
  ...o,
})

describe('startDay', () => {
  it('starts a fresh clock from null', () => {
    expect(startDay(null)).toEqual({ season: 'spring', day: 1, minutes: 360, weather: 'sunny', status: 'running' })
  })
  it('advances the day, rolling seasons and years', () => {
    expect(startDay(c({ status: 'ended', day: 28 }))).toEqual(c({ season: 'summer', day: 1, status: 'running' }))
    expect(startDay(c({ status: 'ended', season: 'winter', day: 28 }))).toEqual(c({ season: 'spring', day: 1 }))
    expect(startDay(c({ status: 'ended', minutes: 1560, weather: 'rain' }))).toEqual(c({ day: 6 }))
  })
})

describe('tick', () => {
  it('advances a running clock', () => {
    expect(tick(c(), 3).minutes).toBe(390)
  })
  it('clamps and ends at night', () => {
    expect(tick(c({ minutes: 1550 }), 5)).toMatchObject({ minutes: 1560, status: 'ended' })
  })
  it('ignores a paused clock', () => {
    const p = c({ status: 'paused' })
    expect(tick(p, 3)).toEqual(p)
  })
})

describe('nudge', () => {
  it('moves and clamps', () => {
    expect(nudge(c({ minutes: 400 }), 10).minutes).toBe(410)
    expect(nudge(c({ minutes: 400 }), -10).minutes).toBe(390)
    expect(nudge(c({ minutes: 360 }), -10).minutes).toBe(360)
    expect(nudge(c({ minutes: 1560, status: 'paused' }), 10).minutes).toBe(1560)
  })
  it('ends at night', () => {
    expect(nudge(c({ minutes: 1550 }), 10)).toMatchObject({ minutes: 1560, status: 'ended' })
  })
  it('pauses an ended clock nudged back', () => {
    expect(nudge(c({ minutes: 1560, status: 'ended' }), -10)).toMatchObject({ minutes: 1550, status: 'paused' })
  })
  it('leaves idle unchanged', () => {
    const i = c({ status: 'idle' })
    expect(nudge(i, 10)).toEqual(i)
  })
})

describe('togglePause', () => {
  it('toggles running and paused', () => {
    expect(togglePause(c()).status).toBe('paused')
    expect(togglePause(c({ status: 'paused' })).status).toBe('running')
  })
  it('leaves ended and idle', () => {
    expect(togglePause(c({ status: 'ended' })).status).toBe('ended')
    expect(togglePause(c({ status: 'idle' })).status).toBe('idle')
  })
})

describe('setWeather', () => {
  it('changes only weather', () => {
    expect(setWeather(c(), 'rain')).toEqual(c({ weather: 'rain' }))
  })
})

describe('setDateTime', () => {
  it('sets, clamps and snaps', () => {
    expect(setDateTime(c(), { season: 'fall', day: 12, minutes: 723 })).toMatchObject({
      season: 'fall',
      day: 12,
      minutes: 720,
    })
    expect(setDateTime(c(), { season: 'fall', day: 0, minutes: 100 })).toMatchObject({ day: 1, minutes: 360 })
    expect(setDateTime(c(), { season: 'fall', day: 99, minutes: 9999 })).toMatchObject({ day: 28, minutes: 1560 })
  })
  it('handles status', () => {
    const p = { season: 'spring' as const, day: 1, minutes: 400 }
    expect(setDateTime(c({ status: 'running' }), p).status).toBe('running')
    expect(setDateTime(c({ status: 'paused' }), p).status).toBe('paused')
    expect(setDateTime(c({ status: 'ended' }), p).status).toBe('paused')
  })
})

describe('restoreClock', () => {
  it('pauses running, keeps null and others', () => {
    expect(restoreClock(c())?.status).toBe('paused')
    expect(restoreClock(null)).toBeNull()
    expect(restoreClock(c({ status: 'ended' }))?.status).toBe('ended')
    expect(restoreClock(c({ status: 'idle' }))?.status).toBe('idle')
  })
})

describe('weekdayOf', () => {
  it('maps days to weekdays', () => {
    expect(weekdayOf(1)).toBe(0)
    expect(weekdayOf(7)).toBe(6)
    expect(weekdayOf(8)).toBe(0)
    expect(weekdayOf(28)).toBe(6)
  })
})

describe('formatTime', () => {
  it('formats', () => {
    expect(formatTime(360)).toBe('6:00 AM')
    expect(formatTime(720)).toBe('12:00 PM')
    expect(formatTime(780)).toBe('1:00 PM')
    expect(formatTime(1440)).toBe('12:00 AM')
    expect(formatTime(1500)).toBe('1:00 AM')
    expect(formatTime(1560)).toBe('2:00 AM')
  })
})

describe('isClock', () => {
  it('accepts valid', () => {
    expect(isClock(c())).toBe(true)
  })
  it('rejects invalid', () => {
    for (const bad of [
      { ...c(), season: 'autumn' },
      c({ day: 0 }),
      c({ day: 29 }),
      c({ day: 1.5 }),
      c({ minutes: 350 }),
      c({ minutes: 1570 }),
      c({ minutes: 365 }),
      { ...c(), weather: 'snow' },
      { ...c(), status: 'stopped' },
      null,
      'x',
      [],
    ]) {
      expect(isClock(bad)).toBe(false)
    }
  })
})
