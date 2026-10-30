import { describe, it, expect } from 'vitest'
import { MAP_SIZE, PLACE_POSITIONS } from './map-places'
import schedules from './schedules.json'

describe('map places', () => {
  it('has a position for every place in the schedules', () => {
    const places = new Set<string>()
    const walk = (o: unknown) => {
      if (Array.isArray(o)) o.forEach(walk)
      else if (o && typeof o === 'object') {
        const rec = o as Record<string, unknown>
        if (typeof rec.place === 'string') places.add(rec.place)
        Object.values(rec).forEach(walk)
      }
    }
    walk(schedules)
    for (const p of places) expect(PLACE_POSITIONS, `place ${p}`).toHaveProperty([p])
  })

  it('keeps every position on the map', () => {
    for (const { x, y } of Object.values(PLACE_POSITIONS)) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(MAP_SIZE.w)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(MAP_SIZE.h)
    }
  })
})
