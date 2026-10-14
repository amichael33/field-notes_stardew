/**
 * @typedef {{ Name: string, DisplayName: string, Texture: string | null, SpriteIndex: number }} GameObject
 */

export const HAND_MAPPINGS = { 'Large Brown Egg': '182', 'Large Goat Milk': '438' }
export const GOLD_AMOUNTS = ['2,500g', '5,000g', '10,000g', '25,000g']

/** @param {string} name */
export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** @param {string} name */
export function baseName(name) {
  return name.replace(/\s*\((?:gold|silver) quality[^)]*\)\s*$/, '').trim()
}

/** @param {GameObject} o @param {Record<string, string>} strings */
function localisedName(o, strings) {
  const m = /^\[LocalizedText Strings\\Objects:([^\]]+)\]$/.exec(o.DisplayName ?? '')
  return m ? strings[m[1]] : undefined
}

/**
 * @param {string[]} names
 * @param {Record<string, GameObject>} objects
 * @param {Record<string, string>} strings
 */
export function matchItems(names, objects, strings) {
  const ids = Object.keys(objects).sort((a, b) => Number(a) - Number(b))
  /** @type {Map<string, string>} */
  const byName = new Map()
  for (const id of ids) {
    const o = objects[id]
    for (const key of [o.Name, localisedName(o, strings)]) {
      if (key && !byName.has(key)) byName.set(key, id)
    }
  }
  const matched = {}
  const gold = []
  const unmatched = []
  for (const name of names) {
    if (GOLD_AMOUNTS.includes(name)) {
      gold.push(name)
      continue
    }
    const base = baseName(name)
    const id = HAND_MAPPINGS[base] ?? byName.get(base)
    if (id === undefined || !objects[id]) {
      unmatched.push(name)
      continue
    }
    const o = objects[id]
    matched[name] = { id, texture: o.Texture ?? null, spriteIndex: o.SpriteIndex }
  }
  return { matched, gold, unmatched }
}
