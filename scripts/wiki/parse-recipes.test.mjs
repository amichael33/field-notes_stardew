// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseQueenOfSauce } from './parse-recipes.mjs'

const wikitext = readFileSync(new URL('./fixtures/QueenOfSauce.wikitext', import.meta.url), 'utf8')
const recipes = parseQueenOfSauce(wikitext)
const byName = (name) => recipes.find((r) => r.name === name)

describe('parseQueenOfSauce', () => {
  it('finds all 32 recipes of the two-year rotation, in air order', () => {
    expect(recipes).toHaveLength(32)
    expect(recipes.map((r) => r.order)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1))
    expect(recipes[0]).toMatchObject({ order: 1, name: 'Stir Fry', season: 'spring', year: 1, day: 7 })
    expect(recipes[15]).toMatchObject({ name: 'Cranberry Candy', season: 'winter', year: 1, day: 28 })
    expect(recipes[16]).toMatchObject({ year: 2, season: 'spring', day: 7 })
    expect(recipes[31]).toMatchObject({ year: 2, season: 'winter', day: 28 })
  })

  it('airs on the 7th, 14th, 21st and 28th of each season', () => {
    for (const r of recipes) expect([7, 14, 21, 28], r.name).toContain(r.day)
    expect(recipes.filter((r) => r.year === 1)).toHaveLength(16)
  })

  it('is sorted by year, then season, then day', () => {
    const seasons = ['spring', 'summer', 'fall', 'winter']
    const key = (r) => r.year * 1000 + seasons.indexOf(r.season) * 100 + r.day
    expect(recipes.map(key)).toEqual([...recipes.map(key)].sort((a, b) => a - b))
  })

  it('writes the source with the air date', () => {
    expect(byName('Stir Fry').source).toBe('The Queen of Sauce, Spring 7, Year 1')
  })

  it('adds other ways to get the recipe', () => {
    expect(byName('Omelet').source).toBe('The Queen of Sauce, Spring 28, Year 1; also Stardrop Saloon for 100g')
  })

  it('has unique names and a source for every recipe', () => {
    expect(new Set(recipes.map((r) => r.name)).size).toBe(32)
    for (const r of recipes) expect(r.source.trim(), r.name).not.toBe('')
  })
})
