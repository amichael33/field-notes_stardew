import { describe, it, expect } from 'vitest'
import { bundleItemsBySeason, birthdaysBySeason, sortedPathSteps, firstUnchecked, pathId, peopleToVisit, bundleItemId, bundleProgress } from './selectors'
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

describe('firstUnchecked', () => {
  const steps: PathStep[] = [
    { order: 2, title: 'b', detail: '' },
    { order: 1, title: 'a', detail: '' },
    { order: 3, title: 'c', detail: '' },
  ]

  it('returns the lowest order step not checked', () => {
    expect(pathId(steps[1])).toBe('path:1')
    expect(firstUnchecked(steps, ['path:1'])?.title).toBe('b')
    expect(firstUnchecked(steps, [])?.title).toBe('a')
  })

  it('returns undefined when all are checked', () => {
    expect(firstUnchecked(steps, ['path:1', 'path:2', 'path:3'])).toBeUndefined()
  })
})

describe('peopleToVisit', () => {
  const villagers = [v('Willy', 'summer', 24), v('Pierre', 'spring', 26), v('Sam', 'summer', 17)]
  const steps: PathStep[] = [
    { order: 2, title: 'Meet the town', detail: 'Say hello.' },
    { order: 3, title: 'Get your fishing pole from Willy', detail: 'Go to the beach.' },
    { order: 9, title: 'Save', detail: "Upgrade at Pierre's General Store." },
  ]

  it('finds a villager named in an unchecked step', () => {
    const result = peopleToVisit(steps, [], villagers)
    expect(result.map((r) => r.who)).toContain('Willy')
  })

  it('attributes a shop phrase to its owner', () => {
    const result = peopleToVisit(steps, [], [])
    expect(result).toEqual([{ who: 'Pierre', step: steps[2] }])
  })

  it('is empty once step 2 is checked', () => {
    expect(peopleToVisit(steps, ['path:2'], villagers)).toEqual([])
  })

  it('ignores checked steps', () => {
    const result = peopleToVisit(steps, ['path:3'], villagers)
    expect(result.map((r) => r.who)).not.toContain('Willy')
    expect(result.map((r) => r.who)).toContain('Pierre')
  })

  it('is empty when no step mentions anyone', () => {
    const plain: PathStep[] = [{ order: 1, title: 'Plant', detail: 'Water the crops.' }]
    expect(peopleToVisit(plain, [], villagers)).toEqual([])
  })
})

describe('bundleItemId', () => {
  it('joins bundle id and item name', () => {
    expect(bundleItemId(bundles[0], bundles[0].items[1])).toBe('bundle:b1:Coal')
  })
})

describe('bundleProgress', () => {
  const b = bundles[0]
  it('counts obtained items across all items', () => {
    const p = bundleProgress(b, ['bundle:b1:Coal', 'bundle:b1:Winter Root'])
    expect(p).toEqual({ obtained: 2, required: 3, complete: false })
  })
  it('is complete once obtained reaches slotsRequired even with items left', () => {
    const two = { ...b, slotsRequired: 2 }
    const ticked = b.items.slice(0, 2).map((i) => bundleItemId(b, i))
    expect(bundleProgress(two, ticked)).toEqual({ obtained: 2, required: 2, complete: true })
  })
  it('is not complete below slotsRequired', () => {
    expect(bundleProgress(b, ['bundle:b1:Coal']).complete).toBe(false)
  })
  it('ignores checked ids for unknown items', () => {
    expect(bundleProgress(b, ['bundle:b1:Nope', 'bundle:other:Coal']).obtained).toBe(0)
  })
})
