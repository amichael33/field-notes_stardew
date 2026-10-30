import { describe, expect, it } from 'vitest'
import { animalFrom, buildingFrom, cropFrom, KEEP_BUILDINGS } from './resolve.mjs'

const objects = {
  388: { Name: 'Wood' },
  390: { Name: 'Stone' },
  473: { Name: 'Bean Starter' },
  188: { Name: 'Green Bean' },
}

describe('buildingFrom', () => {
  it('resolves name, materials, capacity and upgrade source', () => {
    const raw = {
      Name: '[LocalizedText Strings\Buildings:BigCoop_Name]',
      Builder: 'Robin',
      BuildCost: 10000,
      BuildMaterials: [
        { ItemId: '(O)388', Amount: 400 },
        { ItemId: '(O)390', Amount: 150 },
      ],
      BuildDays: 2,
      MaxOccupants: 8,
      BuildingToUpgrade: 'Coop',
    }
    expect(buildingFrom('Big Coop', raw, { BigCoop_Name: 'Big Coop' }, objects)).toEqual({
      id: 'Big Coop',
      name: 'Big Coop',
      builder: 'Robin',
      cost: 10000,
      materials: [
        { item: 'Wood', amount: 400 },
        { item: 'Stone', amount: 150 },
      ],
      buildDays: 2,
      capacity: 8,
      upgradesFrom: 'Coop',
    })
  })

  it('has null capacity outside the Coop and Barn chains', () => {
    const raw = {
      Name: '[LocalizedText Strings\Buildings:Shed_Name]',
      Builder: 'Robin',
      BuildCost: 15000,
      BuildMaterials: null,
      BuildDays: 2,
      MaxOccupants: 20,
      BuildingToUpgrade: null,
    }
    const b = buildingFrom('Shed', raw, { Shed_Name: 'Shed' }, objects)
    expect(b.capacity).toBeNull()
    expect(b.materials).toEqual([])
    expect(b.upgradesFrom).toBeNull()
  })

  it('throws naming the id when a material is unknown', () => {
    const raw = {
      Name: 'Plain',
      Builder: 'Robin',
      BuildCost: 1,
      BuildMaterials: [{ ItemId: '(O)999', Amount: 1 }],
      BuildDays: 1,
      MaxOccupants: 0,
      BuildingToUpgrade: null,
    }
    expect(() => buildingFrom('Well', raw, {}, objects)).toThrow(/999/)
  })

  it('keeps the buildable list', () => {
    expect(KEEP_BUILDINGS.has('Big Coop')).toBe(true)
    expect(KEEP_BUILDINGS.has('Gold Clock')).toBe(true)
    expect(KEEP_BUILDINGS.has('Greenhouse')).toBe(false)
  })
})

describe('cropFrom', () => {
  const raw = { Seasons: ['Spring'], DaysInPhase: [1, 1, 1, 3, 4], RegrowDays: 3, HarvestItemId: '188' }

  it('sums growth phases and resolves names', () => {
    expect(cropFrom('473', raw, objects)).toEqual({
      id: '473',
      name: 'Green Bean',
      seeds: 'Bean Starter',
      seasons: ['spring'],
      daysToGrow: 10,
      regrowDays: 3,
    })
  })

  it('maps no regrowth to null', () => {
    expect(cropFrom('473', { ...raw, RegrowDays: -1 }, objects).regrowDays).toBeNull()
  })
})

describe('animalFrom', () => {
  it('maps a non-sold animal price to null', () => {
    expect(animalFrom('Brown Chicken', { House: 'Coop', PurchasePrice: -1, DaysToMature: 3 })).toEqual({
      type: 'Brown Chicken',
      house: 'Coop',
      price: null,
      daysToMature: 3,
    })
  })

  it('doubles the game file price to the shop price', () => {
    expect(animalFrom('Cow', { House: 'Barn', PurchasePrice: 750, DaysToMature: 5 }).price).toBe(1500)
  })
})
