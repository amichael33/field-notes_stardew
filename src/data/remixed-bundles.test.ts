import { describe, expect, it } from 'vitest'
import remixed from './remixed-bundles.json'
import icons from './item-icons.json'
import { ROOM_ORDER } from './selectors'
import type { RemixRoom, RemixSlot } from './types'

const rooms = remixed as RemixRoom[]
const slots = rooms.flatMap((r) => r.slots)
const bundles = slots.flatMap((s) => s.bundles.map((b) => ({ slot: s, bundle: b })))
// Item names that have no icon, with the reason. Empty when every item has one.
const ICONLESS = new Set<string>([])

const room = (name: string) => rooms.find((r) => r.room === name)!
const slotNamed = (r: string, bundleName: string) =>
  room(r).slots.find((s) => s.bundles.some((b) => b.name === bundleName))!
const bundleNamed = (slot: RemixSlot, name: string) => slot.bundles.find((b) => b.name === name)!

describe('remixed bundle data', () => {
  it('uses known room names', () => {
    for (const r of rooms) expect(ROOM_ORDER).toContain(r.room)
  })

  it('has well-formed slots', () => {
    for (const s of slots) {
      expect(['fixed', 'alternatives', 'pool']).toContain(s.kind)
      if (s.kind === 'fixed') {
        expect(s.pick).toBe(1)
        expect(s.bundles).toHaveLength(1)
      } else if (s.kind === 'alternatives') {
        expect(s.pick).toBe(1)
        expect(s.bundles.length).toBeGreaterThanOrEqual(2)
        expect(s.bundles.length).toBeLessThanOrEqual(3)
      } else {
        expect(s.pick).toBeLessThan(s.bundles.length)
      }
    }
  })

  it('has unique remix- bundle ids and matching rooms', () => {
    const ids = bundles.map((b) => b.bundle.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of rooms) {
      for (const s of r.slots) {
        for (const b of s.bundles) {
          expect(b.id.startsWith('remix-')).toBe(true)
          expect(b.room).toBe(r.room)
        }
      }
    }
  })

  it('has unique slot ids', () => {
    const ids = slots.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has sane slotsRequired', () => {
    for (const { bundle } of bundles) {
      expect(bundle.slotsRequired).toBeGreaterThanOrEqual(1)
      expect(bundle.slotsRequired).toBeLessThanOrEqual(bundle.items.length)
    }
  })

  it('has an icon for every item', () => {
    const known = new Set(Object.keys(icons))
    for (const { bundle } of bundles) {
      for (const item of bundle.items) {
        if (!ICONLESS.has(item.name)) expect(known.has(item.name), item.name).toBe(true)
      }
    }
  })
})

describe('Crafts Room', () => {
  const r = () => room('Crafts Room')

  it('has 6 slots', () => {
    expect(r().slots).toHaveLength(6)
  })

  it('offers three Construction alternatives', () => {
    const slot = slotNamed('Crafts Room', 'Construction')
    expect(slot.kind).toBe('alternatives')
    expect(slot.bundles.map((b) => b.name)).toEqual(['Construction', 'Sticky', 'Forest'])
  })

  it('offers two Exotic Foraging alternatives', () => {
    const slot = slotNamed('Crafts Room', 'Exotic Foraging')
    expect(slot.bundles.map((b) => b.name)).toEqual(['Exotic Foraging', 'Wild Medicine'])
  })

  it('needs 4 of 5 Spring Foraging items including Spring Onion', () => {
    const b = bundleNamed(slotNamed('Crafts Room', 'Spring Foraging'), 'Spring Foraging')
    expect(b.slotsRequired).toBe(4)
    expect(b.items).toHaveLength(5)
    expect(b.items.map((i) => i.name)).toContain('Spring Onion')
  })

  it('needs 4 of 5 Winter Foraging items including Holly', () => {
    const b = bundleNamed(slotNamed('Crafts Room', 'Winter Foraging'), 'Winter Foraging')
    expect(b.slotsRequired).toBe(4)
    expect(b.items).toHaveLength(5)
    expect(b.items.map((i) => i.name)).toContain('Holly')
  })
})

describe('Pantry', () => {
  it('has 6 slots', () => {
    expect(room('Pantry').slots).toHaveLength(6)
  })

  it('offers two Quality Crops alternatives', () => {
    const slot = slotNamed('Pantry', 'Quality Crops')
    expect(slot.kind).toBe('alternatives')
    expect(slot.bundles).toHaveLength(2)
  })

  it('needs 4 of 6 Spring Crops including Kale and Carrot', () => {
    const b = bundleNamed(slotNamed('Pantry', 'Spring Crops'), 'Spring Crops')
    expect(b.slotsRequired).toBe(4)
    expect(b.items).toHaveLength(6)
    const names = b.items.map((i) => i.name)
    expect(names).toContain('Kale')
    expect(names).toContain('Carrot')
  })
})
