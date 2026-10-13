import { describe, it, expect } from 'vitest'
import html from '../index.html?raw'

describe('index.html', () => {
  it('has the site title, not the Vite template title', () => {
    expect(html).toContain('<title>Stardew Field Notes</title>')
  })
  it('does not reference the removed vite.svg favicon', () => {
    expect(html).not.toContain('vite.svg')
  })
})
