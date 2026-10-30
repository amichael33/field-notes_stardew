import { describe, expect, it } from 'vitest'
import { dayIndex, daysUntil, fromIndex, SEASONS } from './calendar'

describe('SEASONS', () => {
  it('lists the seasons in calendar order', () => {
    expect(SEASONS).toEqual(['spring', 'summer', 'fall', 'winter'])
  })
})

describe('dayIndex', () => {
  it('numbers days from spring 1 as 1, with 28 days per season', () => {
    expect(dayIndex('spring', 1)).toBe(1)
    expect(dayIndex('summer', 1)).toBe(29)
    expect(dayIndex('winter', 28)).toBe(112)
  })
})

describe('fromIndex', () => {
  it('converts a day index back to season and day', () => {
    expect(fromIndex(29)).toEqual({ season: 'summer', day: 1 })
    expect(fromIndex(112)).toEqual({ season: 'winter', day: 28 })
  })

  it('wraps past winter 28 into the next spring', () => {
    expect(fromIndex(113)).toEqual({ season: 'spring', day: 1 })
  })
})

describe('daysUntil', () => {
  it('counts forward days from now to the target', () => {
    expect(daysUntil({ season: 'spring', day: 17 }, { season: 'spring', day: 13 })).toBe(4)
  })

  it('is negative when the target is in the past', () => {
    expect(daysUntil({ season: 'spring', day: 13 }, { season: 'spring', day: 17 })).toBe(-4)
  })
})
