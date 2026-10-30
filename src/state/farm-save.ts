import { SEASONS } from '../data/calendar'
import type { FarmAnimal, FarmData, PlantedCrop, Season } from '../data/types'

export const TOOLS = ['Axe', 'Pickaxe', 'Hoe', 'Watering Can', 'Trash Can']
export const SKILLS = ['Farming', 'Mining', 'Foraging', 'Fishing', 'Combat']

const CHAINS = ['Coop', 'Barn', 'Shed']
const MAX_CHAIN_LEVEL = 3
const MAX_BUILDING_COUNT = 99
const MAX_TOOL_LEVEL = 4
const MAX_SKILL_LEVEL = 10

export function defaultFarm(): FarmData {
  return { buildings: {}, animals: [], crops: [], tools: {}, skills: {}, gold: 0, saving: null }
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

// names limits which keys are kept (others are dropped); null keeps every key.
function parseLevels(raw: unknown, names: string[] | null, max: (name: string) => number): Record<string, number> | null {
  if (!isRecord(raw)) return null
  const out: Record<string, number> = {}
  for (const [name, value] of Object.entries(raw)) {
    if (names && !names.includes(name)) continue
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

function parseAnimal(v: unknown): FarmAnimal | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.type !== 'string' || typeof v.name !== 'string') return null
  if (v.home !== 'Coop' && v.home !== 'Barn') return null
  return { id: v.id, type: v.type, name: v.name, home: v.home }
}

function parseList<T extends { id: string }>(raw: unknown, parseItem: (v: unknown) => T | null): T[] | null {
  if (!Array.isArray(raw)) return null
  const items: T[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    const item = parseItem(entry)
    if (!item || seen.has(item.id)) return null
    seen.add(item.id)
    items.push(item)
  }
  return items
}

/** Returns a clean copy of a farm, or null when the input is invalid. Unknown keys are dropped. */
export function parseFarm(raw: unknown): FarmData | null {
  if (!isRecord(raw)) return null
  const buildings = parseLevels(raw.buildings, null, (name) => (CHAINS.includes(name) ? MAX_CHAIN_LEVEL : MAX_BUILDING_COUNT))
  const tools = parseLevels(raw.tools, TOOLS, () => MAX_TOOL_LEVEL)
  const skills = parseLevels(raw.skills, SKILLS, () => MAX_SKILL_LEVEL)
  const animals = parseList(raw.animals, parseAnimal)
  const crops = parseList(raw.crops, parseCrop)
  if (!buildings || !tools || !skills || !animals || !crops) return null
  if (typeof raw.gold !== 'number' || !Number.isInteger(raw.gold) || raw.gold < 0) return null
  if (raw.saving !== null && typeof raw.saving !== 'string') return null
  return { buildings, animals, crops, tools, skills, gold: raw.gold, saving: raw.saving }
}
