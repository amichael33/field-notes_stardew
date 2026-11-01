import { describe, expect, it } from 'vitest'
import animals from './farm-animals.json'
import buildings from './farm-buildings.json'
import crops from './farm-crops.json'
import upgrades from './farm-upgrades.json'
import icons from './item-icons.json'
import sprites from './farm-sprites.json'
import type { FarmAnimalType, FarmBuilding, FarmCrop, FarmUpgrade } from './types'

const farmBuildings = buildings as FarmBuilding[]
const farmCrops = crops as FarmCrop[]
const farmAnimals = animals as FarmAnimalType[]
const farmUpgrades = upgrades as FarmUpgrade[]

const unique = (xs: string[]) => new Set(xs).size === xs.length

describe('farm buildings', () => {
  it('upgradesFrom names another building', () => {
    const ids = new Set(farmBuildings.map((b) => b.id))
    for (const b of farmBuildings) {
      if (b.upgradesFrom)
        expect(ids.has(b.upgradesFrom), `${b.id} upgrades from ${b.upgradesFrom}`).toBe(true)
    }
  })

  it('every material has an icon', () => {
    const missing = farmBuildings
      .flatMap((b) => b.materials.map((m) => m.item))
      .filter((item) => !(item in icons))
    expect(missing).toEqual([])
  })

  it('every house upgrade material has an icon', () => {
    const missing = farmUpgrades
      .flatMap((u) => u.materials.map((m) => m.item))
      .filter((item) => !(item in icons))
    expect(missing).toEqual([])
  })

  it('every crop has a picture', () => {
    const missing = farmCrops.map((c) => c.name).filter((name) => !(name in icons))
    expect(missing).toEqual([])
  })

  it('has unique ids', () => {
    expect(unique(farmBuildings.map((b) => b.id))).toBe(true)
  })

  it('Coop and Barn chains hold 4, 8, 12', () => {
    const cap = (id: string) => farmBuildings.find((b) => b.id === id)?.capacity
    expect([cap('Coop'), cap('Big Coop'), cap('Deluxe Coop')]).toEqual([4, 8, 12])
    expect([cap('Barn'), cap('Big Barn'), cap('Deluxe Barn')]).toEqual([4, 8, 12])
  })
})

describe('farm animals', () => {
  it('every animal matures in at least a day', () => {
    for (const a of farmAnimals) expect(a.daysToMature, a.type).toBeGreaterThanOrEqual(1)
  })

  it('uses shop prices', () => {
    const price = (t: string) => farmAnimals.find((a) => a.type === t)?.price
    expect(price('White Chicken')).toBe(800)
    expect(price('White Cow')).toBe(1500)
  })

  it('has unique types', () => {
    expect(unique(farmAnimals.map((a) => a.type))).toBe(true)
  })
})

describe('farm crops', () => {
  it('has unique ids', () => {
    expect(unique(farmCrops.map((c) => c.id))).toBe(true)
  })

  it('every crop grows in at least one season in at least a day', () => {
    for (const c of farmCrops) {
      expect(c.daysToGrow, c.name).toBeGreaterThanOrEqual(1)
      expect(c.seasons.length, c.name).toBeGreaterThan(0)
    }
  })
})

describe('farm upgrades', () => {
  it('keeps only the three house upgrades', () => {
    expect(farmUpgrades.map((u) => u.id)).toEqual(['house:1', 'house:2', 'house:3'])
  })

  it('has unique ids', () => {
    expect(unique(farmUpgrades.map((u) => u.id))).toBe(true)
  })

  it('every upgrade costs something', () => {
    for (const u of farmUpgrades) expect(u.cost, u.id).toBeGreaterThan(0)
  })
})

// Ids with no sprite (texture missing from the unpacked game). Say why next to each id.
const UNSPRITED = new Set<string>([])

describe('farm sprites', () => {
  const spriteMap = sprites as { buildings: Record<string, string>; animals: Record<string, string> }

  it('has a sprite for every building', () => {
    const missing = farmBuildings
      .map((b) => b.id)
      .filter((id) => !spriteMap.buildings[id] && !UNSPRITED.has(id))
    expect(missing).toEqual([])
  })

  it('has the farmhouse picture used for every house upgrade', () => {
    expect(spriteMap.buildings.Farmhouse).toBe('farm/buildings/Farmhouse.png')
  })

  it('has a sprite for every animal type', () => {
    const missing = farmAnimals.map((a) => a.type).filter((t) => !spriteMap.animals[t] && !UNSPRITED.has(t))
    expect(missing).toEqual([])
  })
})
