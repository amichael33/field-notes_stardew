// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { deriveSeasons, mergeBundleSeasons, diffBundles, diffVillagers } from './build.mjs'

describe('deriveSeasons', () => {
  it('reads season words from the source text in calendar order', () => {
    expect(deriveSeasons('Fall Farming, Summer Foraging')).toEqual(['summer', 'fall'])
  })
  it("returns 'any' when no season is mentioned", () => {
    expect(deriveSeasons('Dropped by Slimes')).toBe('any')
  })
})

describe('mergeBundleSeasons', () => {
  const generated = [
    { id: 'b', name: 'B', reward: 'R', slotsRequired: 1, items: [
      { name: 'Kept', quantity: 1, source: 'Spring Foraging' },
      { name: 'Fresh', quantity: 1, source: 'Summer Crops' },
      { name: 'Plain', quantity: 1, source: 'Dropped by Slimes' },
    ] },
  ]
  const existing = [{ id: 'b', items: [{ name: 'Kept', seasons: ['winter'] }] }]

  it('keeps hand-curated seasons for items that already exist', () => {
    const { bundles } = mergeBundleSeasons(generated, existing)
    expect(bundles[0].items[0].seasons).toEqual(['winter'])
  })
  it('derives seasons for new items and reports them', () => {
    const { bundles, derived } = mergeBundleSeasons(generated, existing)
    expect(bundles[0].items[1].seasons).toEqual(['summer'])
    expect(bundles[0].items[2].seasons).toBe('any')
    expect(derived).toEqual(['b / Fresh', 'b / Plain'])
  })
})

describe('diffBundles', () => {
  const base = { id: 'b', room: 'R', name: 'B', reward: 'Keg', slotsRequired: 2, items: [{ name: 'A', quantity: 1 }, { name: 'B', quantity: 3 }] }
  it('reports nothing when the bundles match', () => {
    expect(diffBundles([base], [base])).toEqual([])
  })
  it('reports changed rewards, slots, quantities and added or removed items', () => {
    const next = { ...base, reward: 'Cask', slotsRequired: 3, items: [{ name: 'A', quantity: 2 }, { name: 'C', quantity: 1 }] }
    expect(diffBundles([base], [next])).toEqual([
      'b: reward "Keg" -> "Cask"',
      'b: slots 2 -> 3',
      'b: item "A" quantity 1 -> 2',
      'b: item added "C"',
      'b: item removed "B"',
    ])
  })
  it('reports bundles that appear or disappear', () => {
    expect(diffBundles([base], [])).toEqual(['b: removed'])
    expect(diffBundles([], [base])).toEqual(['b: new bundle'])
  })
})

describe('diffVillagers', () => {
  const base = { name: 'Pierre', birthday: { season: 'spring', day: 26 }, loves: ['A', 'B'], likes: ['C'] }
  it('reports nothing when villagers match', () => {
    expect(diffVillagers([base], [base])).toEqual([])
  })
  it('reports birthday and gift changes', () => {
    const next = { ...base, birthday: { season: 'fall', day: 1 }, loves: ['A', 'D'], likes: [] }
    expect(diffVillagers([base], [next])).toEqual([
      'Pierre: birthday spring 26 -> fall 1',
      'Pierre: loves added D',
      'Pierre: loves removed B',
      'Pierre: likes removed C',
    ])
  })
})
