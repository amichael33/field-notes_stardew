import { dayIndex, daysUntil, fromIndex } from './calendar'
import type { SeasonDay } from './calendar'
import type { FarmAnimalType, FarmBuilding, FarmCrop, FarmData, PlantedCrop, Season } from './types'

export type Harvest = { season: Season; day: number; finishes: boolean }

export type HarvestStatus = 'ready' | 'tomorrow' | 'later' | 'wont-finish' | 'season-over'

const LAST_DAY_OF_YEAR = 112

export function harvestDate(entry: PlantedCrop, crop: FarmCrop): Harvest {
  const regrowing = entry.lastHarvest !== undefined && crop.regrowDays !== null
  const from = regrowing ? entry.lastHarvest! : entry
  const days = regrowing ? crop.regrowDays! : crop.daysToGrow
  const index = dayIndex(from.season, from.day) + days
  const date = fromIndex(index)
  // The tracker covers year one: past Winter 28 the crop is out of reach
  return { ...date, finishes: index <= LAST_DAY_OF_YEAR && crop.seasons.includes(date.season) }
}

/** True when, between the crop's start date and today, the calendar entered a season it cannot grow in. */
function diedOfSeason(entry: PlantedCrop, crop: FarmCrop, now: SeasonDay): boolean {
  const regrowing = entry.lastHarvest !== undefined && crop.regrowDays !== null
  const from = regrowing ? entry.lastHarvest! : entry
  const end = dayIndex(now.season, now.day)
  for (let index = dayIndex(from.season, from.day) + 1; index <= end; index++) {
    const date = fromIndex(index)
    if (date.day === 1 && !crop.seasons.includes(date.season)) return true
  }
  return false
}

export function harvestStatus(entry: PlantedCrop, crop: FarmCrop, now: SeasonDay | null): HarvestStatus {
  const today = now ?? { season: 'spring' as const, day: 1 }
  if (diedOfSeason(entry, crop, today)) return 'season-over'
  const h = harvestDate(entry, crop)
  if (!h.finishes) return 'wont-finish'
  const left = daysUntil(h, today)
  if (left <= 0) return 'ready'
  return left === 1 ? 'tomorrow' : 'later'
}

export function harvest(entry: PlantedCrop, crop: FarmCrop, now: SeasonDay): PlantedCrop | null {
  if (crop.regrowDays === null) return null
  return { ...entry, lastHarvest: { season: now.season, day: now.day } }
}

export function chainLevels(buildings: FarmBuilding[]): Record<string, FarmBuilding[]> {
  const chains: Record<string, FarmBuilding[]> = {}
  for (const root of buildings.filter((b) => b.upgradesFrom === null)) {
    const chain = [root]
    let next = buildings.find((b) => b.upgradesFrom === root.id)
    while (next) {
      chain.push(next)
      const id = next.id
      next = buildings.find((b) => b.upgradesFrom === id)
    }
    chains[root.id] = chain
  }
  return chains
}

export function houseCapacity(
  buildings: FarmBuilding[],
  owned: Record<string, number>,
  house: 'Coop' | 'Barn',
): number {
  const level = owned[house] ?? 0
  if (level <= 0) return 0
  return chainLevels(buildings)[house]?.[level - 1]?.capacity ?? 0
}

export function capacityUsage(
  farm: FarmData,
  buildings: FarmBuilding[],
  animalTypes: FarmAnimalType[],
): { house: 'Coop' | 'Barn'; used: number; max: number }[] {
  return (['Coop', 'Barn'] as const).map((house) => ({
    house,
    used: animalTypes.filter((a) => a.house === house).reduce((sum, a) => sum + (farm.animals[a.type] ?? 0), 0),
    max: houseCapacity(buildings, farm.buildings, house),
  }))
}
