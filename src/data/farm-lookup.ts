import type { FarmAnimalType, FarmBuilding, FarmCrop, FarmUpgrade } from './types'
import cropsJson from './farm-crops.json'
import buildingsJson from './farm-buildings.json'
import animalsJson from './farm-animals.json'
import upgradesJson from './farm-upgrades.json'

export const CROPS = cropsJson as FarmCrop[]
export const BUILDINGS = buildingsJson as FarmBuilding[]
export const ANIMAL_TYPES = animalsJson as FarmAnimalType[]
export const UPGRADES = upgradesJson as FarmUpgrade[]

export const cropById = (id: string): FarmCrop | undefined => CROPS.find((c) => c.id === id)
