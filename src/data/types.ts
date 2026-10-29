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
