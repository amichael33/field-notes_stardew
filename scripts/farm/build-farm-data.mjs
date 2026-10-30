import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { animalFrom, buildingFrom, cropFrom, KEEP_BUILDINGS } from './resolve.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const game = path.join(root, 'Content (unpacked)')
const outDir = path.join(root, 'src', 'data')

const readJson = async (p) => JSON.parse((await readFile(p, 'utf8')).replace(/^﻿/, ''))
const byKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const write = (name, rows) =>
  writeFile(path.join(outDir, name), JSON.stringify(rows, null, 2) + '\n')

async function main() {
  if (!existsSync(game)) {
    console.error('Content (unpacked) folder not found. Unpack the game with StardewXnbHack first.')
    process.exit(1)
  }
  const data = (f) => readJson(path.join(game, 'Data', f))
  const [buildingsRaw, cropsRaw, animalsRaw, objects, strings] = await Promise.all([
    data('Buildings.json'),
    data('Crops.json'),
    data('FarmAnimals.json'),
    data('Objects.json'),
    readJson(path.join(game, 'Strings', 'Buildings.json')),
  ])

  const buildings = Object.entries(buildingsRaw)
    .filter(([id]) => KEEP_BUILDINGS.has(id))
    .map(([id, raw]) => buildingFrom(id, raw, strings, objects))
    .sort((a, b) => byKey(a.id, b.id))
  const missing = [...KEEP_BUILDINGS].filter((id) => !buildings.some((b) => b.id === id))
  if (missing.length > 0) {
    console.error(`Buildings missing from game data: ${missing.join(', ')}`)
    process.exit(1)
  }

  const crops = Object.entries(cropsRaw)
    .filter(([seed, raw]) => raw.Seasons.length > 0 && objects[seed] && objects[raw.HarvestItemId])
    .map(([seed, raw]) => cropFrom(seed, raw, objects))
    .sort((a, b) => byKey(a.id, b.id))

  const animals = Object.entries(animalsRaw)
    .filter(([, raw]) => raw.House === 'Coop' || raw.House === 'Barn')
    .map(([type, raw]) => animalFrom(type, raw))
    .sort((a, b) => byKey(a.type, b.type))

  await write('farm-buildings.json', buildings)
  await write('farm-animals.json', animals)
  await write('farm-crops.json', crops)
  console.log(`Wrote ${buildings.length} buildings, ${animals.length} animals, ${crops.length} crops.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
