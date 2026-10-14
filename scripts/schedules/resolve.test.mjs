import { describe, expect, it } from 'vitest'
import { isKeptKey, parseRule, parseTime, resolveRules } from './resolve.mjs'

const name = (id) =>
  ({ SeedShop: "Pierre's General Store", Beach: 'The Beach', bed: 'At home', SebastianRoom: "Sebastian's room", HaleyHouse: "Haley and Emily's house" })[id] ?? (() => { throw new Error(`Unmapped ${id}`) })()

describe('parseTime', () => {
  it('converts game time tokens to minutes', () => {
    expect(parseTime('630')).toBe(390)
    expect(parseTime('2530')).toBe(1530)
    expect(parseTime('a1200')).toBe(720)
  })
})

describe('parseRule', () => {
  it('drops coordinates, facing, animations and dialogue', () => {
    expect(parseRule('900 SeedShop 39 5 0/1100 Beach 13 39 2 "Strings\a:b"', name)).toEqual([
      { time: 540, place: "Pierre's General Store" },
      { time: 660, place: 'The Beach' },
    ])
  })
  it('keeps animation stops and maps bed to At home', () => {
    expect(parseRule('2200 SeedShop 1 9 3 abigail_sleep/2400 bed', name)).toEqual([
      { time: 1320, place: "Pierre's General Store" },
      { time: 1440, place: 'At home' },
    ])
  })
  it('treats NOT friendship as true at 0 hearts', () => {
    expect(parseRule('NOT friendship Sebastian 6/1000 SebastianRoom 5 4 2', name)).toEqual([
      { time: 600, place: "Sebastian's room" },
    ])
  })
  it('follows only the not-received branch of a MAIL rule', () => {
    // Leah summer: no bridge yet, so the not-received GOTO applies.
    expect(parseRule('MAIL beachBridgeFixed/GOTO summer_noBridge/900 LeahHouse 3 7 3/1200 Beach 72 18 2', name)).toEqual({
      goto: 'summer_noBridge',
    })
    // Emily fall_15: the Desert trip is the received (ccVault) branch.
    expect(parseRule('MAIL ccVault/GOTO spring/900 HaleyHouse 16 5 2/1300 Desert 1 51 2/2400 bed', name)).toEqual({ goto: 'spring' })
    // Alex Sun: the sports room is the received branch.
    expect(parseRule('MAIL saloonSportsRoom/GOTO Sun_normal/800 Town 64 64 2/1100 Saloon 32 7 0', name)).toEqual({ goto: 'Sun_normal' })
    // A not-received branch that is a stop, not a GOTO.
    expect(parseRule('MAIL x/900 SeedShop 1 1 0/1000 Beach 1 1 0', name)).toEqual([{ time: 540, place: "Pierre's General Store" }])
    expect(parseRule('MAIL x/GOTO NO_SCHEDULE/800 Beach 1 1 0', name)).toBeNull()
  })
  it('merges consecutive stops at the same place, keeping the first time', () => {
    expect(parseRule('900 SeedShop 1 1 0/1000 SeedShop 2 2 0/1200 Beach 1 1 0/1300 bed/1400 bed/1500 Beach 1 1 0/1600 Beach 3 3 0', name)).toEqual([
      { time: 540, place: "Pierre's General Store" },
      { time: 720, place: 'The Beach' },
      { time: 780, place: 'At home' },
      { time: 900, place: 'The Beach' },
    ])
    // A trailing repeat merges into the previous stop without losing the last place.
    expect(parseRule('900 Beach 1 1 0/1000 35 25 0', name)).toEqual([{ time: 540, place: 'The Beach' }])
  })
  it('reuses the previous map when a stop has no map id', () => {
    expect(parseRule('900 SeedShop 1 1 0/1000 Beach 1 1 0/1100 35 25 0/1200 bed', name)).toEqual([
      { time: 540, place: "Pierre's General Store" },
      { time: 600, place: 'The Beach' },
      { time: 720, place: 'At home' },
    ])
  })
  it('throws on a bad or missing time token', () => {
    expect(() => parseTime('abc')).toThrow(/bad time/)
    expect(() => parseRule(' Beach 1 1 0', name)).toThrow()
    expect(() => parseRule('900', name)).toThrow(/no place/)
  })
  it('returns null for NO_SCHEDULE and a goto for GOTO', () => {
    expect(parseRule('GOTO NO_SCHEDULE', name)).toBeNull()
    expect(parseRule('NOT friendship Sam 6/GOTO 11', name)).toEqual({ goto: '11' })
  })
})

