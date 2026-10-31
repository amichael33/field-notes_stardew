import { describe, it, expect } from 'vitest'
import type { FarmAnimalType, FarmBuilding, FarmCrop, FarmData, PlantedCrop, Season } from './types'
import {
  capacityUsage,
  chainLevels,
  cropOptions,
  harvest,
  harvestDate,
  harvestStatus,
  houseCapacity,
  harvestSummary,
} from './farm'

const parsnip: FarmCrop = { id: 'parsnip', name: 'Parsnip', seeds: 'Parsnip Seeds', seasons: ['spring'], daysToGrow: 4, regrowDays: null }
const bean: FarmCrop = { id: 'bean', name: 'Green Bean', seeds: 'Bean Starter', seasons: ['spring'], daysToGrow: 10, regrowDays: 3 }
const corn: FarmCrop = { id: 'corn', name: 'Corn', seeds: 'Corn Seeds', seasons: ['summer', 'fall'], daysToGrow: 14, regrowDays: 4 }

function planted(crop: string, season: PlantedCrop['season'], day: number): PlantedCrop {
  return { id: 'p1', crop, count: 1, season, day }
}

const building = (id: string, capacity: number | null, upgradesFrom: string | null, cost = 1000): FarmBuilding => ({
  id, name: id, builder: 'Robin', cost, materials: [], buildDays: 2, capacity, upgradesFrom,
})
const buildings = [
  building('Coop', 4, null),
  building('Big Coop', 8, 'Coop'),
  building('Deluxe Coop', 12, 'Big Coop'),
  building('Barn', 4, null),
  building('Well', null, null),
]

describe('harvestDate', () => {
  it('adds growth days to the planting date', () => {
    expect(harvestDate(planted('parsnip', 'spring', 1), parsnip)).toEqual({ season: 'spring', day: 5, finishes: true })
    expect(harvestDate(planted('parsnip', 'spring', 24), parsnip)).toEqual({ season: 'spring', day: 28, finishes: true })
  })

  it('does not finish when crossing into a season the crop cannot grow in', () => {
    expect(harvestDate(planted('parsnip', 'spring', 25), parsnip)).toEqual({ season: 'summer', day: 1, finishes: false })
  })

  it('allows crossing into another valid season', () => {
    expect(harvestDate(planted('corn', 'summer', 20), corn)).toEqual({ season: 'fall', day: 6, finishes: true })
  })

  it('uses regrowDays after a harvest', () => {
    const entry = planted('bean', 'spring', 5)
    expect(harvestDate(entry, bean)).toEqual({ season: 'spring', day: 15, finishes: true })
    const again = harvest(entry, bean, { season: 'spring', day: 15 })
    expect(again?.lastHarvest).toEqual({ season: 'spring', day: 15 })
    expect(harvestDate(again!, bean)).toEqual({ season: 'spring', day: 18, finishes: true })
  })

  it('does not finish past the end of winter in year one', () => {
    const fiber: FarmCrop = { id: 'fiber', name: 'Fiber', seeds: 'Fiber Seeds', seasons: ['spring', 'summer', 'fall', 'winter'], daysToGrow: 7, regrowDays: null }
    expect(harvestDate(planted('fiber', 'winter', 25), fiber).finishes).toBe(false)
    expect(harvestDate(planted('fiber', 'winter', 21), fiber)).toEqual({ season: 'winter', day: 28, finishes: true })
  })

  it('does not finish a regrow that crosses out of season', () => {
    const entry = { ...planted('bean', 'spring', 5), lastHarvest: { season: 'spring' as const, day: 27 } }
    expect(harvestDate(entry, bean)).toEqual({ season: 'summer', day: 2, finishes: false })
  })
})

describe('harvest', () => {
  it('removes a one-time crop', () => {
    expect(harvest(planted('parsnip', 'spring', 1), parsnip, { season: 'spring', day: 5 })).toBeNull()
  })
})

describe('harvestStatus', () => {
  const at = (season: PlantedCrop['season'], day: number) => ({ season, day })
  it('reports ready, tomorrow and later', () => {
    const entry = planted('parsnip', 'spring', 6)
    expect(harvestStatus(entry, parsnip, at('spring', 10))).toBe('ready')
    expect(harvestStatus(entry, parsnip, at('spring', 12))).toBe('ready')
    expect(harvestStatus(entry, parsnip, at('spring', 9))).toBe('tomorrow')
    expect(harvestStatus(entry, parsnip, at('spring', 7))).toBe('later')
  })

  it('puts wont-finish first', () => {
    expect(harvestStatus(planted('parsnip', 'spring', 25), parsnip, at('spring', 26))).toBe('wont-finish')
  })

  it('treats no clock as Spring 1', () => {
    expect(harvestStatus(planted('parsnip', 'spring', 1), parsnip, null)).toBe('later')
    expect(harvestStatus(planted('parsnip', 'spring', 3), parsnip, null)).toBe('later')
  })

  it('marks a crop dead once the calendar enters a season it cannot grow in', () => {
    expect(harvestStatus(planted('parsnip', 'spring', 1), parsnip, at('summer', 3))).toBe('season-over')
    expect(harvestStatus(planted('parsnip', 'spring', 25), parsnip, at('summer', 3))).toBe('season-over')
    const regrow = { ...planted('bean', 'spring', 5), lastHarvest: at('spring', 27) }
    expect(harvestStatus(regrow, bean, at('summer', 2))).toBe('season-over')
  })

  it('keeps a crop alive across a change into another valid season', () => {
    expect(harvestStatus(planted('corn', 'summer', 20), corn, at('fall', 6))).toBe('ready')
  })
})

