import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'
import PathView from './PathView'
import steps from '../data/path-steps.json'

describe('PathView', () => {
  it('renders steps in order', () => {
    renderWithState(<PathView />)
    const items = within(screen.getByRole('list', { name: 'Path steps' })).getAllByRole('listitem')
    const sorted = [...steps].sort((a, b) => a.order - b.order)
    expect(items).toHaveLength(sorted.length)
    expect(items[0]).toHaveTextContent(sorted[0].title)
    expect(items[items.length - 1]).toHaveTextContent(sorted[sorted.length - 1].title)
  })

  it('labels rainy day steps', () => {
    renderWithState(<PathView />)
    const rainy = steps.find((s) => 'rainy' in s && s.rainy)!
    const item = screen.getByText(rainy.title).closest('li')!
    expect(within(item).getByText('Rainy day')).toBeInTheDocument()
  })

  it('recipes section respects the season filter', async () => {
    renderWithState(<PathView />)
    expect(screen.getByText('Stir Fry')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText(/Season/), 'winter')
    expect(screen.queryByText('Stir Fry')).not.toBeInTheDocument()
    expect(screen.getByText('Plum Pudding')).toBeInTheDocument()
  })
})

describe('PathView heading', () => {
  it('is titled Today and says live day tracking is not built yet', () => {
    renderWithState(<PathView />)
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByText(/Live day tracking comes later/)).toBeInTheDocument()
  })
})
