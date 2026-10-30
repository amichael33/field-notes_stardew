import { describe, it, expect } from 'vitest'
import type { FarmBuilding, FarmCrop, FarmData, PlantedCrop } from './types'
import {
  capacityUsage,
  chainLevels,
  harvest,
  harvestDate,
  harvestStatus,
  houseCapacity,
  savingOptions,
  savingProgress,
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
  const h = { season: 'spring' as const, day: 10, finishes: true }
  it('reports ready, tomorrow and later', () => {
    expect(harvestStatus(h, { season: 'spring', day: 10 })).toBe('ready')
    expect(harvestStatus(h, { season: 'spring', day: 12 })).toBe('ready')
    expect(harvestStatus(h, { season: 'spring', day: 9 })).toBe('tomorrow')
    expect(harvestStatus(h, { season: 'spring', day: 3 })).toBe('later')
  })

  it('puts wont-finish first', () => {
    expect(harvestStatus({ ...h, finishes: false }, { season: 'spring', day: 10 })).toBe('wont-finish')
  })

  it('treats no clock as Spring 1', () => {
    expect(harvestStatus({ season: 'spring', day: 2, finishes: true }, null)).toBe('tomorrow')
    expect(harvestStatus(h, null)).toBe('later')
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

  it('counts animals by home', () => {
    const farm = {
      buildings: { Coop: 2, Barn: 1 },
      animals: [
        { id: '1', type: 'Chicken', name: 'a', home: 'Coop' },
        { id: '2', type: 'Chicken', name: 'b', home: 'Coop' },
        { id: '3', type: 'Cow', name: 'c', home: 'Barn' },
      ],
    } as unknown as FarmData
    expect(capacityUsage(farm, buildings)).toEqual([
      { house: 'Coop', used: 2, max: 8 },
      { house: 'Barn', used: 1, max: 4 },
    ])
  })
})

describe('saving', () => {
  const options = savingOptions(buildings, [{ id: 'axe-copper', group: 'tool', label: 'Copper Axe', cost: 2000, materials: [] }])

  it('lists buildings and upgrades', () => {
    expect(options).toContainEqual({ id: 'building:Big Coop', label: 'Big Coop', cost: 1000 })
    expect(options).toContainEqual({ id: 'axe-copper', label: 'Copper Axe', cost: 2000 })
  })

  it('computes and clamps progress', () => {
    const farm = (gold: number, saving: string | null) => ({ gold, saving }) as FarmData
    expect(savingProgress(farm(1000, 'axe-copper'), options)).toEqual({ label: 'Copper Axe', cost: 2000, fraction: 0.5 })
    expect(savingProgress(farm(5000, 'axe-copper'), options)?.fraction).toBe(1)
    expect(savingProgress(farm(5000, null), options)).toBeNull()
    expect(savingProgress(farm(5000, 'nope'), options)).toBeNull()
  })
})
