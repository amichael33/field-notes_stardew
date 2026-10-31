import { describe, it, expect } from 'vitest'
import { defaultFarm, parseFarm } from './farm-save'

const crop = { id: 'c1', crop: 'parsnip', count: 4, season: 'spring', day: 3 }
const farm = (over: Record<string, unknown>) => ({ ...defaultFarm(), ...over })

describe('parseFarm', () => {
  it('round-trips the default farm', () => {
    expect(parseFarm(defaultFarm())).toEqual(defaultFarm())
  })

  it('round-trips animal counts, a goal, and unknown building, crop and animal ids', () => {
    const f = farm({
      buildings: { Coop: 3, Mystery: 2 },
      animals: { 'White Chicken': 2, Mystery: 1 },
      crops: [{ ...crop, crop: 'mystery', lastHarvest: { season: 'summer', day: 1 } }],
      goal: 'house:1',
    })
    expect(parseFarm(f)).toEqual(f)
  })

  it('turns the old animal list into counts and ignores the dropped fields', () => {
    const old = {
      buildings: { Coop: 1 },
      animals: [
        { id: 'a', type: 'White Chicken', name: 'C', home: 'Coop' },
        { id: 'b', type: 'White Chicken', name: 'D', home: 'Coop' },
      ],
      crops: [],
      tools: { Axe: 1 },
      skills: {},
      gold: 5,
      saving: null,
    }
    expect(parseFarm(old)).toEqual({ buildings: { Coop: 1 }, animals: { 'White Chicken': 2 }, crops: [], goal: null })
  })

  it.each([
    ['animal count 100', farm({ animals: { 'White Chicken': 100 } })],
    ['animal count -1', farm({ animals: { 'White Chicken': -1 } })],
    ['animal count 1.5', farm({ animals: { 'White Chicken': 1.5 } })],
    ['numeric goal', farm({ goal: 3 })],
    ['chain level 4', farm({ buildings: { Coop: 4 } })],
    ['building count 100', farm({ buildings: { Silo: 100 } })],
    ['crop day 29', farm({ crops: [{ ...crop, day: 29 }] })],
    ['unknown season', farm({ crops: [{ ...crop, season: 'monsoon' }] })],
    ['bad lastHarvest', farm({ crops: [{ ...crop, lastHarvest: { season: 'spring', day: 0 } }] })],
    ['crop count 0', farm({ crops: [{ ...crop, count: 0 }] })],
    ['non-integer crop count', farm({ crops: [{ ...crop, count: 1.5 }] })],
    ['duplicate crop ids', farm({ crops: [crop, crop] })],
    ['not an object', 'farm'],
  ])('rejects %s', (_name, value) => {
    expect(parseFarm(value)).toBeNull()
  })

  it('drops unknown keys', () => {
    const parsed = parseFarm({ ...defaultFarm(), extra: 1, crops: [{ ...crop, extra: true }] })
    expect(parsed).toEqual({ ...defaultFarm(), crops: [crop] })
  })
})
