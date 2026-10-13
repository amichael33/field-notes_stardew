/** Splits text into its top-level wikitext tables, keeping nested tables inside their parent. */
export function topLevelTables(text) {
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
export function splitRows(tableText) {
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

/** Returns a table cell's text without its leading `|` or cell attributes. */
export function cellText(line) {
  const attrs = /^\|\s*(?:[\w-]+="[^"]*"\s*)+\|/.exec(line)
  const body = attrs ? line.slice(attrs[0].length) : line.replace(/^\|/, '')
  return body.trim()
}

/**
 * Returns the cells of a row, one string per cell. A line starting with `|`
 * begins a cell; any other line continues the previous cell.
 */
export function rowCells(row) {
  const cells = []
  for (const line of row.split('\n')) {
    if (/^\|(?![}-])/.test(line)) cells.push(cellText(line))
    else if (cells.length > 0 && line.trim() !== '') cells[cells.length - 1] += `\n${line}`
  }
  return cells
}

/** Returns a table's rows area: the table text without its `{|` opening line and `|}` closing line. */
export function tableBody(tableText) {
  return tableText.replace(/^\{\|.*\n/, '').replace(/\n\|\}\s*$/, '')
}
