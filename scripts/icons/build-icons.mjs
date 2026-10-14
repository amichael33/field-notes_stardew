import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { spriteOrigin, cropSprite, sheetFor } from './crop.mjs'
import { matchItems, slugify, baseName } from './match.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const game = path.join(root, 'Content (unpacked)')
const outDir = path.join(root, 'public', 'items')
const mapFile = path.join(root, 'src', 'data', 'item-icons.json')

const readJson = async (p) => JSON.parse((await readFile(p, 'utf8')).replace(/^﻿/, ''))
const readPng = async (p) => PNG.sync.read(await readFile(p))

async function main() {
  if (!existsSync(game)) {
    console.error('Content (unpacked) folder not found. Unpack the game with StardewXnbHack first.')
    process.exit(1)
  }
  const bundles = await readJson(path.join(root, 'src', 'data', 'bundles.json'))
  const names = [...new Set(bundles.flatMap((b) => b.items.map((i) => i.name)))]
  const objects = await readJson(path.join(game, 'Data', 'Objects.json'))
  const strings = await readJson(path.join(game, 'Strings', 'Objects.json'))
  const { matched, gold, unmatched } = matchItems(names, objects, strings)
  if (unmatched.length > 0) {
    console.error('Unmatched item names:')
    for (const n of unmatched) console.error(`  ${n}`)
    process.exit(1)
  }

  const sheets = {
    main: { png: await readPng(path.join(game, 'Maps', 'springobjects.png')), columns: 24 },
    objects2: { png: await readPng(path.join(game, 'TileSheets', 'Objects_2.png')), columns: 8 },
  }
  await mkdir(outDir, { recursive: true })
  const map = {}
  for (const name of gold) map[name] = null
  const written = new Set()
  for (const [name, m] of Object.entries(matched)) {
    const slug = slugify(baseName(name))
    const sheet = sheets[sheetFor(m.texture).key]
    if (!written.has(slug)) {
      const { x, y } = spriteOrigin(m.spriteIndex, sheet.columns)
      await writeFile(path.join(outDir, `${slug}.png`), PNG.sync.write(cropSprite(sheet.png, x, y)))
      written.add(slug)
    }
    map[name] = `items/${slug}.png`
  }
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)))
  await writeFile(mapFile, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`Wrote ${written.size} icons for ${Object.keys(matched).length} items (${gold.length} gold amounts have no icon).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
