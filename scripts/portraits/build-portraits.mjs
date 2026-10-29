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
      missing.push(name)
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
  console.log(`Wrote ${Object.keys(map).length} portraits.${missing.length ? ` No portrait for: ${missing.join(', ')}.` : ''}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
