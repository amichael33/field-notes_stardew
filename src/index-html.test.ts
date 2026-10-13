import { describe, it, expect } from 'vitest'
import html from '../index.html?raw'

describe('index.html', () => {
  it('is titled Field Notes', () => {
    expect(html).toContain('<title>Field Notes</title>')
  })
  it('does not reference the removed vite.svg favicon', () => {
    expect(html).not.toContain('vite.svg')
  })
})
