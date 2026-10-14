import { describe, it, expect, vi } from 'vitest'
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

  it('banner shows the next unchecked dated step, skipping undated ones', async () => {
    renderWithState(<PathView />)
    const banner = () => within(screen.getByRole('region', { name: 'Today status' }))
    const expected = [
      'Spring 1',
      'Spring 1',
      'Spring 2',
      'Spring 7',
      'Spring 7',
      'Spring 13',
      'Spring 13',
      'Spring 24',
      'Opening route',
    ]
    for (let i = 0; i < expected.length; i++) {
      expect(banner().getByText(expected[i], { selector: '.banner-when' })).toBeInTheDocument()
      if (i < sorted.length) {
        await userEvent.click(screen.getByRole('checkbox', { name: sorted[i].title }))
      }
    }
  })

  it('clock and weather controls are disabled', () => {
    renderWithState(<PathView />)
    for (const name of ['Pause', '-10', '+10', 'Resync', 'Sunny', 'Rain']) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }
    expect(screen.getAllByText('coming with the clock').length).toBeGreaterThan(0)
  })
})

describe('PathView aside cards', () => {
  const sorted = [...steps].sort((a, b) => a.order - b.order)
  const meet = sorted.find((s) => s.order === 2)!

  it('aside cards appear in order: Notes for tomorrow, Next goal, Needed this season, Where is everyone', () => {
    renderWithState(<PathView />)
    const names = screen.getAllByRole('heading').map((h) => h.textContent)
    const idx = ['Notes for tomorrow', 'Next goal', 'Needed this season', 'Where is everyone'].map(
      (n) => names.indexOf(n),
    )
    idx.forEach((i) => expect(i).toBeGreaterThanOrEqual(0))
    expect([...idx].sort((a, b) => a - b)).toEqual(idx)
  })

  it('Where is everyone hides after Meet the town is ticked', async () => {
    renderWithState(<PathView />)
    expect(screen.getByRole('heading', { name: 'Where is everyone' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: meet.title }))
    expect(screen.queryByRole('heading', { name: 'Where is everyone' })).not.toBeInTheDocument()
  })

  it('Next goal shows All goals done when steps 9 and 10 are ticked', async () => {
    renderWithState(<PathView />)
    for (const o of [9, 10]) {
      const step = sorted.find((s) => s.order === o)!
      await userEvent.click(screen.getByRole('checkbox', { name: step.title }))
    }
    expect(screen.getByText('All goals done')).toBeInTheDocument()
  })

  it('notes persist across a remount', async () => {
    const { unmount } = renderWithState(<PathView />)
    await userEvent.type(screen.getByLabelText('Notes for tomorrow'), 'buy seeds')
    unmount()
    renderWithState(<PathView />)
    expect(screen.getByLabelText('Notes for tomorrow')).toHaveValue('buy seeds')
  })

  it('a very long unbroken note stays in the textarea', async () => {
    renderWithState(<PathView />)
    const long = 'x'.repeat(300)
    const box = screen.getByLabelText('Notes for tomorrow')
    await userEvent.click(box)
    await userEvent.paste(long)
    expect(box).toHaveValue(long)
  })

  it('Needed this season shows the Joja message on the Joja route', async () => {
    renderWithState(<PathView />)
    await userEvent.selectOptions(screen.getByLabelText('Route'), 'joja')
    expect(screen.getByText('Bundles are not used on the Joja route.')).toBeInTheDocument()
  })

  it('Needed this season respects the season filter', async () => {
    renderWithState(<PathView />)
    const card = () => screen.getByRole('heading', { name: 'Needed this season' }).closest('section')!
    expect(within(card()).getByText(/Wild Horseradish/)).toBeInTheDocument()
    expect(within(card()).getAllByText(/0 of \d+/).length).toBeGreaterThan(0)
    await userEvent.selectOptions(screen.getByLabelText(/Season/), 'winter')
    expect(within(card()).queryByText(/Wild Horseradish/)).not.toBeInTheDocument()
  })

  describe('obtained items', () => {
    it('ticking one Wood in Construction counts exactly one with no duplicate-key warning', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      renderWithState(<PathView />)
      const section = () => screen.getByRole('heading', { name: 'Needed this season' }).closest('section')!
      const head = () => within(section()).getByText('Construction').closest('.needed-head')!
      expect(head()).toHaveTextContent('0 of 4')
      const list = within(section()).getByRole('list', { name: 'Still needed for Construction' })
      await userEvent.click(within(list).getAllByRole('button', { name: /^Wood/ })[0])
      expect(head()).toHaveTextContent('1 of 4')
      expect(err.mock.calls.filter((c) => String(c[0]).includes('same key'))).toHaveLength(0)
      err.mockRestore()
    })

    const card = () => screen.getByRole('heading', { name: 'Needed this season' }).closest('section')!
    const stillNeeded = () => within(card()).queryByRole('list', { name: 'Still needed for Spring Foraging' })

    it('clicking an item name removes it from Still needed and updates the count', async () => {
      renderWithState(<PathView />)
      expect(within(card()).getAllByText('0 of 4').length).toBeGreaterThan(0)
      await userEvent.click(within(stillNeeded()!).getByRole('button', { name: /^Wild Horseradish/ }))
      expect(within(stillNeeded()!).queryByText('Wild Horseradish')).not.toBeInTheDocument()
      expect(within(card()).getByText('1 of 4')).toBeInTheDocument()
    })

    it('a bundle shows Complete once its required slots are obtained', async () => {
      renderWithState(<PathView />)
      for (const name of ['Wild Horseradish', 'Daffodil', 'Leek', 'Dandelion']) {
        await userEvent.click(within(stillNeeded()!).getByRole('button', { name: new RegExp('^' + name) }))
      }
      expect(stillNeeded()).not.toBeInTheDocument()
      expect(within(card()).getByText('4 of 4')).toBeInTheDocument()
      expect(within(card()).getByText('Complete')).toBeInTheDocument()
    })

    it('the progress bar width follows the obtained count', async () => {
      renderWithState(<PathView />)
      const fill = () => card().querySelector('.progress-fill') as HTMLElement
      expect(fill().style.width).toBe('0%')
      await userEvent.click(within(stillNeeded()!).getByRole('button', { name: /^Wild Horseradish/ }))
      expect(fill().style.width).toBe('25%')
    })
  })
})
