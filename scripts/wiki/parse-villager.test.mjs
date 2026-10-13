// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseVillager } from './parse-villager.mjs'

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}.wikitext`, import.meta.url), 'utf8')

describe('parseVillager', () => {
  it('reads the birthday from the infobox', () => {
    const v = parseVillager('Pierre', fixture('Pierre'))
    expect(v.name).toBe('Pierre')
    expect(v.birthday).toEqual({ season: 'spring', day: 26 })
  })

  it('reads loves from table rows, the universal bullet and italic special gifts', () => {
    const v = parseVillager('Pierre', fixture('Pierre'))
    expect([...v.loves].sort()).toEqual(['All Universal Loves', 'Fried Calamari', 'Price Catalogue', 'Stardrop Tea'])
  })

  it('keeps the exception notes on universal likes', () => {
    const v = parseVillager('Pierre', fixture('Pierre'))
    expect(v.likes).toContain(
      'All Universal Likes (except Corn, Garlic, Foraged Minerals, Gems other than Diamond & Prismatic Shard, Parsnip Soup, & Tortilla)',
    )
    expect(v.likes).toContain('All Eggs (except Void Egg)')
    expect(v.likes).toContain('All Milk')
    expect(v.likes).toContain('Daffodil')
  })

  it('reads a villager whose special gift is a category, not an item', () => {
    const v = parseVillager('Linus', fixture('Linus'))
    expect(v.birthday).toEqual({ season: 'winter', day: 3 })
    expect(v.loves).toContain('The Alleyway Buffet')
    expect(v.loves).toContain('Dish O\' The Sea')
    expect(v.likes).toContain('Most Edible Foraged Items (except Flowers, Fruit, Seaweed, or Vegetables)')
  })

  it('does not include dislikes or hates in loves and likes', () => {
    const v = parseVillager('Linus', fixture('Linus'))
    expect(v.loves).not.toContain('Hazelnut')
  })

  it('has no duplicate entries', () => {
    const v = parseVillager('Pierre', fixture('Pierre'))
    expect(new Set(v.loves).size).toBe(v.loves.length)
    expect(new Set(v.likes).size).toBe(v.likes.length)
  })

  it('throws when the page has no birthday', () => {
    expect(() => parseVillager('Nobody', '==Gifts==\n===Love===\n')).toThrow(/birthday/i)
  })
})

describe('parseVillager page layouts seen on the wiki', () => {
  const page = (birthday, likeBody) =>
    `{{Infobox villager\n|birthday  = ${birthday}\n}}\n==Gifts==\n===Love===\n===Like===\n${likeBody}\n===Neutral===\n`

  it('reads a birthday written as {{Season|Fall|13}}', () => {
    expect(parseVillager('Abigail', page('{{Season|Fall|13}}', '')).birthday).toEqual({ season: 'fall', day: 13 })
  })

  it('keeps a nested bullet list inside its parent entry, even when the HTML is not closed properly', () => {
    const leah =
      '{|class="wikitable"\n|-\n| [[File:Leah Happy.png|48px|center]]\n|colspan="3"|<ul><li><strong>All [[Friendship#Universal Likes|Universal Likes]]</strong> <em>(except:<ul><li><strong>[[Minerals#Foraged Minerals|Foraged Minerals]]</strong> other than [[Earth Crystal]]</li><li>[[Carp Surprise]], &amp; [[Tortilla]])</li></ul></em><li><strong>All Eggs</strong> <em>(except [[Void Egg]])*</em></li></ul>\n|}'
    expect(parseVillager('Leah', page('{{Season|Winter}} 23', leah)).likes).toEqual([
      'All Universal Likes (except: Foraged Minerals other than Earth Crystal, Carp Surprise, & Tortilla)',
      'All Eggs (except Void Egg)',
    ])
  })

  it('does not turn a grouped italic reaction line into a single item', () => {
    const body = "''Escargot, Fish Taco, or Tropical Curry''\n{{Squote|Yum}}\n{|class=\"wikitable\"\n|-\n|[[File:Escargot.png|center]]\n|[[Escargot]]\n|}"
    expect(parseVillager('Gus', page('{{Season|Summer}} 8', body)).likes).toEqual(['Escargot'])
  })

  it('keeps a lone italic special gift and one with commas inside parentheses', () => {
    const body = "''Stardrop Tea''\n''Most Edible Foraged Items (except Flowers, Fruit, or Vegetables)''"
    expect(parseVillager('Linus', page('{{Season|Winter}} 3', body)).likes).toEqual([
      'Stardrop Tea',
      'Most Edible Foraged Items (except Flowers, Fruit, or Vegetables)',
    ])
  })
})
