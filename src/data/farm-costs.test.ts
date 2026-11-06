import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import icons from './item-icons.json'
import crops from './farm-crops.json'
import { FERTILIZERS, SEED_PRICES, SPRINKLERS, plantCost } from './farm-costs'

describe('plantCost', () => {
  it('prices seeds per tile', () => {
    expect(plantCost('Parsnip Seeds', 50)).toMatchObject({
      seedPrice: 20,
      money: 1000,
      sprinklerCount: 0,
      materials: [],
    })
  })

  it('adds a fertilizer for every tile', () => {
    expect(plantCost('Parsnip Seeds', 10, 'Basic Fertilizer').money).toBe(10 * (20 + 50))
  })

  it('needs one sprinkler per 4, 8 or 24 tiles, rounding up, with its materials', () => {
    const c = plantCost('Parsnip Seeds', 9, undefined, 'Sprinkler')
    expect(c.sprinklerCount).toBe(3)
    expect(c.materials).toEqual([
      { item: 'Copper Bar', amount: 3 },
      { item: 'Iron Bar', amount: 3 },
    ])
    expect(plantCost('Parsnip Seeds', 25, undefined, 'Iridium Sprinkler').sprinklerCount).toBe(2)
    expect(plantCost('Parsnip Seeds', 8, undefined, 'Quality Sprinkler').sprinklerCount).toBe(1)
  })

  it('has no seed price for seeds Pierre does not sell', () => {
    expect(plantCost('Strawberry Seeds', 5).seedPrice).toBeNull()
    expect(plantCost('Strawberry Seeds', 5).money).toBe(0)
  })
})

describe('farm cost data', () => {
  it('only prices seeds that a crop uses', () => {
    const names = new Set(crops.map((c) => c.seeds))
    for (const s of Object.keys(SEED_PRICES)) expect(names.has(s), s).toBe(true)
  })

  it('has an icon for every seed, fertilizer, sprinkler and material', () => {
    const map = icons as Record<string, string | null>
    const names = [
      ...Object.keys(SEED_PRICES),
      ...FERTILIZERS.map((f) => f.name),
      ...SPRINKLERS.flatMap((s) => [s.name, ...s.materials.map((m) => m.item)]),
    ]
    for (const n of names) {
      expect(map[n], n).toBeTruthy()
      expect(existsSync(`public/${map[n]}`), n).toBe(true)
    }
  })
})
