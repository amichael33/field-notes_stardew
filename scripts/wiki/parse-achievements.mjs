import { stripWikitext } from './wikitext.mjs'
import { rowCells, splitRows, tableBody, topLevelTables } from './tables.mjs'

/**
 * Parses the in-game achievements table on the wiki's Achievements page.
 * Columns: platform icon, in-game icon, name, description, unlock icon, unlock item.
 */
export function parseAchievements(wikitext) {
  const table = topLevelTables(wikitext).find((t) => /^!\s*Achievement\s*$/m.test(t))
  if (!table) throw new Error('Achievements table not found')

  const achievements = []
  for (const row of splitRows(tableBody(table)).slice(1)) {
    const cells = rowCells(row)
    if (cells.length < 4) continue
    const name = stripWikitext(cells[2])
    // "See (note below)" points at a section of the wiki page, which means nothing on this site.
    const requirement = stripWikitext(cells[3]).replace(/\s*See \(note below\)\.?/i, '').trim()
    if (name && requirement) achievements.push({ name, requirement })
  }
  return achievements
}
