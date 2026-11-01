import { describe, expect, it } from 'vitest'
import type { Bundle, RemixRoom, RemixSlot } from './types'
import { activeBundles, activeRemixBundles, chosenBundles, slotNeedsPick, togglePick } from './remix'

const b = (id: string): Bundle => ({
  id,
  room: 'Test',
  name: id,
  reward: 'Reward',
  slotsRequired: 1,
  items: [{ name: 'Parsnip', quantity: 1, seasons: 'any', source: 'Farm' }],
})

const fixed: RemixSlot = { id: 'a', kind: 'fixed', pick: 1, bundles: [b('remix-a')] }
const alts: RemixSlot = {
  id: 'b',
  kind: 'alternatives',
  pick: 1,
  bundles: [b('remix-b1'), b('remix-b2'), b('remix-b3')],
}
const pool: RemixSlot = {
  id: 'p',
  kind: 'pool',
  pick: 3,
  bundles: ['remix-p1', 'remix-p2', 'remix-p3', 'remix-p4', 'remix-p5'].map(b),
}
const rooms: RemixRoom[] = [
  { room: 'One', slots: [fixed] },
  { room: 'Two', slots: [alts] },
  { room: 'Three', slots: [pool] },
]
const ids = (list: Bundle[]) => list.map((x) => x.id)

describe('chosenBundles', () => {
  it('gives a fixed slot its bundle without picks', () => {
    expect(ids(chosenBundles(fixed, {}))).toEqual(['remix-a'])
  })
  it('gives the picked alternative', () => {
    expect(ids(chosenBundles(alts, { b: ['remix-b2'] }))).toEqual(['remix-b2'])
  })
  it('ignores unknown ids', () => {
    expect(chosenBundles(alts, { b: ['x'] })).toEqual([])
  })
  it('caps a pool at pick, in slot order', () => {
    const picks = { p: ['remix-p5', 'remix-p3', 'remix-p1', 'remix-p2'] }
    expect(ids(chosenBundles(pool, picks))).toEqual(['remix-p1', 'remix-p2', 'remix-p3'])
  })
})

describe('slotNeedsPick', () => {
  it('is false for fixed', () => {
    expect(slotNeedsPick(fixed, {})).toBe(false)
  })
  it('is true for an empty alternatives slot', () => {
    expect(slotNeedsPick(alts, {})).toBe(true)
  })
  it('is true for a pool short of its picks, false when full', () => {
    expect(slotNeedsPick(pool, { p: ['remix-p1', 'remix-p2'] })).toBe(true)
    expect(slotNeedsPick(pool, { p: ['remix-p1', 'remix-p2', 'remix-p3'] })).toBe(false)
  })
})

describe('togglePick', () => {
  it('replaces the pick in a pick-1 slot', () => {
    expect(togglePick(alts, { b: ['remix-b1'] }, 'remix-b2')).toEqual({ b: ['remix-b2'] })
  })
  it('unpicks a picked bundle', () => {
    expect(togglePick(alts, { b: ['remix-b1'] }, 'remix-b1')).toEqual({ b: [] })
  })
  it('adds to a pool up to pick and refuses a fourth', () => {
    let picks: Record<string, string[]> = {}
    for (const id of ['remix-p1', 'remix-p2', 'remix-p3']) picks = togglePick(pool, picks, id)
    expect(picks).toEqual({ p: ['remix-p1', 'remix-p2', 'remix-p3'] })
    expect(togglePick(pool, picks, 'remix-p4')).toEqual(picks)
  })
  it('frees a place when unpicking', () => {
    const full = { p: ['remix-p1', 'remix-p2', 'remix-p3'] }
    const less = togglePick(pool, full, 'remix-p2')
    expect(togglePick(pool, less, 'remix-p4')).toEqual({ p: ['remix-p1', 'remix-p3', 'remix-p4'] })
  })
  it('ignores fixed slots and unknown ids, and returns a new object', () => {
    const picks = { b: ['remix-b1'] }
    expect(togglePick(fixed, picks, 'remix-a')).toEqual(picks)
    expect(togglePick(alts, picks, 'nope')).toEqual(picks)
    expect(togglePick(alts, picks, 'nope')).not.toBe(picks)
  })
  it('does not mutate its input', () => {
    const picks = { p: ['remix-p1'] }
    togglePick(pool, picks, 'remix-p2')
    expect(picks).toEqual({ p: ['remix-p1'] })
  })
})

describe('activeRemixBundles and activeBundles', () => {
  const picks = { b: ['remix-b3'], p: ['remix-p2', 'remix-p4'] }
  const std = [b('std-1')]
  it('lists chosen bundles in room and slot order', () => {
    expect(ids(activeRemixBundles(rooms, picks))).toEqual(['remix-a', 'remix-b3', 'remix-p2', 'remix-p4'])
  })
  it('returns the standard list in standard mode', () => {
    expect(activeBundles('standard', std, rooms, picks)).toBe(std)
  })
  it('returns the remixed bundles in remixed mode', () => {
    expect(ids(activeBundles('remixed', std, rooms, picks))).toEqual([
      'remix-a',
      'remix-b3',
      'remix-p2',
      'remix-p4',
    ])
  })
})
