import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FarmSprite from './FarmSprite'

describe('FarmSprite', () => {
  it('renders the mapped image for a known building', () => {
    const { container } = render(<FarmSprite kind="building" id="Big Coop" />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('farm/buildings/Big Coop.png')
    expect(img?.getAttribute('alt')).toBe('')
  })

  it('renders the mapped image for a known animal', () => {
    const { container } = render(<FarmSprite kind="animal" id="White Cow" />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe('farm/animals/White Cow.png')
  })

  it('fills a 48px square by default', () => {
    const { container } = render(<FarmSprite kind="animal" id="White Chicken" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('width', '48')
    expect(img).toHaveAttribute('height', '48')
  })

  it('uses the label for the fallback initials', () => {
    const { container } = render(<FarmSprite kind="building" id="house:2" label="Children's room" />)
    expect(container.querySelector('.item-tile')?.textContent).toBe('CR')
  })

  it('renders a lettered tile for an unknown id', () => {
    const { container } = render(<FarmSprite kind="building" id="Mystery Hut" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.item-tile')?.textContent).toBe('MH')
    expect(screen.queryByRole('img')).toBeNull()
  })
})
