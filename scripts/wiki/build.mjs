import { parseBundles } from './parse-bundles.mjs'
import { parseVillager } from './parse-villager.mjs'
import { parseAchievements } from './parse-achievements.mjs'
import { parseQueenOfSauce } from './parse-recipes.mjs'

const SEASONS = ['spring', 'summer', 'fall', 'winter']

/** Reads season words out of a source description; 'any' when it names none. */
export function deriveSeasons(source) {
  const found = SEASONS.filter((season) => new RegExp(String.raw`\b${season}\b`, 'i').test(source))
  return found.length > 0 ? found : 'any'
}

/**
 * Adds a `seasons` field to every generated bundle item. Items already in the
 * existing data keep their hand-curated seasons; new ones are derived from the
 * source text and listed so they can be checked.
 */
export function mergeBundleSeasons(generated, existing) {
  const derived = []
  const bundles = generated.map((bundle) => {
    const before = existing.find((b) => b.id === bundle.id)
    return {
      ...bundle,
      items: bundle.items.map((item) => {
        const known = before?.items.find((i) => i.name === item.name)
        if (known) return { name: item.name, quantity: item.quantity, seasons: known.seasons, source: item.source }
        derived.push(`${bundle.id} / ${item.name}`)
        return { name: item.name, quantity: item.quantity, seasons: deriveSeasons(item.source), source: item.source }
      }),
    }
  })
  return { bundles, derived }
}

/** Lists what changed between two bundle lists, one line per change. */
export function diffBundles(before, after) {
  const lines = []
  for (const old of before) {
    const now = after.find((b) => b.id === old.id)
    if (!now) {
      lines.push(`${old.id}: removed`)
      continue
    }
    if (old.reward !== now.reward) lines.push(`${old.id}: reward "${old.reward}" -> "${now.reward}"`)
    if (old.slotsRequired !== now.slotsRequired) lines.push(`${old.id}: slots ${old.slotsRequired} -> ${now.slotsRequired}`)
    for (const item of old.items) {
      const match = now.items.find((i) => i.name === item.name)
      if (match && match.quantity !== item.quantity) {
        lines.push(`${old.id}: item "${item.name}" quantity ${item.quantity} -> ${match.quantity}`)
      }
    }
    for (const item of now.items) {
      if (!old.items.some((i) => i.name === item.name)) lines.push(`${old.id}: item added "${item.name}"`)
    }
    for (const item of old.items) {
      if (!now.items.some((i) => i.name === item.name)) lines.push(`${old.id}: item removed "${item.name}"`)
    }
  }
  for (const now of after) {
    if (!before.some((b) => b.id === now.id)) lines.push(`${now.id}: new bundle`)
  }
  return lines
}

/** Lists what changed between two villager lists, one line per change. */
export function diffVillagers(before, after) {
  const lines = []
  for (const old of before) {
    const now = after.find((v) => v.name === old.name)
    if (!now) {
      lines.push(`${old.name}: removed`)
      continue
    }
    const a = old.birthday
    const b = now.birthday
    if (a.season !== b.season || a.day !== b.day) {
      lines.push(`${old.name}: birthday ${a.season} ${a.day} -> ${b.season} ${b.day}`)
    }
    for (const kind of ['loves', 'likes']) {
      for (const item of now[kind]) if (!old[kind].includes(item)) lines.push(`${old.name}: ${kind} added ${item}`)
      for (const item of old[kind]) if (!now[kind].includes(item)) lines.push(`${old.name}: ${kind} removed ${item}`)
    }
  }
  for (const now of after) {
    if (!before.some((v) => v.name === now.name)) lines.push(`${now.name}: new villager`)
  }
  return lines
}

/** Builds the villager list from wiki pages, in the order of `names`. */
export async function buildVillagers(client, names) {
  const villagers = []
  const problems = []
  for (const name of names) {
    try {
      const villager = parseVillager(name, await client.getWikitext(name))
      if (villager.loves.length === 0) problems.push(`${name}: no loves found, check the page layout`)
      villagers.push(villager)
    } catch (error) {
      problems.push(`${name}: ${error.message}`)
    }
  }
  return { villagers, problems }
}

/** Builds the bundle list from the wiki's Bundles page. */
export async function buildBundles(client, existing) {
  const generated = parseBundles(await client.getWikitext('Bundles'))
  return mergeBundleSeasons(generated, existing)
}

/** Lists what changed between two achievement lists, one line per change. */
export function diffAchievements(before, after) {
  const lines = []
  for (const old of before) {
    const now = after.find((a) => a.name === old.name)
    if (!now) lines.push(`${old.name}: removed`)
    else if (now.requirement !== old.requirement) {
      lines.push(`${old.name}: requirement "${old.requirement}" -> "${now.requirement}"`)
    }
  }
  for (const now of after) {
    if (!before.some((a) => a.name === now.name)) lines.push(`${now.name}: new achievement`)
  }
  return lines
}

/** Lists what changed between two recipe lists, one line per change. */
export function diffRecipes(before, after) {
  const lines = []
  for (const old of before) {
    const now = after.find((r) => r.name === old.name)
    if (!now) lines.push(`${old.name}: removed`)
    else if (now.source !== old.source) lines.push(`${old.name}: source "${old.source}" -> "${now.source}"`)
  }
  for (const now of after) {
    if (!before.some((r) => r.name === now.name)) lines.push(`${now.name}: new recipe`)
  }
  return lines
}

/** Builds the achievement list from the wiki's Achievements page. */
export async function buildAchievements(client) {
  return parseAchievements(await client.getWikitext('Achievements'))
}

/** Builds the recipe list from The Queen of Sauce page. */
export async function buildRecipes(client) {
  return parseQueenOfSauce(await client.getWikitext('The Queen of Sauce'))
}
