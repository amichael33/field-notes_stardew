import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { placeName } from './places.mjs'
import { isKeptKey, resolveRules } from './resolve.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const game = path.join(root, 'Content (unpacked)')
const dir = path.join(game, 'Characters', 'schedules')
const outFile = path.join(root, 'src', 'data', 'schedules.json')
// Leo.json is a Ginger Island schedule (unreachable in the year-1 opening), so he is skipped
// like LeoMainland and template; scheduleFor('Leo') returns null.
const SKIP = new Set(['template.json', 'LeoMainland.json', 'Leo.json'])

const readJson = async (p) => JSON.parse((await readFile(p, 'utf8')).replace(/^﻿/, ''))

async function main() {
  if (!existsSync(game)) {
    console.error('Content (unpacked) folder not found. Unpack the game with StardewXnbHack first.')
    process.exit(1)
  }
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && !SKIP.has(f)).sort()
  const out = {}
  const errors = []
  let ruleCount = 0
  for (const file of files) {
    const villager = path.basename(file, '.json')
    const { rules, failed } = resolveRules(await readJson(path.join(dir, file)), placeName)
    for (const f of failed) {
      if (isKeptKey(f.key)) errors.push(`${villager} ${f.key}: ${f.message}`)
    }
    const kept = Object.fromEntries(
      Object.entries(rules)
        .filter(([k]) => isKeptKey(k))
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    )
    ruleCount += Object.keys(kept).length
    out[villager] = kept
  }
  if (errors.length > 0) {
    console.error('Schedule build errors:')
    for (const e of errors) console.error(`  ${e}`)
    process.exit(1)
  }
  await writeFile(outFile, JSON.stringify(out, null, 2) + '\n')
  console.log(`Wrote ${ruleCount} rules for ${files.length} villagers.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