describe('resolveRules', () => {
  it('follows GOTO, chains, and all raw keys', () => {
    const { rules, errors } = resolveRules(
      { rain: 'GOTO spring', spring: '700 SeedShop 10 20 0', a: 'GOTO rain', Wed: 'GOTO 11', 11: '1000 Beach 1 1 0' },
      name,
    )
    expect(errors).toEqual([])
    expect(rules.rain).toEqual([{ time: 420, place: "Pierre's General Store" }])
    expect(rules.a).toEqual(rules.rain)
    expect(rules.Wed).toEqual([{ time: 600, place: 'The Beach' }])
  })
  it('reports loops and missing targets', () => {
    const { rules, errors } = resolveRules({ a: 'GOTO b', b: 'GOTO a', c: 'GOTO nowhere' }, name)
    expect(rules).toEqual({})
    expect(errors).toHaveLength(3)
  })
  it('resolves the real MAIL rules to their not-received schedules', () => {
    const { rules, errors } = resolveRules(
      {
        summer: 'MAIL beachBridgeFixed/GOTO summer_noBridge/900 SeedShop 1 1 0/1200 Beach 72 18 2',
        summer_noBridge: '900 SeedShop 3 7 3/1200 Beach 38 24 2',
        fall_15: 'MAIL ccVault/GOTO spring/900 HaleyHouse 16 5 2/1300 Beach 1 51 2',
        spring: '900 HaleyHouse 16 5 2/2430 bed',
      },
      name,
    )
    expect(errors).toEqual([])
    expect(rules.summer).toEqual(rules.summer_noBridge)
    expect(rules.fall_15).toEqual(rules.spring)
  })
  it('omits rules that end in the dynamic GOTO season, without an error', () => {
    const { rules, errors, failed } = resolveRules(
      { Sun: 'MAIL saloonSportsRoom/GOTO Sun_normal/1100 Saloon 32 7 0', Sun_normal: 'GOTO season', spring: '900 Beach 1 1 0' },
      name,
    )
    expect(errors).toEqual([])
    expect(failed).toEqual([])
    expect(Object.keys(rules)).toEqual(['spring'])
  })
  it('still fails on any other unresolved GOTO', () => {
    const { failed } = resolveRules({ Sun: 'GOTO Sun_other' }, name)
    expect(failed).toEqual([{ key: 'Sun', message: 'unresolved GOTO target "Sun_other"' }])
  })
  it('omits NO_SCHEDULE rules', () => {
    const { rules, errors } = resolveRules({ a: 'GOTO NO_SCHEDULE' }, name)
    expect(rules).toEqual({})
    expect(errors).toEqual([])
  })
})

describe('isKeptKey', () => {
  it('keeps weekday, season, rain and day-of-month rules', () => {
    for (const k of ['rain', 'rain2', 'spring_4', 'fall_Mon', 'Fri', 'spring', 'default']) expect(isKeptKey(k)).toBe(true)
  })
  it('keeps bare numbers as day-of-month rules', () => {
    for (const k of ['6', '11', '3', '23']) expect(isKeptKey(k)).toBe(true)
  })
  it('drops heart, marriage, festival and special rules', () => {
    for (const k of ['11_6', '25_6', 'Wed_6', 'GreenRain', 'marriage_Mon', 'DesertFestival_1', 'Sun_normal', 'SquidFest', 'bus'])
      expect(isKeptKey(k)).toBe(false)
  })
})
