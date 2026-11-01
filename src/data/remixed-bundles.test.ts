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

describe('slotsRequired matching the standard twins', () => {
  it('uses the standard counts when the wiki states none', () => {
    const need = (name: string) => bundles.find((b) => b.bundle.name === name)!.bundle.slotsRequired
    expect(need('Exotic Foraging')).toBe(5)
    expect(need('Quality Crops')).toBe(3)
    expect(need('Animal')).toBe(5)
    expect(need('Artisan')).toBe(6)
  })
})

describe('Fish Tank', () => {
  it('has 6 slots, the last offering three alternatives', () => {
    const slotList = room('Fish Tank').slots
    expect(slotList).toHaveLength(6)
    const last = slotList[5]
    expect(last.kind).toBe('alternatives')
    expect(last.bundles.map((b) => b.name)).toEqual(['Specialty Fish', 'Quality Fish', "Master Fisher's"])
  })

  it('keeps the standard counts for the fish bundles', () => {
    const need = (name: string) => bundles.find((b) => b.bundle.name === name)!.bundle.slotsRequired
    expect(need('River Fish')).toBe(4)
    expect(need('Night Fishing')).toBe(3)
    expect(need('Crab Pot')).toBe(5)
    expect(need("Master Fisher's")).toBe(4)
  })
})

describe('Boiler Room', () => {
  it('is a single pool that picks 3', () => {
    const slotList = room('Boiler Room').slots
    expect(slotList).toHaveLength(1)
    expect(slotList[0].id).toBe('boiler-room-1')
    expect(slotList[0].kind).toBe('pool')
    expect(slotList[0].pick).toBe(3)
    expect(slotList[0].bundles.map((b) => b.name)).toEqual([
      "Blacksmith's",
      "Geologist's",
      "Adventurer's",
      "Treasure Hunter's",
      "Engineer's",
    ])
  })

  it('needs 4 of 5 Adventurer items including Bone Fragment', () => {
    const b = bundleNamed(slotNamed('Boiler Room', "Adventurer's"), "Adventurer's")
    expect(b.slotsRequired).toBe(4)
    expect(b.items).toHaveLength(5)
    expect(b.items.map((i) => i.name)).toContain('Bone Fragment')
  })
})

describe('Bulletin Board', () => {
  it('is a single pool that picks 5 of the wiki bundles', () => {
    const slotList = room('Bulletin Board').slots
    expect(slotList).toHaveLength(1)
    expect(slotList[0].id).toBe('bulletin-board-1')
    expect(slotList[0].kind).toBe('pool')
    expect(slotList[0].pick).toBe(5)
    expect(slotList[0].bundles).toHaveLength(11)
  })

  it("has the Home Cook's bundle with 100 Wheat Flour", () => {
    const b = bundleNamed(slotNamed('Bulletin Board', "Home Cook's"), "Home Cook's")
    const flour = b.items.find((i) => i.name === 'Wheat Flour')!
    expect(flour.quantity).toBe(100)
  })

  it('needs 6 of the 12 Dye items', () => {
    const b = bundleNamed(slotNamed('Bulletin Board', 'Dye'), 'Dye')
    expect(b.items).toHaveLength(12)
    expect(b.slotsRequired).toBe(6)
  })
})

describe('Vault', () => {
  it('has 4 fixed gold slots', () => {
    const slotList = room('Vault').slots
    expect(slotList).toHaveLength(4)
    expect(slotList.every((s) => s.kind === 'fixed')).toBe(true)
    expect(slotList.map((s) => s.bundles[0].items[0].name)).toEqual([
      '2,500g',
      '5,000g',
      '10,000g',
      '25,000g',
    ])
  })
})

describe('whole file', () => {
  it('has exactly the six rooms', () => {
    expect(rooms.map((r) => r.room)).toEqual([
      'Crafts Room',
      'Pantry',
      'Fish Tank',
      'Boiler Room',
      'Bulletin Board',
      'Vault',
    ])
  })
})

describe('pinned counts the wiki leaves unstated or states in passing', () => {
  const rows: [string, number, number][] = [
    ['Garden', 5, 5],
    ['Wild Medicine', 4, 4],
    ["Fish Farmer's", 3, 3],
    ["Brewer's", 5, 5],
    ['Rare Crops', 2, 2],
    ["Treasure Hunter's", 6, 6],
    ['Quality Fish', 4, 4],
    ['Crab Pot', 5, 10],
    ['Sticky', 1, 1],
    ['Summer Foraging', 3, 3],
    ['Fall Foraging', 4, 4],
    ['Construction', 4, 4],
  ]
  it.each(rows)('%s needs %i of %i', (name, need, total) => {
    const b = bundles.find((x) => x.bundle.name === name)!.bundle
    expect(b.slotsRequired).toBe(need)
    expect(b.items).toHaveLength(total)
  })
})

describe('remixed bundle ids and sources', () => {
  it('has no single-letter hyphen segments in ids', () => {
    for (const { bundle } of bundles) expect(bundle.id, bundle.id).not.toMatch(/-[a-z](-|$)/)
  })

  it('says iridium quality also works for every Quality Fish item', () => {
    const b = bundles.find((x) => x.bundle.name === 'Quality Fish')!.bundle
    expect(b.items).toHaveLength(4)
    for (const item of b.items) expect(item.source).toMatch(/iridium quality also works/)
  })
})
