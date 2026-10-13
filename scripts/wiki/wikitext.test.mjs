// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { stripWikitext } from './wikitext.mjs'

describe('stripWikitext', () => {
  it('turns links into their display text', () => {
    expect(stripWikitext('[[Fried Calamari]]')).toBe('Fried Calamari')
    expect(stripWikitext('[[Minerals#Gems|Gems]] other than [[Diamond]]')).toBe('Gems other than Diamond')
  })
  it('removes files, bold, italics and html tags', () => {
    expect(stripWikitext("[[File:A.png|48px]]'''All''' ''(except Void Egg)''<br />x")).toBe('All (except Void Egg) x')
  })
  it('unwraps Name and Season templates and drops other templates', () => {
    expect(stripWikitext('{{Name|Spring Seeds|30}}')).toBe('Spring Seeds')
    expect(stripWikitext('{{Season|Spring}} 26')).toBe('Spring 26')
    expect(stripWikitext('a {{Description|Daffodil}} b')).toBe('a b')
  })
  it('decodes common html entities and drops a trailing footnote star', () => {
    expect(stripWikitext('Diamond &amp; Prismatic Shard')).toBe('Diamond & Prismatic Shard')
    expect(stripWikitext("All Eggs ''(except Void Egg)*''")).toBe('All Eggs (except Void Egg)')
  })
})

describe('stripWikitext templates with extra arguments', () => {
  it('reads the name from a Name template that has a link argument and a nested pipe template', () => {
    expect(stripWikitext('{{Name|Jelly|link=Jellies and Pickles{{!}}Jelly}}')).toBe('Jelly')
  })
})

describe('stripWikitext prices and table cells', () => {
  it('writes a Price template as gold', () => {
    expect(stripWikitext('[[The Stardrop Saloon#Menu|Stardrop Saloon]] for {{Price|100}}')).toBe('Stardrop Saloon for 100g')
    expect(stripWikitext('{{Price|2500}}')).toBe('2,500g')
  })
})

describe('cellText', () => {
  it('drops cell attributes, including hyphenated ones', async () => {
    const { cellText } = await import('./tables.mjs')
    expect(cellText('|data-sort-value="no" style="background-color: salmon;"|Exclusive to The Queen of Sauce')).toBe(
      'Exclusive to The Queen of Sauce',
    )
    expect(cellText('| plain [[Link|text]] cell')).toBe('plain [[Link|text]] cell')
  })
})
