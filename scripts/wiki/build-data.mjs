// Run once to (re)generate src/data/villagers.json and src/data/bundles.json from the Stardew Valley Wiki.
// Usage: npm run data:wiki
// Pages are cached in scripts/.cache, so the wiki is asked for each page only once.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from './client.mjs'
import { buildBundles, buildVillagers, diffBundles, diffVillagers } from './build.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const dataFile = (name) => path.join(root, 'src/data', name)
const readJson = async (name) => JSON.parse(await readFile(dataFile(name), 'utf8'))
const writeJson = (name, data) => writeFile(dataFile(name), JSON.stringify(data, null, 2) + '\n', 'utf8')

const client = createClient({ cacheDir: path.join(root, 'scripts/.cache'), delayMs: 1000 })

const oldVillagers = await readJson('villagers.json')
const oldBundles = await readJson('bundles.json')

console.log(`Fetching ${oldVillagers.length} villager pages and the Bundles page (cached pages are not re-fetched)...`)
const { villagers, problems } = await buildVillagers(client, oldVillagers.map((v) => v.name))
const { bundles, derived } = await buildBundles(client, oldBundles)

const report = [
  ...problems.map((p) => `PROBLEM ${p}`),
  ...diffVillagers(oldVillagers, villagers),
  ...diffBundles(oldBundles, bundles),
  ...derived.map((d) => `seasons derived from source text for ${d}`),
]
console.log(report.length ? report.join('\n') : 'No differences from the current data.')

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s): data files were NOT written.`)
  process.exit(1)
}
await writeJson('villagers.json', villagers)
await writeJson('bundles.json', bundles)
console.log(`\nWrote src/data/villagers.json (${villagers.length}) and src/data/bundles.json (${bundles.length}).`)
