import { describe, it, expect } from 'vitest'
import { defaultFarm, parseFarm } from './farm-save'

const crop = { id: 'c1', crop: 'parsnip', count: 4, season: 'spring', day: 3 }
const animal = { id: 'a1', type: 'Chicken', name: 'Hen', home: 'Coop' }
const farm = (over: Record<string, unknown>) => ({ ...defaultFarm(), ...over })

describe('parseFarm', () => {
  it('round-trips the default farm', () => {
    expect(parseFarm(defaultFarm())).toEqual(defaultFarm())
  })

  it('accepts a full farm, including unknown building, crop and animal ids', () => {
    const f = farm({
      buildings: { Coop: 3, Mystery: 2 },
      animals: [{ ...animal, type: 'Unknown' }],
      crops: [{ ...crop, crop: 'mystery', lastHarvest: { season: 'summer', day: 1 } }],
      tools: { Axe: 4 },
      skills: { Farming: 10 },
      gold: 500,
      saving: 'Barn',
    })
    expect(parseFarm(f)).toEqual(f)
  })

  it.each([
    ['negative gold', farm({ gold: -1 })],
    ['non-integer gold', farm({ gold: 1.5 })],
    ['tool level 5', farm({ tools: { Axe: 5 } })],
    ['skill level 11', farm({ skills: { Farming: 11 } })],
    ['chain level 4', farm({ buildings: { Coop: 4 } })],
    ['building count 100', farm({ buildings: { Silo: 100 } })],
    ['crop day 29', farm({ crops: [{ ...crop, day: 29 }] })],
    ['unknown season', farm({ crops: [{ ...crop, season: 'monsoon' }] })],
    ['bad lastHarvest', farm({ crops: [{ ...crop, lastHarvest: { season: 'spring', day: 0 } }] })],
    ['crop count 0', farm({ crops: [{ ...crop, count: 0 }] })],
    ['non-integer crop count', farm({ crops: [{ ...crop, count: 1.5 }] })],
    ['duplicate crop ids', farm({ crops: [crop, crop] })],
    ['duplicate animal ids', farm({ animals: [animal, animal] })],
    ['bad animal home', farm({ animals: [{ ...animal, home: 'Shed' }] })],
    ['non-string saving', farm({ saving: 3 })],
    ['not an object', 'farm'],
  ])('rejects %s', (_name, value) => {
    expect(parseFarm(value)).toBeNull()
  })

  it('drops unknown keys', () => {
    const parsed = parseFarm({
      ...defaultFarm(),
      extra: 1,
      tools: { Axe: 1, Laser: 2 },
      crops: [{ ...crop, extra: true }],
      animals: [{ ...animal, extra: true }],
    })
    expect(parsed).toEqual({ ...defaultFarm(), tools: { Axe: 1 }, crops: [crop], animals: [animal] })
  })
})
