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
  it('is titled Today and shows the banner copy', () => {
    renderWithState(<PathView />)
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByText(/Live day tracking is coming with the clock/)).toBeInTheDocument()
  })
})

describe('PathView tracking', () => {
  const sorted = [...steps].sort((a, b) => a.order - b.order)
  const rows = () =>
    within(screen.getByRole('list', { name: 'Path steps' })).getAllByRole('listitem')

  it('ticking a row marks it done and moves next-up', async () => {
    renderWithState(<PathView />)
    expect(rows()[0]).toHaveClass('next')
    await userEvent.click(screen.getByRole('checkbox', { name: sorted[0].title }))
    expect(rows()[0]).toHaveClass('done')
    expect(rows()[0]).not.toHaveClass('next')
    expect(rows()[1]).toHaveClass('next')
  })

  it('ribbon shows 0 of 7 on track then 1 of 7 after a tick', async () => {
    renderWithState(<PathView />)
    expect(screen.getByText('0 of 7 on track')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: sorted[0].title }))
    expect(screen.getByText('1 of 7 on track')).toBeInTheDocument()
  })

  it('ticking a ribbon chip ticks the matching path row', async () => {
    renderWithState(<PathView />)
    const chip = screen.getByRole('button', { name: new RegExp(sorted[2].title) })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('checkbox', { name: sorted[2].title })).toBeChecked()
    expect(rows()[2]).toHaveClass('done')
  })

  it('shows 7 of 7 and no next-up row when everything is ticked', async () => {
    renderWithState(<PathView />)
    for (const step of sorted) {
      await userEvent.click(screen.getByRole('checkbox', { name: step.title }))
    }
    expect(screen.getByText('7 of 7 on track')).toBeInTheDocument()
    expect(screen.getByText('Opening route')).toBeInTheDocument()
    rows().forEach((row) => expect(row).not.toHaveClass('next'))
  })

  it('clock and weather controls are disabled', () => {
    renderWithState(<PathView />)
    for (const name of ['Pause', '-10', '+10', 'Resync', 'Sunny', 'Rain']) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }
    expect(screen.getAllByText('coming with the clock').length).toBeGreaterThan(0)
  })
})
