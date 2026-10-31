import { chainLevels } from './farm'
import type { FarmBuilding, FarmData, FarmMaterial, FarmUpgrade } from './types'

export const COUNTED = ['Cabin', 'Fish Pond', 'Stable', 'Junimo Hut', 'Pet Bowl']

export type BuildTarget = {
  id: string
  name: string
  cost: number
  materials: FarmMaterial[]
  builder: string | null
  buildDays: number | null
}

export type OwnedTile = { key: string; id: string; name: string; count: number }

const MAX_COUNT = 99
const isHouse = (id: string) => id.startsWith('house:')

const houseUpgrades = (upgrades: FarmUpgrade[]) => upgrades.filter((u) => isHouse(u.id))

function buildingTarget(b: FarmBuilding): BuildTarget {
  return {
    id: b.id,
    name: b.name,
    cost: b.cost,
    materials: b.materials,
    builder: b.builder,
    buildDays: b.buildDays,
  }
}

function upgradeTarget(u: FarmUpgrade): BuildTarget {
  return { id: u.id, name: u.label, cost: u.cost, materials: u.materials, builder: 'Robin', buildDays: 3 }
}

/** Chains of more than one level, single buildings, and counted buildings, in that order. */
function groups(buildings: FarmBuilding[]) {
  const all = Object.entries(chainLevels(buildings))
  return {
    chains: all.filter(([, levels]) => levels.length > 1),
    singles: all
      .filter(([root, levels]) => levels.length === 1 && !COUNTED.includes(root))
      .map(([, l]) => l[0]),
    counted: all
      .filter(([root, levels]) => levels.length === 1 && COUNTED.includes(root))
      .map(([, l]) => l[0]),
  }
}

export function targetById(
  id: string,
  buildings: FarmBuilding[],
  upgrades: FarmUpgrade[],
): BuildTarget | undefined {
  if (isHouse(id)) {
    const u = upgrades.find((x) => x.id === id)
    return u ? upgradeTarget(u) : undefined
  }
  const b = buildings.find((x) => x.id === id)
  return b ? buildingTarget(b) : undefined
}

/** True when the goal building, chain level, or house upgrade is already built. */
export function goalReached(
  farm: FarmData,
  id: string,
  buildings: FarmBuilding[],
  upgrades: FarmUpgrade[],
): boolean {
  const owned = farm.buildings
  if (isHouse(id)) return upgrades.some((u) => u.id === id) && (owned[id] ?? 0) > 0
  const chain = groups(buildings).chains.find(([, levels]) => levels.some((l) => l.id === id))
  if (chain) return (owned[chain[0]] ?? 0) >= chain[1].findIndex((l) => l.id === id) + 1
  return (owned[id] ?? 0) >= 1
}

export function ownedTiles(
  owned: Record<string, number>,
  buildings: FarmBuilding[],
  upgrades: FarmUpgrade[],
): OwnedTile[] {
  const { chains, singles, counted } = groups(buildings)
  const tiles: OwnedTile[] = []
  for (const [root, levels] of chains) {
    const level = Math.min(owned[root] ?? 0, levels.length)
    if (level > 0) tiles.push({ key: root, id: levels[level - 1].id, name: levels[level - 1].name, count: 1 })
  }
  for (const b of singles) {
    if ((owned[b.id] ?? 0) > 0) tiles.push({ key: b.id, id: b.id, name: b.name, count: 1 })
  }
  for (const b of counted) {
    if ((owned[b.id] ?? 0) > 0) tiles.push({ key: b.id, id: b.id, name: b.name, count: owned[b.id] })
  }
  for (const u of houseUpgrades(upgrades)) {
    if ((owned[u.id] ?? 0) > 0) tiles.push({ key: u.id, id: u.id, name: u.label, count: 1 })
  }
  return tiles
}

function nextHouse(owned: Record<string, number>, upgrades: FarmUpgrade[]): BuildTarget | undefined {
  const next = houseUpgrades(upgrades).find((u) => (owned[u.id] ?? 0) === 0)
  return next ? upgradeTarget(next) : undefined
}

export function buildable(
  owned: Record<string, number>,
  buildings: FarmBuilding[],
  upgrades: FarmUpgrade[],
): BuildTarget[] {
  const { chains, singles, counted } = groups(buildings)
  const targets: BuildTarget[] = []
  for (const [root, levels] of chains) {
    const next = levels[owned[root] ?? 0]
    if (next) targets.push(buildingTarget(next))
  }
  for (const b of singles) {
    if ((owned[b.id] ?? 0) === 0) targets.push(buildingTarget(b))
  }
  for (const b of counted) targets.push(buildingTarget(b))
  const house = nextHouse(owned, upgrades)
  if (house) targets.push(house)
  return targets.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name))
}

export function nextUpgrade(
  key: string,
  owned: Record<string, number>,
  buildings: FarmBuilding[],
  upgrades: FarmUpgrade[],
): BuildTarget | undefined {
  if (isHouse(key)) return nextHouse(owned, upgrades)
  const levels = groups(buildings).chains.find(([root]) => root === key)?.[1]
  const next = levels?.[owned[key] ?? 0]
  return next ? buildingTarget(next) : undefined
}

function withBuildings(farm: FarmData, buildings: Record<string, number>): FarmData {
  return { ...farm, buildings }
}

function setOrDelete(owned: Record<string, number>, key: string, value: number): Record<string, number> {
  const next = { ...owned }
  if (value <= 0) delete next[key]
  else next[key] = value
  return next
}

export function build(
  farm: FarmData,
  id: string,
  buildings: FarmBuilding[],
  upgrades: FarmUpgrade[],
): FarmData {
  let owned = farm.buildings
  if (isHouse(id)) {
    if (!upgrades.some((u) => u.id === id)) return farm
    owned = setOrDelete(owned, id, 1)
  } else {
    const chain = groups(buildings).chains.find(([, levels]) => levels.some((l) => l.id === id))
    if (chain) {
      owned = setOrDelete(owned, chain[0], chain[1].findIndex((l) => l.id === id) + 1)
    } else if (COUNTED.includes(id)) {
      if (!buildings.some((b) => b.id === id)) return farm
      owned = setOrDelete(owned, id, Math.min((owned[id] ?? 0) + 1, MAX_COUNT))
    } else if (buildings.some((b) => b.id === id)) {
      owned = setOrDelete(owned, id, 1)
    } else {
      return farm
    }
  }
  return { ...withBuildings(farm, owned), goal: farm.goal === id ? null : farm.goal }
}

export function unbuild(farm: FarmData, key: string, buildings: FarmBuilding[]): FarmData {
  const owned = { ...farm.buildings }
  if (isHouse(key)) {
    const n = Number(key.slice('house:'.length))
    for (const k of Object.keys(owned)) {
      if (isHouse(k) && Number(k.slice('house:'.length)) >= n) delete owned[k]
    }
    return withBuildings(farm, owned)
  }
  const isChain = groups(buildings).chains.some(([root]) => root === key)
  const current = owned[key] ?? 0
  return withBuildings(farm, setOrDelete(owned, key, isChain || COUNTED.includes(key) ? current - 1 : 0))
}
