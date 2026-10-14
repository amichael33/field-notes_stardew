import { describe, expect, it } from 'vitest'
import raw from './schedules.json'
import villagers from './villagers.json'
import { locationAt, rainMayVary, ruleKeys, scheduleFor } from './schedules'
import type { Season, Stop } from './types'

const data = raw as unknown as Record<string, Record<string, Stop[]>>
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

describe('scheduleFor', () => {
  it('uses the season rule on a plain day and the weekday rule on a Friday', () => {
    expect(scheduleFor('Pierre', 'spring', 1, false)).toEqual(data.Pierre.spring)
    expect(scheduleFor('Pierre', 'spring', 5, false)).toEqual(data.Pierre.Fri)
    expect(scheduleFor('Pierre', 'spring', 5, false)![1].place).toBe('The Stardrop Saloon')
  })
  it('uses the rain rule when raining', () => {
    expect(scheduleFor('Pierre', 'spring', 5, true)).toEqual(data.Pierre.rain)
    expect(scheduleFor('Pierre', 'spring', 5, true)!.map((s) => s.place)).toEqual(["Pierre's General Store"])
  })
  it('prefers season_day over rain for Abigail', () => {
    expect(scheduleFor('Abigail', 'spring', 4, false)).toEqual(data.Abigail.spring_4)
    expect(scheduleFor('Abigail', 'spring', 4, true)).toEqual(data.Abigail.spring_4)
    expect(scheduleFor('Abigail', 'spring', 3, true)).toEqual(data.Abigail.rain)
  })
  it('falls back to spring rules in other seasons (Pierre on Summer 1)', () => {
    expect(data.Pierre.summer).toBeUndefined()
    const stops = scheduleFor('Pierre', 'summer', 1, false)
    expect(stops).toEqual(data.Pierre.spring)
    expect(stops!.length).toBeGreaterThan(0)
  })
  it('keeps Alex out of the Saloon sports room on a fall Sunday', () => {
    expect(data.Alex.Sun).toBeUndefined() // GOTO season is left to the runtime
    const stops = scheduleFor('Alex', 'fall', 7, false)!
    expect(stops).toEqual(data.Alex.spring)
    expect(locationAt(stops, 660).place).not.toBe('The Stardrop Saloon')
  })
  it('uses bare day-of-month rules', () => {
    expect(scheduleFor('Abigail', 'spring', 11, false)).toEqual(data.Abigail['11'])
    expect(scheduleFor('Lewis', 'summer', 3, false)).toEqual(data.Lewis['3'])
    expect(scheduleFor('Lewis', 'summer', 3, false)![1].place).toBe("Marnie's Ranch")
  })
  it('does not send Emily to the Desert on Fall 15 before the bus is fixed', () => {
    const stops = scheduleFor('Emily', 'fall', 15, false)!
    expect(stops).toEqual(data.Emily.fall_15)
    expect(stops.map((s) => s.place)).not.toContain('The Calico Desert')
  })
  it('prefers season_weekday over weekday (Abigail on Fall 1, a Monday)', () => {
    expect(data.Abigail.fall_Mon).toBeDefined()
    expect(scheduleFor('Abigail', 'fall', 1, false)).toEqual(data.Abigail.fall_Mon)
  })
  it('falls through to normal rules with no rain rule', () => {
    const name = Object.keys(data).find((k) => !data[k].rain)!
    expect(scheduleFor(name, 'spring', 1, true)).toEqual(scheduleFor(name, 'spring', 1, false))
  })
  it('returns null for villagers without data', () => {
    expect(scheduleFor('Krobus', 'spring', 1, false)).toBeNull()
    expect(scheduleFor('Wizard', 'spring', 1, false)).toBeNull()
  })
  it('orders rule keys', () => {
    expect(ruleKeys('fall', 8, true)).toEqual([
      'fall_8',
      '8',
      'rain',
      'fall_Mon',
      'Mon',
      'fall',
      'spring_Mon',
      'spring',
      'default',
    ])
    expect(ruleKeys('fall', 8, false)).not.toContain('rain')
  })
  it('resolves every villager for every date and weather, non-null when they have data', () => {
    for (const v of villagers as { name: string }[])
      for (const s of SEASONS)
        for (let d = 1; d <= 28; d++)
          for (const r of [false, true]) {
            const stops = scheduleFor(v.name, s, d, r)
            if (v.name in data) expect(stops, `${v.name} ${s} ${d} rain=${r}`).not.toBeNull()
          }
  })
})

describe('rainMayVary', () => {
  it('is true only when raining with a rain2 rule', () => {
    expect(rainMayVary('Abigail', true)).toBe(true)
    expect(rainMayVary('Abigail', false)).toBe(false)
    expect(rainMayVary('Pierre', true)).toBe(false)
    expect(rainMayVary('Krobus', true)).toBe(false)
  })
})

describe('locationAt', () => {
  const stops: Stop[] = [
    { time: 600, place: 'A' },
    { time: 900, place: 'B' },
    { time: 1530, place: 'C' },
  ]
  it('is at home before the first stop', () => {
    expect(locationAt(stops, 500)).toEqual({ place: 'At home', since: null, next: stops[0] })
  })
  it('is on a stop exactly at its time', () => {
    expect(locationAt(stops, 600)).toEqual({ place: 'A', since: 600, next: stops[1] })
  })
  it('is at the earlier stop between stops', () => {
    expect(locationAt(stops, 1000)).toEqual({ place: 'B', since: 900, next: stops[2] })
  })
  it('has no next after the last stop', () => {
    const loc = locationAt(stops, 1560)
    expect(loc).toEqual({ place: 'C', since: 1530 })
    expect('next' in loc).toBe(false)
  })
  it('treats 1500 as before a 1530 stop', () => {
    expect(locationAt([{ time: 1530, place: 'C' }], 1500).since).toBeNull()
    expect(locationAt([{ time: 1530, place: 'C' }], 1530).place).toBe('C')
  })
})
