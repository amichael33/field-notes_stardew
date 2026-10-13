import { stripWikitext } from './wikitext.mjs'
import { rowCells, splitRows, tableBody, topLevelTables } from './tables.mjs'

const SEASONS = ['spring', 'summer', 'fall', 'winter']
const capitalize = (s) => s[0].toUpperCase() + s.slice(1)

/**
 * Parses the recipes on The Queen of Sauce page: the TV recipes in air order,
 * with the other places each one can be learned.
 */
export function parseQueenOfSauce(wikitext) {
  const table = topLevelTables(wikitext).find((t) => /Original Air Date/.test(t))
  if (!table) throw new Error('Queen of Sauce recipe table not found')

  const recipes = []
  for (const row of splitRows(tableBody(table)).slice(1)) {
    const cells = rowCells(row)
    if (cells.length < 5) continue

    const name = stripWikitext(cells[1])
    const air = /^(\d+)\s+(\w+),\s*Year\s+(\d+)/.exec(stripWikitext(cells[3]))
    if (!name || !air) throw new Error(`Cannot read the air date for "${name}"`)
    const day = Number(air[1])
    const season = air[2].toLowerCase()
    const year = Number(air[3])
    if (!SEASONS.includes(season)) throw new Error(`Unknown season "${air[2]}" for "${name}"`)

    const other = stripWikitext(cells[4])
    const also = other && !/^Exclusive to/i.test(other) ? `; also ${other}` : ''
    recipes.push({
      name,
      season,
      year,
      day,
      source: `The Queen of Sauce, ${capitalize(season)} ${day}, Year ${year}${also}`,
    })
  }

  const key = (r) => r.year * 1000 + SEASONS.indexOf(r.season) * 100 + r.day
  return recipes.sort((a, b) => key(a) - key(b)).map((recipe, index) => ({ order: index + 1, ...recipe }))
}
