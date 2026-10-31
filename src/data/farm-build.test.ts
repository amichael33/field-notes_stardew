import { describe, expect, it } from 'vitest'
import { build, buildable, goalReached, nextUpgrade, ownedTiles, targetById, unbuild } from './farm-build'
import type { FarmBuilding, FarmData, FarmUpgrade } from './types'

const b = (id: string, cost: number, upgradesFrom: string | null = null): FarmBuilding => ({
  id,
  name: id,
  builder: 'Robin',
  cost,
  materials: [],
  buildDays: 2,
  capacity: 0,
  upgradesFrom,
})

const buildings = [
  b('Coop', 4000),
  b('Big Coop', 10000, 'Coop'),
  b('Deluxe Coop', 20000, 'Big Coop'),
  b('Well', 1000),
  b('Cabin', 100),
]

const upgrades: FarmUpgrade[] = [
  { id: 'house:1', group: 'house', label: 'Kitchen', cost: 10000, materials: [] },
  { id: 'house:2', group: 'house', label: "Children's room", cost: 65000, materials: [] },
]

const farm = (owned: Record<string, number> = {}, goal: string | null = null): FarmData => ({
  buildings: owned,
  animals: {},
  crops: [],
  goal,
})

describe('farm build helpers', () => {
  it('lists buildable targets by cost', () => {
    expect(buildable({}, buildings, upgrades).map((t) => t.id)).toEqual(['Cabin', 'Well', 'Coop', 'house:1'])
  })

  it('builds a chain level and offers the next one', () => {
    const next = build(farm(), 'Coop', buildings, upgrades)
    expect(next.buildings).toEqual({ Coop: 1 })
    expect(buildable(next.buildings, buildings, upgrades).map((t) => t.id)).toContain('Big Coop')
    expect(buildable(next.buildings, buildings, upgrades).map((t) => t.id)).not.toContain('Coop')
    expect(ownedTiles(next.buildings, buildings, upgrades)).toEqual([
      { key: 'Coop', id: 'Coop', name: 'Coop', count: 1 },
    ])
  })

  it('building the goal clears it and sets the chain level', () => {
    const next = build(farm({ Coop: 1 }, 'Big Coop'), 'Big Coop', buildings, upgrades)
    expect(next.buildings.Coop).toBe(2)
    expect(next.goal).toBeNull()
  })

  it('counts, singles and house upgrades', () => {
    let f = build(farm(), 'Cabin', buildings, upgrades)
    f = build(f, 'Cabin', buildings, upgrades)
    f = build(f, 'Well', buildings, upgrades)
    f = build(f, 'house:1', buildings, upgrades)
    expect(f.buildings).toEqual({ Cabin: 2, Well: 1, 'house:1': 1 })
    expect(ownedTiles(f.buildings, buildings, upgrades).map((t) => [t.key, t.count])).toEqual([
      ['Well', 1],
      ['Cabin', 2],
      ['house:1', 1],
    ])
    expect(buildable(f.buildings, buildings, upgrades).map((t) => t.id)).toEqual(['Cabin', 'Coop', 'house:2'])
  })

  it('unbuilds one level and keeps the goal', () => {
    const next = unbuild(farm({ Coop: 2 }, 'Deluxe Coop'), 'Coop', buildings)
    expect(next.buildings.Coop).toBe(1)
    expect(next.goal).toBe('Deluxe Coop')
  })

  it('deletes emptied entries', () => {
    expect(unbuild(farm({ Cabin: 1 }), 'Cabin', buildings).buildings).toEqual({})
    expect(unbuild(farm({ Coop: 1 }), 'Coop', buildings).buildings).toEqual({})
  })

  it('removing an earlier house upgrade removes later ones', () => {
    const next = unbuild(farm({ 'house:1': 1, 'house:2': 1 }), 'house:1', buildings)
    expect(next.buildings).toEqual({})
  })

  it('has no next upgrade past the top of a chain', () => {
    expect(nextUpgrade('Coop', { Coop: 3 }, buildings, upgrades)).toBeUndefined()
    expect(nextUpgrade('Coop', { Coop: 1 }, buildings, upgrades)?.id).toBe('Big Coop')
    expect(nextUpgrade('house:1', { 'house:1': 1 }, buildings, upgrades)?.id).toBe('house:2')
    expect(nextUpgrade('Well', { Well: 1 }, buildings, upgrades)).toBeUndefined()
  })

  it('describes house upgrades as targets', () => {
    expect(targetById('house:2', buildings, upgrades)).toMatchObject({
      builder: 'Robin',
      cost: 65000,
      buildDays: 3,
    })
    expect(targetById('Nope', buildings, upgrades)).toBeUndefined()
  })

  it('knows when a goal is reached', () => {
    expect(goalReached(farm(), 'Big Coop', buildings, upgrades)).toBe(false)
    expect(goalReached(farm({ Coop: 1 }), 'Big Coop', buildings, upgrades)).toBe(false)
    expect(goalReached(farm({ Coop: 2 }), 'Big Coop', buildings, upgrades)).toBe(true)
    expect(goalReached(farm({ Coop: 3 }), 'Big Coop', buildings, upgrades)).toBe(true)
    expect(goalReached(farm({ Cabin: 1 }), 'Cabin', buildings, upgrades)).toBe(true)
    expect(goalReached(farm(), 'Cabin', buildings, upgrades)).toBe(false)
    expect(goalReached(farm({ Well: 1 }), 'Well', buildings, upgrades)).toBe(true)
    expect(goalReached(farm(), 'Well', buildings, upgrades)).toBe(false)
    expect(goalReached(farm({ 'house:1': 1 }), 'house:1', buildings, upgrades)).toBe(true)
    expect(goalReached(farm({ 'house:1': 1 }), 'house:2', buildings, upgrades)).toBe(false)
  })
})
