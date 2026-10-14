import { PNG } from 'pngjs'

const SIZE = 16

/** @param {number} index @param {number} columns */
export function spriteOrigin(index, columns) {
  return { x: (index % columns) * SIZE, y: Math.floor(index / columns) * SIZE }
}

/** @param {PNG} sheet @param {number} x @param {number} y @returns {PNG} */
export function cropSprite(sheet, x, y) {
  const out = new PNG({ width: SIZE, height: SIZE })
  PNG.bitblt(sheet, out, x, y, SIZE, SIZE, 0, 0)
  return out
}
