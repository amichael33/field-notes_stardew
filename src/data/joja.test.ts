import { describe, it, expect } from 'vitest'
import { JOJA, JOJA_TOTAL, MEMBERSHIP, PROJECTS, jojaId, nextJojaStep, gold } from './joja'

describe('joja data', () => {
  it('has the five projects at the wiki prices, 135,000g in all', () => {
    expect(PROJECTS.map((p) => [p.name, p.price])).toEqual([
      ['Minecarts', 15000],
      ['Panning', 20000],
      ['Bridge', 25000],
      ['Greenhouse', 35000],
      ['Bus', 40000],
    ])
    expect(JOJA_TOTAL).toBe(135000)
    expect(MEMBERSHIP.price).toBe(5000)
  })

  it('has unique ids and a stock list for each buying season', () => {
    const ids = [MEMBERSHIP.id, ...PROJECTS.map((p) => p.id)]
    expect(new Set(ids).size).toBe(ids.length)
    expect(JOJA.stock.spring).toHaveLength(7)
    expect(JOJA.stock.summer).toHaveLength(9)
    expect(JOJA.stock.fall).toHaveLength(11)
  })
})

describe('nextJojaStep', () => {
  it('starts with the membership, then the projects in order', () => {
    expect(nextJojaStep([])?.name).toBe('JojaMart Membership')
    expect(nextJojaStep([jojaId('membership')])?.name).toBe('Minecarts')
    expect(nextJojaStep([jojaId('membership'), jojaId('minecarts'), jojaId('bridge')])?.name).toBe('Panning')
  })
  it('is undefined once everything is bought', () => {
    const all = ['membership', ...PROJECTS.map((p) => p.id)].map(jojaId)
    expect(nextJojaStep(all)).toBeUndefined()
  })
})

describe('gold', () => {
  it('formats with a thousands separator', () => {
    expect(gold(15000)).toBe('15,000g')
  })
})
