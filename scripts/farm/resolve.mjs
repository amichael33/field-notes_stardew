// Pure helpers that turn raw game data into the shapes in src/data/types.ts.

export const KEEP_BUILDINGS = new Set([
  'Coop',
  'Big Coop',
  'Deluxe Coop',
  'Barn',
  'Big Barn',
  'Deluxe Barn',
  'Shed',
  'Big Shed',
  'Well',
  'Silo',
  'Mill',
  'Fish Pond',
  'Cabin',
  'Stable',
  'Slime Hutch',
  'Pet Bowl',
  'Junimo Hut',
  'Earth Obelisk',
  'Water Obelisk',
  'Desert Obelisk',
  'Island Obelisk',
  'Gold Clock',
])

// Only animal houses report a meaningful capacity.
const ANIMAL_HOUSES = new Set(['Coop', 'Big Coop', 'Deluxe Coop', 'Barn', 'Big Barn', 'Deluxe Barn'])

const objectName = (objects, id, context) => {
  const entry = objects[id]
  if (!entry) throw new Error(`Unknown object id "${id}" (${context})`)
  return entry.Name
}

function localizedName(name, strings) {
  const m = /^\[LocalizedText [^:\]]+:([^\]]+)\]$/.exec(name)
  if (!m) return name
  const text = strings[m[1]]
  if (text === undefined) throw new Error(`Missing string "${m[1]}"`)
  return text
}

export function buildingFrom(id, raw, strings, objects) {
  return {
    id,
    name: localizedName(raw.Name, strings),
    builder: raw.Builder,
    cost: raw.BuildCost,
    materials: (raw.BuildMaterials ?? []).map((m) => ({
      item: objectName(objects, m.ItemId.replace(/^\(O\)/, ''), `building ${id}`),
      amount: m.Amount,
    })),
    buildDays: raw.BuildDays,
    capacity: ANIMAL_HOUSES.has(id) ? raw.MaxOccupants : null,
    upgradesFrom: raw.BuildingToUpgrade ?? null,
  }
}

export function cropFrom(seedId, raw, objects) {
  return {
    id: seedId,
    name: objectName(objects, raw.HarvestItemId, `crop ${seedId} harvest`),
    seeds: objectName(objects, seedId, `crop ${seedId} seed`),
    seasons: raw.Seasons.map((s) => s.toLowerCase()),
    daysToGrow: raw.DaysInPhase.reduce((a, b) => a + b, 0),
    regrowDays: raw.RegrowDays > 0 ? raw.RegrowDays : null,
  }
}

export function animalFrom(type, raw) {
  return {
    type,
    house: raw.House,
    // The game file stores half the price Marnie's shop charges.
    price: raw.PurchasePrice > 0 ? raw.PurchasePrice * 2 : null,
    daysToMature: raw.DaysToMature,
  }
}
