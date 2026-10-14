import { PNG } from 'pngjs'

const SIZE = 16

/**
 * Chooses the sprite sheet for an object's Texture value.
 * @param {string | null} texture
 * @returns {{ key: 'main' | 'objects2', columns: number }}
 */
export function sheetFor(texture) {
  return texture === 'TileSheets\\Objects_2' ? { key: 'objects2', columns: 8 } : { key: 'main', columns: 24 }
}

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
