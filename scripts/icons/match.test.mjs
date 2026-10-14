// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { slugify, baseName, matchItems } from './match.mjs'

const obj = (Name, DisplayName, SpriteIndex, Texture = null) => ({ Name, DisplayName, SpriteIndex, Texture })

describe('slugify', () => {
  it('turns "Wild Horseradish" into "wild-horseradish"', () => {
    expect(slugify('Wild Horseradish')).toBe('wild-horseradish')
  })
})

describe('baseName', () => {
  it('strips "(gold quality)" and "(silver quality or better)"', () => {
    expect(baseName('Parsnip (gold quality)')).toBe('Parsnip')
    expect(baseName('Cauliflower (silver quality or better)')).toBe('Cauliflower')
  })
})

describe('matchItems', () => {
  it('matches by Name', () => {
    const r = matchItems(['Leek'], { 20: obj('Leek', '[LocalizedText Strings\\Objects:Leek_Name]', 5) }, {})
    expect(r.matched.Leek).toEqual({ id: '20', texture: null, spriteIndex: 5 })
  })
  it('matches by localised DisplayName', () => {
    const objects = { 7: obj('Odd_Internal', '[LocalizedText Strings\\Objects:Odd_Name]', 9) }
    const r = matchItems(['Pretty Thing'], objects, { Odd_Name: 'Pretty Thing' })
    expect(r.matched['Pretty Thing'].id).toBe('7')
    expect(r.unmatched).toEqual([])
  })
  it('strips quality suffixes before matching', () => {
    const r = matchItems(['Leek (gold quality)'], { 20: obj('Leek', '', 5) }, {})
    expect(r.matched['Leek (gold quality)'].id).toBe('20')
  })
  it('applies the Large Brown Egg and Large Goat Milk hand mappings', () => {
    const objects = {
      174: obj('Large Egg', '', 1),
      182: obj('Large Egg', '', 2),
      438: obj('L. Goat Milk', '', 3),
    }
    const r = matchItems(['Large Brown Egg', 'Large Goat Milk'], objects, {})
    expect(r.matched['Large Brown Egg'].id).toBe('182')
    expect(r.matched['Large Goat Milk'].id).toBe('438')
  })
  it('picks the lowest id when two objects share a name', () => {
    const objects = { 182: obj('Large Egg', '', 2), 174: obj('Large Egg', '', 1) }
    const r = matchItems(['Large Egg'], objects, {})
    expect(r.matched['Large Egg'].id).toBe('174')
  })
  it('reports gold amounts separately and not as unmatched', () => {
    const r = matchItems(['2,500g', '25,000g'], {}, {})
    expect(r.gold).toEqual(['2,500g', '25,000g'])
    expect(r.unmatched).toEqual([])
    expect(r.matched).toEqual({})
  })
  it('reports a truly unknown name as unmatched', () => {
    const r = matchItems(['Nonexistent'], { 1: obj('Leek', '', 5) }, {})
    expect(r.unmatched).toEqual(['Nonexistent'])
  })
})
