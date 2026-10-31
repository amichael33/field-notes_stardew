import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithState } from '../test-utils'
import FarmView from './FarmView'

describe('FarmView', () => {
  it('shows the Farm heading', () => {
    renderWithState(<FarmView />)
    expect(screen.getByRole('heading', { name: 'Farm' })).toBeInTheDocument()
  })

  it('puts Ready today in the main column', () => {
    const { container } = renderWithState(<FarmView />)
    const main = container.querySelector('.farm-main') as HTMLElement
    expect(within(main).getByRole('heading', { name: 'Ready today' })).toBeInTheDocument()
    expect(container.querySelector('.farm-side')).not.toBeNull()
  })
})
