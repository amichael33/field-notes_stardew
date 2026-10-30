import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
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

describe('BundlesView obtained items', () => {
  beforeEach(() => localStorage.clear())
  const nameBtn = (name: string) => screen.getByRole('button', { name: new RegExp('^' + name) })

  it('obtained items stay listed and are struck through', async () => {
    renderWithState(<BundlesView bundles={sample} />)
    await userEvent.click(nameBtn('Spring Thing'))
    expect(screen.getByText('Spring Thing')).toBeInTheDocument()
    expect(nameBtn('Spring Thing')).toHaveAttribute('aria-pressed', 'true')
    expect(nameBtn('Spring Thing').closest('.item-row')).toHaveClass('obtained')
  })

  it('clicking an obtained item again un-obtains it', async () => {
    renderWithState(<BundlesView bundles={sample} />)
    await userEvent.click(nameBtn('Spring Thing'))
    await userEvent.click(nameBtn('Spring Thing'))
    expect(nameBtn('Spring Thing')).toHaveAttribute('aria-pressed', 'false')
    expect(nameBtn('Spring Thing').closest('.item-row')).not.toHaveClass('obtained')
  })

  it('an item in two bundles is tracked separately', async () => {
    const two: Bundle[] = ['a', 'b'].map((id) => ({
      id,
      room: 'R',
      name: 'Bundle ' + id,
      reward: 'X',
      slotsRequired: 1,
      items: [{ name: 'Shared Thing', quantity: 1, seasons: 'any', source: 'Here' }],
    }))
    renderWithState(<BundlesView bundles={two} />)
    const cards = screen.getAllByRole('article')
    await userEvent.click(within(cards[0]).getByRole('button', { name: /^Shared Thing/ }))
    // The finished bundle moves to the bottom, so find each card by its heading.
    const card = (name: string) => screen.getByRole('heading', { name: new RegExp(name) }).closest('article')!
    expect(within(card('Bundle a')).getByRole('button', { name: /^Shared Thing/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(card('Bundle b')).getByRole('button', { name: /^Shared Thing/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('ticking the first of two identical items leaves the second unticked', async () => {
    const item = { name: 'Wood', quantity: 1, seasons: 'any' as const, source: 'Here' }
    const dup: Bundle[] = [
      { id: 'd', room: 'R', name: 'Dup', reward: 'X', slotsRequired: 2, items: [{ ...item }, { ...item }] },
    ]
    renderWithState(<BundlesView bundles={dup} />)
    const [first, second] = screen.getAllByRole('button', { name: /^Wood/ })
    await userEvent.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(second).toHaveAttribute('aria-pressed', 'false')
  })

  it('an unknown bundle id in the saved checked list causes no crash and no extra row', async () => {
    const stored = {
      version: 1,
      profile: { route: 'community-center', farmType: 'standard' },
      checked: ['bundle:nope:Ghost'],
      notes: '',
    }
    localStorage.setItem('field-notes-save', JSON.stringify(stored))
    renderWithState(<BundlesView bundles={sample} />)
    expect(screen.getByRole('heading', { name: 'Community Center' })).toBeInTheDocument()
    expect(screen.queryByText(/Ghost/)).not.toBeInTheDocument()
    await userEvent.click(nameBtn('Spring Thing'))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).checked).toContain('bundle:nope:Ghost')
  })
})

describe('BundlesView order', () => {
  beforeEach(() => localStorage.clear())
  const mk = (id: string, room: string): Bundle => ({
    id,
    room,
    name: 'Bundle ' + id,
    reward: 'X',
    slotsRequired: 1,
    items: [{ name: 'Thing ' + id, quantity: 1, seasons: 'any', source: 'Here' }],
  })
  const names = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.split(' ').slice(0, 2).join(' '))

  it('puts unlocked bundles first, locked next, and a finished bundle last', async () => {
    renderWithState(<BundlesView bundles={[mk('a', 'Crafts Room'), mk('b', 'Vault'), mk('c', 'Crafts Room')]} />)
    expect(names()).toEqual(['Bundle a', 'Bundle c', 'Bundle b'])
    await userEvent.click(screen.getByRole('button', { name: /^Thing a/ }))
    // a is finished (moves last); that also unlocks nothing new for the Vault (needs 4)
    expect(names()).toEqual(['Bundle c', 'Bundle b', 'Bundle a'])
  })
})
