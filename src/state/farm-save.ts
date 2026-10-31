import { SEASONS } from '../data/calendar'
import type { FarmData, PlantedCrop, Season } from '../data/types'

const CHAINS = ['Coop', 'Barn', 'Shed']
const MAX_CHAIN_LEVEL = 3
const MAX_BUILDING_COUNT = 99
const MAX_ANIMAL_COUNT = 99

export function defaultFarm(): FarmData {
  return { buildings: {}, animals: {}, crops: [], goal: null }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isIntBetween(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
}

function isSeason(v: unknown): v is Season {
  return typeof v === 'string' && (SEASONS as string[]).includes(v)
}

function parseSeasonDay(v: unknown): { season: Season; day: number } | null {
  if (!isRecord(v) || !isSeason(v.season) || !isIntBetween(v.day, 1, 28)) return null
  return { season: v.season, day: v.day }
}

function parseCounts(raw: unknown, max: (name: string) => number): Record<string, number> | null {
  if (!isRecord(raw)) return null
  const out: Record<string, number> = {}
  for (const [name, value] of Object.entries(raw)) {
    if (!isIntBetween(value, 0, max(name))) return null
    out[name] = value
  }
  return out
}

function parseCrop(v: unknown): PlantedCrop | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.crop !== 'string') return null
  if (!isIntBetween(v.count, 1, Number.MAX_SAFE_INTEGER)) return null
  const planted = parseSeasonDay(v)
  if (!planted) return null
  const crop: PlantedCrop = { id: v.id, crop: v.crop, count: v.count, ...planted }
  if (v.lastHarvest !== undefined) {
    const last = parseSeasonDay(v.lastHarvest)
    if (!last) return null
    crop.lastHarvest = last
  }
  return crop
}

// The old shape listed named animals; a list becomes a count per type.
function parseAnimals(raw: unknown): Record<string, number> | null {
  if (!Array.isArray(raw)) return parseCounts(raw, () => MAX_ANIMAL_COUNT)
  const out: Record<string, number> = {}
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.type !== 'string') return null
    out[entry.type] = (out[entry.type] ?? 0) + 1
  }
  return Object.values(out).every((n) => n <= MAX_ANIMAL_COUNT) ? out : null
}

function parseCrops(raw: unknown): PlantedCrop[] | null {
  if (!Array.isArray(raw)) return null
  const items: PlantedCrop[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    const item = parseCrop(entry)
    if (!item || seen.has(item.id)) return null
    seen.add(item.id)
    items.push(item)
  }
  return items
}

/** Returns a clean copy of a farm, or null when the input is invalid. Unknown keys are dropped. */
export function parseFarm(raw: unknown): FarmData | null {
  if (!isRecord(raw)) return null
  const buildings = parseCounts(raw.buildings, (name) => (CHAINS.includes(name) ? MAX_CHAIN_LEVEL : MAX_BUILDING_COUNT))
  const animals = parseAnimals(raw.animals)
  const crops = parseCrops(raw.crops)
  if (!buildings || !animals || !crops) return null
  // Old saves have no goal (they had gold and saving, which are dropped)
  const goal = raw.goal ?? null
  if (goal !== null && typeof goal !== 'string') return null
  return { buildings, animals, crops, goal }
}
