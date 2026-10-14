export type Season = 'spring' | 'summer' | 'fall' | 'winter'
export type Route = 'community-center' | 'joja'

export interface BundleItem {
  name: string
  quantity: number
  seasons: Season[] | 'any'
  source: string
}

export interface Bundle {
  id: string
  room: string
  name: string
  reward: string
  slotsRequired: number
  items: BundleItem[]
}

export interface Villager {
  name: string
  birthday: { season: Season; day: number }
  loves: string[]
  likes: string[]
}

export interface Achievement {
  name: string
  requirement: string
}

export interface PathStep {
  order: number
  title: string
  detail: string
  season?: Season
  day?: number
  rainy?: boolean
}

export interface Recipe {
  order: number
  name: string
  season: Season | 'any'
  year?: 1 | 2
  day?: number
  source: string
}

export interface SaveData {
  version: 1
  profile: { route: Route; farmType: string }
  checked: string[]
  notes: string
}
