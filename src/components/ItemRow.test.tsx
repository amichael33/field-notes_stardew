import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithState } from '../test-utils'
import ItemRow from './ItemRow'
import type { Bundle, BundleItem } from '../data/types'

const bundle: Bundle = {
  id: 'b1',
  room: 'Crafts Room',
  name: 'Spring Foraging',
  reward: '30 Spring Seeds',
  slotsRequired: 3,
  items: [],
}
const apple: BundleItem = { name: 'Apple', quantity: 2, seasons: ['fall'], source: 'Apple tree' }
const gold: BundleItem = { name: '5,000g', quantity: 1, seasons: 'any', source: 'Anywhere' }
const mystery: BundleItem = { name: 'Zork Blorp', quantity: 1, seasons: 'any', source: 'Unknown' }

describe('ItemRow', () => {
  it('renders an img for an item with an icon file', () => {
    const { container } = renderWithState(<ItemRow bundle={bundle} item={apple} />)
    const img = container.querySelector('img.item-icon')
    expect(img).toHaveAttribute('src', 'items/apple.png')
  })

  it('renders the gold coin for a gold amount item', () => {
    renderWithState(<ItemRow bundle={bundle} item={gold} />)
    expect(screen.getByRole('img', { name: 'Gold' })).toBeInTheDocument()
  })

  it('renders a text tile for an item missing from the icon map', () => {
    const { container } = renderWithState(<ItemRow bundle={bundle} item={mystery} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.item-tile')).toHaveTextContent('ZB')
  })

  it('falls back to a text tile when the image fails to load', () => {
    const { container } = renderWithState(<ItemRow bundle={bundle} item={apple} />)
    fireEvent.error(container.querySelector('img.item-icon')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.item-tile')).toHaveTextContent('A')
  })

  it('clicking the name toggles obtained and sets aria-pressed', () => {
    const { container } = renderWithState(<ItemRow bundle={bundle} item={apple} />)
    const btn = screen.getByRole('button', { name: /Apple/, pressed: false })
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: /Apple/, pressed: true })).toBeInTheDocument()
    expect(container.querySelector('.item-row')).toHaveClass('obtained')
  })

  it('clicking the icon opens the detail dialog with name, quantity, source, seasons and bundle', () => {
    renderWithState(<ItemRow bundle={bundle} item={apple} showSource />)
    fireEvent.click(screen.getByRole('button', { name: 'Details for Apple' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Apple')
    expect(dialog).toHaveTextContent('2')
    expect(dialog).toHaveTextContent('Apple tree')
    expect(dialog).toHaveTextContent('fall')
    expect(dialog).toHaveTextContent('Spring Foraging')
  })

  it('shows any season for items available year-round', () => {
    renderWithState(<ItemRow bundle={bundle} item={mystery} />)
    fireEvent.click(screen.getByRole('button', { name: 'Details for Zork Blorp' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('any season')
  })

  it('Escape closes the dialog and focus returns to the icon button', () => {
    renderWithState(<ItemRow bundle={bundle} item={apple} />)
    const trigger = screen.getByRole('button', { name: 'Details for Apple' })
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('the Close button closes the dialog', () => {
    renderWithState(<ItemRow bundle={bundle} item={apple} />)
    fireEvent.click(screen.getByRole('button', { name: 'Details for Apple' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
