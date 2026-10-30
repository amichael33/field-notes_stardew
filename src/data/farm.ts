import { dayIndex, daysUntil, fromIndex } from './calendar'
import type { SeasonDay } from './calendar'
import type { FarmBuilding, FarmCrop, FarmData, FarmUpgrade, PlantedCrop, Season } from './types'

export type Harvest = { season: Season; day: number; finishes: boolean }
export type HarvestStatus = 'ready' | 'tomorrow' | 'later' | 'wont-finish'

export function harvestDate(entry: PlantedCrop, crop: FarmCrop): Harvest {
  const regrowing = entry.lastHarvest !== undefined && crop.regrowDays !== null
  const from = regrowing ? entry.lastHarvest! : entry
  const days = regrowing ? crop.regrowDays! : crop.daysToGrow
  const date = fromIndex(dayIndex(from.season, from.day) + days)
  return { ...date, finishes: crop.seasons.includes(date.season) }
}

export function harvestStatus(h: Harvest, now: SeasonDay | null): HarvestStatus {
  if (!h.finishes) return 'wont-finish'
  const left = daysUntil(h, now ?? { season: 'spring', day: 1 })
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
): { house: 'Coop' | 'Barn'; used: number; max: number }[] {
  return (['Coop', 'Barn'] as const).map((house) => ({
    house,
    used: farm.animals.filter((a) => a.home === house).length,
    max: houseCapacity(buildings, farm.buildings, house),
  }))
}

export function savingOptions(
  buildings: FarmBuilding[],
  upgrades: FarmUpgrade[],
): { id: string; label: string; cost: number }[] {
  return [
    ...buildings.map((b) => ({ id: `building:${b.id}`, label: b.name, cost: b.cost })),
    ...upgrades.map((u) => ({ id: u.id, label: u.label, cost: u.cost })),
  ]
}

export function savingProgress(
  farm: FarmData,
  options: ReturnType<typeof savingOptions>,
): { label: string; cost: number; fraction: number } | null {
  const option = options.find((o) => o.id === farm.saving)
  if (!option) return null
  const fraction = option.cost > 0 ? Math.min(1, farm.gold / option.cost) : 1
  return { label: option.label, cost: option.cost, fraction }
}
