import { stripWikitext } from './wikitext.mjs'

/** Returns the text between a `===Heading===` line and the next level-2 or level-3 heading. */
function section(wikitext, heading) {
  const start = new RegExp(`^===\\s*${heading}\\s*===\\s*$`, 'm').exec(wikitext)
  if (!start) return ''
  const rest = wikitext.slice(start.index + start[0].length)
  const next = /^={2,3}[^=].*$/m.exec(rest)
  return next ? rest.slice(0, next.index) : rest
}

/**
 * Returns the HTML of each top-level <li> in the text. Nested lists stay inside
 * their parent, and a new top-level <li> ends the previous one, because some
 * pages never close their tags.
 */
function topLevelListItems(text) {
  const items = []
  let depth = 0
  let start = -1
  const close = (at) => {
    if (start >= 0) items.push(text.slice(start, at))
    start = -1
  }
  for (const tag of text.matchAll(/<(\/?)(ul|li)>/g)) {
    const [whole, closing, name] = tag
    if (name === 'ul') {
      if (closing) {
        depth--
        if (depth === 0) close(tag.index)
      } else {
        depth++
      }
    } else if (depth === 1) {
      if (closing) close(tag.index)
      else {
        close(tag.index)
        start = tag.index + whole.length
      }
    }
  }
  close(text.length)
  return items
}

/** True when the text lists several items, e.g. "Escargot, Fish Taco, or Tropical Curry". */
function isGroupLabel(text) {
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') depth--
    else if (depth === 0 && (text.startsWith(', ', i) || text.startsWith(' or ', i))) return true
  }
  return false
}

/** Lists the items in a Love or Like section, in order, without duplicates. */
function giftItems(text) {
  const items = []
  const add = (raw) => {
    const item = stripWikitext(raw)
    if (item && !items.includes(item)) items.push(item)
  }

  // Bullets such as "All Universal Loves" and category notes.
  for (const html of topLevelListItems(text)) {
    add(html.replace(/<\/li>\s*<li>/g, ', ').replace(/<\/?(?:ul|li)>/g, ' '))
  }

  // Table rows: an image cell, then the item cell.
  for (const row of text.split(/\n\|-/)) {
    if (row.includes('<li>')) continue
    const cells = row.split('\n').filter((line) => /^\|(?![}-])/.test(line))
    if (cells.length >= 2 && /File:/.test(cells[0])) add(cells[1].replace(/^\|/, ''))
  }

  // Special gifts shown as an italic name followed by their reaction quote.
  // A line that names several items repeats rows already in the table, so skip it.
  for (const match of text.matchAll(/^''([^'\n][^\n]*?)''[ \t]*$/gm)) {
    if (!isGroupLabel(stripWikitext(match[1]))) add(match[1])
  }

  return items
}

export function parseVillager(name, wikitext) {
  const birthday = /\|\s*birthday\s*=\s*\{\{\s*Season\s*\|\s*(\w+)\s*(?:\|\s*(\d+)\s*)?\}\}\s*(\d+)?/i.exec(wikitext)
  const day = birthday ? birthday[2] ?? birthday[3] : undefined
  if (!birthday || !day) throw new Error(`No birthday found on the page for ${name}`)

  return {
    name,
    birthday: { season: birthday[1].toLowerCase(), day: Number(day) },
    loves: giftItems(section(wikitext, 'Love')),
    likes: giftItems(section(wikitext, 'Like')),
  }
}
