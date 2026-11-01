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
  profile: { route: Route; farmType: string; planGoal: PlanGoal }
  checked: string[]
  notes: string
  clock: Clock | null
  customTasks: CustomTask[]
  farm: FarmData
}

/** A task the player added to a specific day. Its checkbox id is `custom:<id>`. */
export interface CustomTask {
  id: string
  season: Season
  day: number
  text: string
}

export type PlanGoal = 'community-center' | 'money'

export interface PlanTask {
  id: string
  text: string
  item?: string
  place?: string
  /** Minutes since midnight, as in Stop.time. */
  time?: number
  route?: Route
}

export interface PlanDay {
  season: Season
  day: number
  why: string
  tasks: PlanTask[]
  rainTasks?: PlanTask[]
}

export type Plan = PlanDay[]

export type Weather = 'sunny' | 'rain'
export type ClockStatus = 'idle' | 'running' | 'paused' | 'ended'

export interface Clock {
  season: Season
  day: number
  minutes: number
  weather: Weather
  status: ClockStatus
}

export interface Stop {
  time: number
  place: string
}

export interface Location {
  place: string
  since: number | null
  next?: Stop
}

export interface FarmMaterial {
  item: string
  amount: number
}

export interface FarmBuilding {
  id: string
  name: string
  builder: string
  cost: number
  materials: FarmMaterial[]
  buildDays: number
  capacity: number | null
  upgradesFrom: string | null
}

export interface FarmAnimalType {
  type: string
  house: 'Coop' | 'Barn'
  price: number | null
  daysToMature: number
}

export interface FarmCrop {
  id: string
  name: string
  seeds: string
  seasons: Season[]
  daysToGrow: number
  regrowDays: number | null
}

export interface FarmUpgrade {
  id: string
  group: 'tool' | 'house' | 'backpack'
  label: string
  cost: number
  materials: FarmMaterial[]
}

export interface PlantedCrop {
  id: string
  /** A `FarmCrop.id`. */
  crop: string
  count: number
  season: Season
  day: number
  lastHarvest?: { season: Season; day: number }
}

/** Chains (Coop, Barn, Shed) store a level 0 to 3 under the root id; other buildings store a count. */
export interface FarmData {
  buildings: Record<string, number>
  /** Animals owned, counted per `FarmAnimalType.type`. */
  animals: Record<string, number>
  crops: PlantedCrop[]
  /** A building id or `house:N`, or null. */
  goal: string | null
}

/** One slot of a remixed community-center room: a fixed bundle, a choice of alternatives, or a pool to pick N from. */
export interface RemixSlot {
  id: string
  kind: 'fixed' | 'alternatives' | 'pool'
  /** How many bundles the player picks from this slot. */
  pick: number
  bundles: Bundle[]
}

export interface RemixRoom {
  room: string
  slots: RemixSlot[]
}

export interface RemixState {
  /** Slot id to the chosen bundle ids. */
  picks: Record<string, string[]>
}
