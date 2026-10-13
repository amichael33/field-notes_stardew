import { describe, it, expect } from 'vitest'
import css from './styles.css?raw'
import html from '../index.html?raw'

describe('heading font', () => {
  it('loads the bundled Fisherman font with @font-face', () => {
    expect(css).toMatch(/@font-face\s*{[^}]*font-family:\s*'Fisherman'[^}]*Fisherman-Regular\.otf/s)
  })
  it('uses Fisherman as the display font for headings', () => {
    expect(css).toMatch(/--font-display:\s*'Fisherman'/)
    expect(css).toMatch(/h1,\s*h2,\s*h3\s*{[^}]*var\(--font-display\)/s)
  })
  it('no longer requests Pixelify Sans from Google Fonts', () => {
    expect(html).not.toContain('Pixelify')
  })
})
