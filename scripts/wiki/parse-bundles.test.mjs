// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseBundles } from './parse-bundles.mjs'

const wikitext = readFileSync(new URL('./fixtures/Bundles.wikitext', import.meta.url), 'utf8')
const bundles = parseBundles(wikitext)
const byId = (id) => bundles.find((b) => b.id === id)

describe('parseBundles', () => {
  it('finds every standard bundle plus the Missing Bundle', () => {
    expect(bundles).toHaveLength(31)
    expect(new Set(bundles.map((b) => b.id)).size).toBe(31)
  })

  it('groups bundles by room in page order', () => {
    expect([...new Set(bundles.map((b) => b.room))]).toEqual([
      'Crafts Room', 'Pantry', 'Fish Tank', 'Boiler Room', 'Bulletin Board', 'Vault', 'Abandoned JojaMart',
    ])
  })

  it('reads a simple bundle: name, slots, items with sources, and reward', () => {
    const b = byId('spring-foraging')
    expect(b.name).toBe('Spring Foraging')
    expect(b.room).toBe('Crafts Room')
    expect(b.slotsRequired).toBe(4)
    expect(b.reward).toBe('30 Spring Seeds')
    expect(b.items.map((i) => i.name)).toEqual(['Wild Horseradish', 'Daffodil', 'Leek', 'Dandelion'])
    expect(b.items[1].source).toBe('Spring Foraging, buy from Pierre at Flower Dance')
  })

  it('reads item quantities from the Name template', () => {
    const b = byId('adventurers')
    expect(b.slotsRequired).toBe(2)
    expect(b.reward).toBe('Small Magnet Ring')
    expect(b.items.find((i) => i.name === 'Slime').quantity).toBe(99)
    expect(b.items.find((i) => i.name === 'Bat Wing').quantity).toBe(10)
    expect(b.items.find((i) => i.name === 'Void Essence').quantity).toBe(1)
  })

  it('reads quality items with their quantity', () => {
    const b = byId('quality-crops')
    expect(b.slotsRequired).toBe(3)
    expect(b.reward).toBe('Preserves Jar')
    expect(b.items[0]).toMatchObject({ name: 'Parsnip (gold quality)', quantity: 5 })
  })

  it('reads a reward written as a link with a count', () => {
    expect(byId('river-fish').reward).toBe('30 Deluxe Bait')
  })

  it('reads the Vault bundles as gold purchases with item rewards', () => {
    const b = byId('vault-2500')
    expect(b.room).toBe('Vault')
    expect(b.reward).toBe('3 Chocolate Cake')
    expect(b.slotsRequired).toBe(1)
    expect(b.items).toEqual([{ name: '2,500g', quantity: 1, source: 'Gold' }])
    expect(byId('vault-25000').items[0].name).toBe('25,000g')
  })

  it('reads the Missing Bundle despite its nested tables', () => {
    const b = byId('missing-bundle')
    expect(b.slotsRequired).toBe(5)
    expect(b.items).toHaveLength(6)
    expect(b.items.map((i) => i.name)).toContain('Wine (silver quality or better)')
    expect(b.items.map((i) => i.name)).toContain('Caviar')
    expect(b.items.find((i) => i.name === 'Ancient Fruit (gold quality)').quantity).toBe(5)
  })

  it('reads items written with a link argument and a nested pipe template', () => {
    const names = byId('artisan').items.map((i) => i.name)
    expect(names).toHaveLength(12)
    expect(names).toContain('Jelly')
    expect(byId('animal').items.map((i) => i.name)).toEqual([
      'Large Milk', 'Large Brown Egg', 'Large Egg', 'Large Goat Milk', 'Wool', 'Duck Egg',
    ])
  })

  it("restores the in-game name of the Beach warp totem, which the wiki writes without its colon", () => {
    expect(byId('ocean-fish').reward).toBe('5 Warp Totem: Beach')
  })

  it("uses the room's reward when a bundle has none of its own", () => {
    expect(byId('missing-bundle').reward).toBe('Movie Theater')
  })

  it('marks qualities the wiki says are accepted or better', () => {
    const names = byId('missing-bundle').items.map((i) => i.name)
    expect(names).toContain('Void Salmon (gold quality or better)')
    expect(names).toContain('Ancient Fruit (gold quality)')
  })

  it('every bundle has at least as many items as slots and a non-empty source on each item', () => {
    for (const b of bundles) {
      expect(b.items.length, b.id).toBeGreaterThanOrEqual(b.slotsRequired)
      for (const i of b.items) expect(i.source.trim(), `${b.id}/${i.name}`).not.toBe('')
    }
  })
})
