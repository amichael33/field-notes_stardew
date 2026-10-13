// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseAchievements } from './parse-achievements.mjs'

const wikitext = readFileSync(new URL('./fixtures/Achievements.wikitext', import.meta.url), 'utf8')
const achievements = parseAchievements(wikitext)
const byName = (name) => achievements.find((a) => a.name === name)

describe('parseAchievements', () => {
  it('finds all 49 in-game achievements in page order', () => {
    expect(achievements).toHaveLength(49)
    expect(achievements[0]).toEqual({ name: 'Greenhorn', requirement: 'Earn 15,000g' })
    expect(achievements.at(-1).name).toBe('Perfection')
  })

  it('turns links into plain text', () => {
    expect(byName('A New Friend').requirement).toBe('Reach a 5-heart friend level with someone.')
    expect(byName('Perfection').requirement).toBe('Reach the summit.')
  })

  it('keeps notes such as "Secret Achievement"', () => {
    expect(byName('Legend').requirement).toBe('Earn 10,000,000g (Secret Achievement)')
  })

  it('has unique names and no empty requirements', () => {
    expect(new Set(achievements.map((a) => a.name)).size).toBe(49)
    for (const a of achievements) expect(a.requirement.trim(), a.name).not.toBe('')
  })

  it('ignores the retroactive-achievements table further down the page', () => {
    expect(achievements.some((a) => /Donate a new item/.test(a.requirement))).toBe(false)
  })
})

describe('parseAchievements page-only wording', () => {
  it('drops "See (note below)" pointers that only make sense on the wiki page', () => {
    const byName = (name) => parseAchievements(readFileSync(new URL('./fixtures/Achievements.wikitext', import.meta.url), 'utf8')).find((a) => a.name === name)
    expect(byName('Polyculture').requirement).toBe('Ship 15 of each crop.')
    expect(byName('Monoculture').requirement).toBe('Ship 300 of one crop.')
  })
})
