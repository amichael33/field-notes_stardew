import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithState } from '../test-utils'
import FarmView from './FarmView'

describe('FarmView', () => {
  it('shows the Farm heading', () => {
    renderWithState(<FarmView />)
    expect(screen.getByRole('heading', { name: 'Farm' })).toBeInTheDocument()
  })
})
