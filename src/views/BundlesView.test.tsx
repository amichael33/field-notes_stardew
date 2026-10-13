import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'
import BundlesView from './BundlesView'
import type { Bundle } from '../data/types'

const sample: Bundle[] = [
  {
    id: 't',
    room: 'Test Room',
    name: 'Test Bundle',
    reward: 'Thing',
    slotsRequired: 1,
    items: [
      { name: 'Spring Thing', quantity: 1, seasons: ['spring'], source: 'Somewhere' },
      { name: 'Any Thing', quantity: 3, seasons: 'any', source: 'Anywhere' },
    ],
  },
]

describe('BundlesView', () => {
  it('shows joja message on joja route', async () => {
    renderWithState(<BundlesView />)
    await userEvent.selectOptions(screen.getByLabelText(/Route/), 'joja')
    expect(screen.getByText('Bundles are not used on the Joja route.')).toBeInTheDocument()
    expect(screen.queryByText('Spring Foraging')).not.toBeInTheDocument()
  })

  it('shows items for the selected season', async () => {
    renderWithState(<BundlesView />)
    await userEvent.selectOptions(screen.getByLabelText(/Season/), 'winter')
    expect(screen.getByText('Winter Root')).toBeInTheDocument()
    expect(screen.queryByText('Wild Horseradish')).not.toBeInTheDocument()
  })

  it("shows 'any' season items in winter", async () => {
    renderWithState(<BundlesView bundles={sample} />)
    await userEvent.selectOptions(screen.getByLabelText(/Season/), 'winter')
    expect(screen.getByText('Any Thing')).toBeInTheDocument()
    expect(screen.queryByText('Spring Thing')).not.toBeInTheDocument()
  })

  it('shows empty state when nothing matches', () => {
    renderWithState(<BundlesView bundles={[]} />)
    expect(screen.getByText('No bundle items available this season.')).toBeInTheDocument()
  })
})
