import { describe, it, expect } from 'vitest'
import { bundleItemsBySeason, birthdaysBySeason, sortedPathSteps } from './selectors'
import type { Bundle, Villager, PathStep } from './types'

const bundles: Bundle[] = [
  {
    id: 'b1',
    room: 'Crafts Room',
    name: 'Spring Foraging',
    reward: '30 Spring Seeds',
    slotsRequired: 3,
    items: [
      { name: 'Wild Horseradish', quantity: 1, seasons: ['spring'], source: 'Forage' },
      { name: 'Coal', quantity: 1, seasons: 'any', source: 'Mines' },
      { name: 'Winter Root', quantity: 1, seasons: ['winter'], source: 'Forage' },
    ],
  },
]

const v = (name: string, season: Villager['birthday']['season'], day: number): Villager => ({
  name,
  birthday: { season, day },
  loves: [],
  likes: [],
})

describe('bundleItemsBySeason', () => {
  it("includes 'any' items in every season", () => {
    const names = bundleItemsBySeason(bundles, 'winter').map((r) => r.item.name)
    expect(names).toContain('Coal')
  })

  it('excludes items from other seasons', () => {
    const names = bundleItemsBySeason(bundles, 'spring').map((r) => r.item.name)
    expect(names).toEqual(['Wild Horseradish', 'Coal'])
  })

  it("with 'all' returns every item", () => {
    expect(bundleItemsBySeason(bundles, 'all')).toHaveLength(3)
  })
})

describe('birthdaysBySeason', () => {
  it('sorts by day', () => {
    const list = [v('C', 'spring', 24), v('A', 'spring', 3), v('B', 'spring', 14)]
    expect(birthdaysBySeason(list, 'spring').map((x) => x.name)).toEqual(['A', 'B', 'C'])
  })

  it("'all' orders spring before winter", () => {
    const list = [v('W', 'winter', 1), v('S', 'spring', 28)]
    expect(birthdaysBySeason(list, 'all').map((x) => x.name)).toEqual(['S', 'W'])
  })
})

describe('sortedPathSteps', () => {
  it('orders by order field', () => {
    const steps: PathStep[] = [
      { order: 2, title: 'b', detail: '' },
      { order: 1, title: 'a', detail: '' },
    ]
    expect(sortedPathSteps(steps).map((s) => s.title)).toEqual(['a', 'b'])
  })
})
