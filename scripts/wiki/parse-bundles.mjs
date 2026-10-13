import { stripWikitext } from './wikitext.mjs'

/** Splits text into its top-level wikitext tables, keeping nested tables inside their parent. */
function topLevelTables(text) {
  const tables = []
  let depth = 0
  let current = []
  for (const line of text.split('\n')) {
    if (/^\{\|/.test(line)) depth++
    if (depth > 0) current.push(line)
    if (/^\|\}/.test(line) && depth > 0) {
      depth--
      if (depth === 0) {
        tables.push(current.join('\n'))
        current = []
      }
    }
  }
  return tables
}

/** Splits a table body into rows at `|-` lines that are not inside a nested table. */
function splitRows(tableText) {
  const rows = []
  let depth = 0
  let current = []
  for (const line of tableText.split('\n')) {
    if (/^\{\|/.test(line)) depth++
    if (depth === 0 && /^\|-\s*$/.test(line)) {
      rows.push(current.join('\n'))
      current = []
      continue
    }
    current.push(line)
    if (/^\|\}/.test(line) && depth > 0) depth--
  }
  rows.push(current.join('\n'))
  return rows
}

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const formatGold = (amount) => `${Number(amount).toLocaleString('en-US')}g`

function cellText(line) {
  const attrs = /^\|\s*(?:\w+="[^"]*"\s*)+\|/.exec(line)
  const body = attrs ? line.slice(attrs[0].length) : line.replace(/^\|/, '')
  return body.trim()
}

// The wiki writes a few item names differently from the game.
const NAME_FIXES = { 'Warp Totem Beach': 'Warp Totem: Beach' }
const gameName = (name) => NAME_FIXES[name] ?? name

/** Reads `{{Name|Item|3|link=...}}`, returning the item name and quantity. */
function nameTemplate(text) {
  const match = /\{\{\s*Name\s*\|([^|}]+)([^}]*)\}\}/.exec(text)
  if (!match) return null
  const quantity = /\|\s*(\d+)\s*(?=\||$)/.exec(match[2])
  return { name: gameName(match[1].trim()), quantity: quantity ? Number(quantity[1]) : 1 }
}

function parseReward(row) {
  const lines = row.split('\n')
  const labelAt = lines.findIndex((l) => l.includes('Reward:'))
  const cell = lines.slice(labelAt + 1).find((l) => l.startsWith('|'))
  if (!cell) return ''
  const body = cellText(cell)

  let name
  let quantity
  const named = nameTemplate(body)
  if (named) {
    ;({ name, quantity } = named)
  } else {
    const text = stripWikitext(body)
    const counted = /^(.*?)\s*\((\d+)\)$/.exec(text)
    name = gameName(counted ? counted[1] : text)
    quantity = counted ? Number(counted[2]) : 1
  }
  return quantity > 1 ? `${quantity} ${name}` : name
}

function itemFrom(text) {
  const quality = /\{\{\s*Quality\s*\|([^|}]+)\|([^|}]+)/.exec(text)
  if (quality) {
    const counted = /\((\d+)\)/.exec(text.replace(/\{\{[^}]*\}\}/g, ''))
    const orBetter = /\bor (?:better|Iridium)\b/i.test(text) ? ' or better' : ''
    return {
      name: `${gameName(quality[1].trim())} (${quality[2].trim()} quality${orBetter})`,
      quantity: counted ? Number(counted[1]) : 1,
    }
  }
  return nameTemplate(text)
}

function parseItemRow(row) {
  // Missing Bundle rows hold the item in a nested table; the source follows it.
  const nested = /^\{\|[\s\S]*?^\|\}/m.exec(row)
  if (nested) {
    const item = itemFrom(nested[0])
    if (!item) return null
    const rest = row.replace(nested[0], '')
    const sourceLine = rest.split('\n').filter((l) => l.startsWith('|')).pop() ?? ''
    return { ...item, source: stripWikitext(cellText(sourceLine)) }
  }

  const lines = row.split('\n')
  const itemAt = lines.findIndex((l) => /\{\{\s*(?:Name|Quality)\s*\|/.test(l))
  if (itemAt < 0) return null
  const item = itemFrom(lines[itemAt])
  if (!item) return null
  const sourceLine = lines.slice(itemAt + 1).find((l) => l.startsWith('|'))
  return { ...item, source: sourceLine ? stripWikitext(cellText(sourceLine)) : '' }
}

/** Reads the reward from a room's reward table, e.g. "Movie Theater". */
function roomReward(tableText) {
  const cell = tableText.split('\n').filter((l) => /^\|(?![-}])/.test(l)).pop()
  return cell ? stripWikitext(cellText(cell)) : ''
}

function parseTable(room, rawTableText, fallbackReward) {
  // {{!}} is a pipe that must not end a template argument; stripWikitext restores it.
  const tableText = rawTableText.replace(/\{\{!\}\}/g, '¦')
  const header = /^!\s*id="([^"]+)"[^|]*\|(.*)$/m.exec(tableText)
  if (!header) return null // room reward tables have no bundle id

  const idAttr = header[1]
  const headerName = stripWikitext(header[2])
  const vault = /^g(\d+)\s+Bundle$/.exec(idAttr)

  let id
  let name
  if (vault) {
    id = `vault-${vault[1]}`
    name = formatGold(vault[1])
  } else if (/Missing Bundle/.test(headerName)) {
    id = 'missing-bundle'
    name = headerName
  } else {
    name = headerName.replace(/\s+Bundle$/, '')
    id = slugify(name)
  }

  const rows = splitRows(tableText.replace(/^\{\|.*\n/, '').replace(/\n\|\}\s*$/, ''))
  let reward = ''
  const items = []
  for (const row of rows) {
    if (row.includes('Reward:')) {
      reward = parseReward(row)
      continue
    }
    const price = /\{\{\s*Price\s*\|(\d+)\s*\}\}/.exec(row)
    if (vault && price) {
      items.push({ name: formatGold(price[1]), quantity: 1, source: 'Gold' })
      continue
    }
    const item = parseItemRow(row)
    if (item) items.push(item)
  }

  const slots = (tableText.match(/Bundle Slot\.png/g) ?? []).length
  return { id, room, name, reward: reward || fallbackReward, slotsRequired: vault ? 1 : slots, items }
}

/** Parses the standard bundles (and the Missing Bundle) from the wiki's Bundles page. */
export function parseBundles(wikitext) {
  const start = wikitext.indexOf('==Standard Bundles==')
  const end = wikitext.indexOf('==Remixed Bundles==')
  const body = wikitext.slice(start, end > start ? end : undefined)

  const headings = [...body.matchAll(/^===\s*(.+?)\s*===\s*$/gm)]
  const bundles = []
  headings.forEach((heading, index) => {
    const from = heading.index + heading[0].length
    const to = index + 1 < headings.length ? headings[index + 1].index : body.length
    const tables = topLevelTables(body.slice(from, to))
    // The first table without a bundle id is the room's reward table.
    const rewardTable = tables.find((t) => !/^!\s*id="/m.test(t))
    const fallbackReward = rewardTable ? roomReward(rewardTable) : ''
    for (const table of tables) {
      const bundle = parseTable(heading[1], table, fallbackReward)
      if (bundle) bundles.push(bundle)
    }
  })
  return bundles
}
