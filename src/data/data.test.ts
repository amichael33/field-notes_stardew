import { describe, it, expect } from 'vitest'
import bundlesJson from './bundles.json'
import villagersJson from './villagers.json'
import achievementsJson from './achievements.json'
import pathStepsJson from './path-steps.json'
import recipesJson from './recipes.json'
import type { Achievement, Bundle, PathStep, Recipe, Season, Villager } from './types'

const bundles = bundlesJson as Bundle[]
const villagers = villagersJson as Villager[]
const achievements = achievementsJson as Achievement[]
const pathSteps = pathStepsJson as PathStep[]
const recipes = recipesJson as Recipe[]

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']
const validSeasons = (s: Season[] | 'any') => s === 'any' || (s.length > 0 && s.every((x) => SEASONS.includes(x)))

describe('bundles', () => {
  it('every bundle has at least slotsRequired items', () => {
    for (const b of bundles) expect(b.items.length, b.name).toBeGreaterThanOrEqual(b.slotsRequired)
  })
  it('every bundle item has a non-empty source', () => {
    for (const b of bundles) for (const i of b.items) expect(i.source.trim(), `${b.name}/${i.name}`).not.toBe('')
  })
  it('every bundle item has valid seasons', () => {
    for (const b of bundles) for (const i of b.items) expect(validSeasons(i.seasons), `${b.name}/${i.name}`).toBe(true)
  })
  it('bundle ids are unique', () => {
    expect(new Set(bundles.map((b) => b.id)).size).toBe(bundles.length)
  })
})

describe('villagers', () => {
  it('every villager has a valid birthday', () => {
    for (const v of villagers) {
      expect(SEASONS, v.name).toContain(v.birthday.season)
      expect(v.birthday.day, v.name).toBeGreaterThanOrEqual(1)
      expect(v.birthday.day, v.name).toBeLessThanOrEqual(28)
    }
  })
  it('villager names are unique', () => {
    expect(new Set(villagers.map((v) => v.name)).size).toBe(villagers.length)
  })
})

describe('achievements', () => {
  it('every achievement has a non-empty requirement', () => {
    for (const a of achievements) expect(a.requirement.trim(), a.name).not.toBe('')
  })
})

describe('path steps', () => {
  it('order values are unique', () => {
    expect(new Set(pathSteps.map((s) => s.order)).size).toBe(pathSteps.length)
  })
})

describe('recipes', () => {
  it('every recipe has a non-empty source and valid season', () => {
    for (const r of recipes) {
      expect(r.source.trim(), r.name).not.toBe('')
      expect(r.season === 'any' || SEASONS.includes(r.season), r.name).toBe(true)
    }
  })
})

describe('review fixes', () => {
  it('vault bundle rewards are items, not gold amounts', () => {
    const rewards = Object.fromEntries(bundles.filter((b) => b.room === 'Vault').map((b) => [b.id, b.reward]))
    expect(rewards).toEqual({
      'vault-2500': '3 Chocolate Cake',
      'vault-5000': '30 Quality Fertilizer',
      'vault-10000': 'Lightning Rod',
      'vault-25000': 'Crystalarium',
    })
  })
  it('river fish and night fishing rewards match the wiki', () => {
    const reward = (id: string) => bundles.find((b) => b.id === id)!.reward
    expect(reward('river-fish')).toBe('30 Deluxe Bait')
    expect(reward('night-fishing')).toBe('Glow Ring')
  })
})

describe('wiki-generated recipes and achievements', () => {
  it('recipes cover both years of the Queen of Sauce rotation, in order', () => {
    expect(recipes).toHaveLength(32)
    expect(recipes.map((r) => r.order)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1))
    expect(recipes.filter((r) => r.year === 1)).toHaveLength(16)
    expect(recipes.filter((r) => r.year === 2)).toHaveLength(16)
  })
  it('every recipe has an air day and a unique name', () => {
    for (const r of recipes) expect([7, 14, 21, 28], r.name).toContain(r.day)
    expect(new Set(recipes.map((r) => r.name)).size).toBe(recipes.length)
  })
  it('there are 49 achievements with unique names', () => {
    expect(achievements).toHaveLength(49)
    expect(new Set(achievements.map((a) => a.name)).size).toBe(49)
  })
})