describe('chains and capacity', () => {
  it('groups chains by root and keeps single buildings alone', () => {
    const chains = chainLevels(buildings)
    expect(chains.Coop.map((b) => b.id)).toEqual(['Coop', 'Big Coop', 'Deluxe Coop'])
    expect(chains.Barn.map((b) => b.id)).toEqual(['Barn'])
    expect(chains.Well.map((b) => b.id)).toEqual(['Well'])
  })

  it('gives house capacity per level', () => {
    expect([0, 1, 2, 3].map((n) => houseCapacity(buildings, { Coop: n }, 'Coop'))).toEqual([0, 4, 8, 12])
    expect(houseCapacity(buildings, {}, 'Barn')).toBe(0)
  })

  it('counts animals by the house their type lives in', () => {
    const types: FarmAnimalType[] = [
      { type: 'White Chicken', house: 'Coop', price: 800, daysToMature: 3 },
      { type: 'White Cow', house: 'Barn', price: 1500, daysToMature: 5 },
    ]
    const farm: FarmData = { buildings: { Coop: 1 }, animals: { 'White Chicken': 3, 'White Cow': 1 }, crops: [], goal: null }
    expect(capacityUsage(farm, buildings, types)).toEqual([
      { house: 'Coop', used: 3, max: 4 },
      { house: 'Barn', used: 1, max: 0 },
    ])
  })
})

describe('harvestSummary', () => {
  const crops: FarmCrop[] = [
    { id: 'parsnip', name: 'Parsnip', seeds: 'Parsnip Seeds', seasons: ['spring'], daysToGrow: 4, regrowDays: null },
    { id: 'potato', name: 'Potato', seeds: 'Potato Seeds', seasons: ['spring'], daysToGrow: 6, regrowDays: null },
    { id: 'bean', name: 'Green Bean', seeds: 'Bean Starter', seasons: ['spring'], daysToGrow: 10, regrowDays: 3 },
    { id: 'cauli', name: 'Cauliflower', seeds: 'Cauliflower Seeds', seasons: ['spring'], daysToGrow: 12, regrowDays: null },
    { id: 'kale', name: 'Kale', seeds: 'Kale Seeds', seasons: ['spring'], daysToGrow: 6, regrowDays: 3 },
  ]
  const at = (id: string, crop: string, day: number, season: Season = 'spring'): PlantedCrop => ({
    id,
    crop,
    count: 10,
    season,
    day,
  })
  const now = { season: 'summer' as Season, day: 3 }

  it('splits entries by status and caps coming at three, sorted by date', () => {
    const today = { season: 'spring' as Season, day: 12 }
    const entries = [
      at('a', 'parsnip', 8),
      at('b', 'potato', 7),
      at('c', 'bean', 5),
      at('d', 'cauli', 5),
      at('e', 'kale', 10),
      at('f', 'kale', 11),
      at('x', 'nope', 1),
    ]
    const s = harvestSummary(entries, crops, today)
    expect(s.ready.map((e) => e.id)).toEqual(['a'])
    expect(s.tomorrow.map((e) => e.id)).toEqual(['b'])
    expect(s.seasonOver).toEqual([])
    expect(s.coming.map((c) => c.entry.id)).toEqual(['c', 'e', 'd'])
    expect(s.coming[0]).toEqual({ entry: entries[2], date: { season: 'spring', day: 15 }, days: 3 })
    expect(s.coming[2].date).toEqual({ season: 'spring', day: 17 })
  })

  it('reports crops that died at the season change', () => {
    const s = harvestSummary([at('d', 'parsnip', 1)], crops, now)
    expect(s.seasonOver.map((e) => e.id)).toEqual(['d'])
    expect(s.ready).toEqual([])
  })
})

describe('cropOptions', () => {
  const rice: FarmCrop = { id: 'rice', name: 'Unmilled Rice', seeds: 'Rice Shoot', seasons: ['spring'], daysToGrow: 8, regrowDays: null }
  const horseradish: FarmCrop = { id: 'horse', name: 'Wild Horseradish', seeds: 'Spring Seeds', seasons: ['spring'], daysToGrow: 7, regrowDays: null }
  const all = [parsnip, corn, horseradish, rice, bean]

  it('filters by season and sorts by label', () => {
    expect(cropOptions(all, 'spring').map((o) => o.label)).toEqual([
      'Green Bean (Bean Starter)',
      'Parsnip',
      'Spring Seeds',
      'Unmilled Rice (Rice Shoot)',
    ])
    expect(cropOptions(all, 'summer').map((o) => o.id)).toEqual(['corn'])
  })

  it('labels seeds that differ and forage mixes by seed name', () => {
    const options = cropOptions(all, 'spring')
    expect(options.find((o) => o.id === 'rice')).toEqual({ id: 'rice', label: 'Unmilled Rice (Rice Shoot)', picture: 'Unmilled Rice' })
    expect(options.find((o) => o.id === 'horse')).toEqual({ id: 'horse', label: 'Spring Seeds', picture: 'Wild Horseradish' })
    expect(options.find((o) => o.id === 'bean')!.label).toBe('Green Bean (Bean Starter)')
    expect(options.find((o) => o.id === 'parsnip')!.label).toBe('Parsnip')
  })
})
