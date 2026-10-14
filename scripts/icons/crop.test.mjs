// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { PNG } from 'pngjs'
import { spriteOrigin, cropSprite } from './crop.mjs'

describe('spriteOrigin', () => {
  it('maps index 25 on a 24-column sheet to x 16, y 16', () => {
    expect(spriteOrigin(25, 24)).toEqual({ x: 16, y: 16 })
  })
  it('maps 123 on an 8-column sheet to x 48, y 240', () => {
    expect(spriteOrigin(123, 8)).toEqual({ x: 48, y: 240 })
  })
})

describe('cropSprite', () => {
  it('copies exactly the 16x16 pixels at the origin', () => {
    const sheet = new PNG({ width: 48, height: 32 })
    const colourAt = (tx, ty) => [10 + tx * 50, 20 + ty * 100, 99, 255]
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 48; x++) {
        const c = colourAt(Math.floor(x / 16), Math.floor(y / 16))
        const i = (y * 48 + x) * 4
        sheet.data[i] = c[0]
        sheet.data[i + 1] = c[1]
        sheet.data[i + 2] = c[2]
        sheet.data[i + 3] = c[3]
      }
    }
    const out = cropSprite(sheet, 16, 16)
    expect(out.width).toBe(16)
    expect(out.height).toBe(16)
    const want = colourAt(1, 1)
    for (let p = 0; p < 256; p++) {
      expect([...out.data.subarray(p * 4, p * 4 + 4)]).toEqual(want)
    }
  })
})
