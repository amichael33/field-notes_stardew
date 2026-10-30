import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const unpacked = path.join(root, 'Content (unpacked)', 'Portraits')
const outDir = path.join(root, 'public', 'portraits')
const mapFile = path.join(root, 'src', 'data', 'portraits.json')
const FRAME = 64

async function main() {
  if (!existsSync(unpacked)) {
    console.error('Unpack the game into "Content (unpacked)/" first (see the README).')
    process.exit(1)
  }
  const villagers = JSON.parse(await readFile(path.join(root, 'src', 'data', 'villagers.json'), 'utf8'))
  await mkdir(outDir, { recursive: true })
  const map = {}
  const missing = []
  for (const { name } of villagers) {
    const file = path.join(unpacked, `${name}.png`)
    if (!existsSync(file)) {
      // A portrait added by hand to public/portraits/ (the game has none for some villagers) is kept.
      if (existsSync(path.join(outDir, `${name}.png`))) map[name] = `portraits/${name}.png`
      else missing.push(name)
      continue
    }
    // The first frame of each portrait sheet is the neutral expression.
    const sheet = PNG.sync.read(await readFile(file))
    const out = new PNG({ width: FRAME, height: FRAME })
    PNG.bitblt(sheet, out, 0, 0, FRAME, FRAME, 0, 0)
    await writeFile(path.join(outDir, `${name}.png`), PNG.sync.write(out))
    map[name] = `portraits/${name}.png`
  }
  await writeFile(mapFile, JSON.stringify(map, null, 2) + '\n')
  // The calendar board from the game's Billboard sheet, used behind the birthday calendar.
  const billboard = path.join(root, 'Content (unpacked)', 'LooseSprites', 'Billboard.png')
  if (existsSync(billboard)) {
    const sheet = PNG.sync.read(await readFile(billboard))
    const board = new PNG({ width: 302, height: 198 })
    PNG.bitblt(sheet, board, 0, 200, 302, 198, 0, 0)
    await mkdir(path.join(root, 'public', 'calendar'), { recursive: true })
    await writeFile(path.join(root, 'public', 'calendar', 'billboard.png'), PNG.sync.write(board))
  }
  // The valley map for each season (the top 300 x 180 of each map sheet), for marking villager locations.
  await mkdir(path.join(root, 'public', 'map'), { recursive: true })
  for (const [season, file] of [
    ['spring', 'map.png'],
    ['summer', 'map_summer.png'],
    ['fall', 'map_fall.png'],
    ['winter', 'map_winter.png'],
  ]) {
    const src = path.join(root, 'Content (unpacked)', 'LooseSprites', file)
    if (!existsSync(src)) continue
    const sheet = PNG.sync.read(await readFile(src))
    const out = new PNG({ width: 300, height: 180 })
    PNG.bitblt(sheet, out, 0, 0, 300, 180, 0, 0)
    await writeFile(path.join(root, 'public', 'map', `${season}.png`), PNG.sync.write(out))
  }
  console.log(`Wrote ${Object.keys(map).length} portraits.${missing.length ? ` No portrait for: ${missing.join(', ')}.` : ''}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
