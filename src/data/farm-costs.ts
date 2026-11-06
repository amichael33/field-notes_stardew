import costsJson from './farm-costs.json'

export interface Fertilizer {
  name: string
  price: number
  note: string
}
export interface Sprinkler {
  name: string
  /** Crop tiles one sprinkler waters. */
  covers: number
  materials: { item: string; amount: number }[]
}

export const SEED_PRICES = costsJson.seeds as Record<string, number>
export const FERTILIZERS = costsJson.fertilizers as Fertilizer[]
export const SPRINKLERS = costsJson.sprinklers as Sprinkler[]

export interface PlantCost {
  /** Pierre's price for one seed, or null when he does not sell it. */
  seedPrice: number | null
  /** Gold for the seeds, fertilizer and nothing else; seeds he does not sell count as 0. */
  money: number
  fertilizerPrice: number
  sprinklerCount: number
  materials: { item: string; amount: number }[]
}

/** What it costs to plant `count` tiles of a seed, each fertilized, watered by sprinklers. */
export function plantCost(seeds: string, count: number, fertilizer?: string, sprinkler?: string): PlantCost {
  const seedPrice = Object.prototype.hasOwnProperty.call(SEED_PRICES, seeds) ? SEED_PRICES[seeds] : null
  const fertilizerPrice = FERTILIZERS.find((f) => f.name === fertilizer)?.price ?? 0
  const s = SPRINKLERS.find((x) => x.name === sprinkler)
  const sprinklerCount = s ? Math.ceil(count / s.covers) : 0
  return {
    seedPrice,
    money: ((seedPrice ?? 0) + fertilizerPrice) * count,
    fertilizerPrice,
    sprinklerCount,
    materials: s ? s.materials.map((m) => ({ item: m.item, amount: m.amount * sprinklerCount })) : [],
  }
}
