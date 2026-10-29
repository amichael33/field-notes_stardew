const BULLET = /^( *)([•◦]) (.*)$/

const bulletFor = (indent: number) => (indent === 0 ? '•' : '◦')

export interface Edit {
  value: string
  cursor: number
}

function lineBounds(value: string, pos: number): { start: number; end: number } {
  const start = value.lastIndexOf('\n', pos - 1) + 1
  const nl = value.indexOf('\n', pos)
  return { start, end: nl === -1 ? value.length : nl }
}

/** Turns a typed "- " or "* " at the start of the current line into a bullet. */
export function autoBullet(value: string, cursor: number): Edit | null {
  const { start, end } = lineBounds(value, cursor)
  const m = /^( *)[-*] (.*)$/.exec(value.slice(start, end))
  if (!m) return null
  const line = `${m[1]}${bulletFor(m[1].length)} ${m[2]}`
  return { value: value.slice(0, start) + line + value.slice(end), cursor }
}

/** Enter on a bullet line continues the list; Enter on an empty bullet ends it. */
export function bulletEnter(value: string, cursor: number): Edit | null {
  const { start, end } = lineBounds(value, cursor)
  const m = BULLET.exec(value.slice(start, end))
  if (!m || cursor - start < m[1].length + 2) return null
  if (m[3] === '') {
    const indent = m[1].slice(0, Math.max(0, m[1].length - 2))
    const line = m[1] === '' ? '' : `${indent}${bulletFor(indent.length)} `
    return { value: value.slice(0, start) + line + value.slice(end), cursor: start + line.length }
  }
  const before = value.slice(0, cursor)
  const insert = `\n${m[1]}${m[2]} `
  return { value: before + insert + value.slice(cursor), cursor: before.length + insert.length }
}

/** Tab / Shift+Tab on a bullet line indents or outdents it by two spaces. */
export function bulletIndent(value: string, cursor: number, outdent: boolean): Edit | null {
  const { start, end } = lineBounds(value, cursor)
  const m = BULLET.exec(value.slice(start, end))
  if (!m || (outdent && m[1].length === 0)) return null
  const indent = outdent ? m[1].slice(0, m[1].length - 2) : m[1] + '  '
  const line = `${indent}${bulletFor(indent.length)} ${m[3]}`
  return { value: value.slice(0, start) + line + value.slice(end), cursor: cursor + (line.length - (end - start)) }
}
