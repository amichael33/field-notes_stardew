import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { animalFrame, animalFrom, buildingFrom, cropFrom, KEEP_BUILDINGS, spriteRect } from './resolve.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const game = path.join(root, 'Content (unpacked)')
const outDir = path.join(root, 'src', 'data')

const readJson = async (p) => JSON.parse((await readFile(p, 'utf8')).replace(/^﻿/, ''))
const byKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const publicDir = path.join(root, 'public', 'farm')
const write = (name, rows) => writeFile(path.join(outDir, name), JSON.stringify(rows, null, 2) + '\n')

// Crops one sprite out of a game texture and writes it under public/farm. Returns the
// public-relative path, or null when the texture is missing.
async function writeSprite(texture, rect, kind, name) {
  const file = path.join(game, `${texture.replaceAll('\\', '/')}.png`)
  if (!existsSync(file)) {
    console.warn(`No texture for ${kind} "${name}": ${file}`)
    return null
  }
  const src = PNG.sync.read(await readFile(file))
  const r = rect ?? { x: 0, y: 0, w: src.width, h: src.height }
  const w = Math.min(r.w, src.width - r.x)
  const h = Math.min(r.h, src.height - r.y)
  const out = new PNG({ width: w, height: h })
  PNG.bitblt(src, out, r.x, r.y, w, h, 0, 0)
  const rel = `farm/${kind}s/${name}.png`
  await mkdir(path.join(publicDir, `${kind}s`), { recursive: true })
  await writeFile(path.join(root, 'public', rel), PNG.sync.write(out))
  return rel
}

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
    // Dinosaur lives in a Coop but is not an animal the player can raise.
    .filter(([type, raw]) => type !== 'Dinosaur' && (raw.House === 'Coop' || raw.House === 'Barn'))
    .map(([type, raw]) => animalFrom(type, raw))
    .sort((a, b) => byKey(a.type, b.type))

  const sprites = { buildings: {}, animals: {} }
  for (const b of buildings) {
    const raw = buildingsRaw[b.id]
    const rel = await writeSprite(raw.Texture, spriteRect(raw), 'building', b.id)
    if (rel) sprites.buildings[b.id] = rel
  }
  // The farmhouse picture stands in for every house upgrade (Kitchen, Children's room, Cellar).
  const house = buildingsRaw.Farmhouse
  const houseRel = house && (await writeSprite(house.Texture, spriteRect(house), 'building', 'Farmhouse'))
  if (houseRel) sprites.buildings.Farmhouse = houseRel
  for (const a of animals) {
    const raw = animalsRaw[a.type]
    const { w, h } = animalFrame(raw)
    const rel = await writeSprite(raw.Texture, { x: 0, y: 0, w, h }, 'animal', a.type)
    if (rel) sprites.animals[a.type] = rel
  }

  await write('farm-sprites.json', sprites)
  await write('farm-buildings.json', buildings)
  await write('farm-animals.json', animals)
  await write('farm-crops.json', crops)
  console.log(
    `Wrote ${buildings.length} buildings, ${animals.length} animals, ${crops.length} crops, ${Object.keys(sprites.buildings).length + Object.keys(sprites.animals).length} sprites.`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
