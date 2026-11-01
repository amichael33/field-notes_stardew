import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'
import BundlesView from './BundlesView'
import type { Bundle } from '../data/types'
import { defaultSave, serializeSave } from '../state/save'

vi.mock('../data/remixed-bundles.json', () => {
  const b = (id: string, room: string) => ({
    id,
    room,
    name: 'Name ' + id,
    reward: 'Reward ' + id,
    slotsRequired: 1,
    items: [{ name: 'Thing ' + id, quantity: 1, seasons: 'any', source: 'Here' }],
  })
  return {
    default: [
      {
        room: 'Crafts Room',
        slots: [{ id: 'crafts', kind: 'fixed', pick: 1, bundles: [b('remix-fixed', 'Crafts Room')] }],
      },
      {
        room: 'Pantry',
        slots: [
          {
            id: 'pantry',
            kind: 'alternatives',
            pick: 1,
            bundles: ['remix-b1', 'remix-b2', 'remix-b3'].map((id) => b(id, 'Pantry')),
          },
        ],
      },
      {
        room: 'Boiler Room',
        slots: [
          {
            id: 'boiler',
            kind: 'pool',
            pick: 3,
            bundles: ['remix-p1', 'remix-p2', 'remix-p3', 'remix-p4', 'remix-p5'].map((id) =>
              b(id, 'Boiler Room'),
            ),
          },
        ],
      },
    ],
  }
})

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
    expect(screen.getByText(/Bundles are not used on the Joja route/)).toBeInTheDocument()
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
    expect(within(card('Bundle a')).getByRole('button', { name: /^Shared Thing/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(card('Bundle b')).getByRole('button', { name: /^Shared Thing/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
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
  const names = () =>
    screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.split(' ').slice(0, 2).join(' '))

  it('puts unlocked bundles first, locked next, and a finished bundle last', async () => {
    renderWithState(
      <BundlesView bundles={[mk('a', 'Crafts Room'), mk('b', 'Vault'), mk('c', 'Crafts Room')]} />,
    )
    expect(names()).toEqual(['Bundle a', 'Bundle c', 'Bundle b'])
    await userEvent.click(screen.getByRole('button', { name: /^Thing a/ }))
    // a is finished (moves last); that also unlocks nothing new for the Vault (needs 4)
    expect(names()).toEqual(['Bundle c', 'Bundle b', 'Bundle a'])
  })
})

describe('BundlesView remixed mode', () => {
  const seed = (patch: object = {}) => {
    const base = defaultSave()
    localStorage.setItem(
      'field-notes-save',
      serializeSave({ ...base, profile: { ...base.profile, remixed: true }, ...patch }),
    )
  }
  const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)
  const heads = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent ?? '')
  beforeEach(() => localStorage.clear())

  it('shows the switch with Standard pressed and standard cards by default', () => {
    renderWithState(<BundlesView />)
    expect(screen.getByRole('button', { name: 'Standard' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: /^Spring Foraging/ })).toBeInTheDocument()
  })

  it('clicking Remixed saves the mode and the standard cards disappear', async () => {
    renderWithState(<BundlesView />)
    await userEvent.click(screen.getByRole('button', { name: 'Remixed' }))
    expect(saved().profile.remixed).toBe(true)
    expect(screen.queryByRole('heading', { name: /^Spring Foraging/ })).not.toBeInTheDocument()
  })

  it('shows the fixed bundle at once and an alternatives picker with three candidates', () => {
    seed()
    renderWithState(<BundlesView />)
    expect(heads().some((h) => h.startsWith('Name remix-fixed'))).toBe(true)
    expect(screen.getByRole('heading', { name: 'Pantry: Name remix-b1 or Name remix-b2 or Name remix-b3' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Name remix-b/ })).toHaveLength(3)
  })

  it('picking a bundle saves it and replaces the picker with its card; Change reopens', async () => {
    seed()
    renderWithState(<BundlesView />)
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-b2/ }))
    expect(saved().remix.picks).toEqual({ pantry: ['remix-b2'] })
    expect(screen.queryByRole('button', { name: /^Name remix-b1/ })).not.toBeInTheDocument()
    expect(heads().some((h) => h.startsWith('Name remix-b2'))).toBe(true)
    await userEvent.click(screen.getAllByRole('button', { name: 'Change' })[0])
    expect(screen.getByRole('button', { name: /^Name remix-b1/ })).toBeInTheDocument()
  })

  it('a pool refuses a fourth pick and keeps counting 3 of 3', async () => {
    seed({ remix: { picks: { boiler: ['remix-p1', 'remix-p2'] } } })
    renderWithState(<BundlesView />)
    expect(screen.getByText(/2 of 3 picked/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-p3/ }))
    expect(screen.getByText(/Picked: Name remix-p1, Name remix-p2, Name remix-p3/)).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Change' })[0])
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-p4/ }))
    expect(saved().remix.picks.boiler).toEqual(['remix-p1', 'remix-p2', 'remix-p3'])
    expect(screen.getByText(/3 of 3 picked/)).toBeInTheDocument()
  })

  it('obtained ticks stay with their own mode and never show on the other mode cards', async () => {
    renderWithState(<BundlesView />)
    const horseradish = () => screen.getAllByRole('button', { name: /^Wild Horseradish/ })[0]
    await userEvent.click(horseradish())
    expect(saved().checked).toContain('bundle:spring-foraging:Wild Horseradish')
    await userEvent.click(screen.getByRole('button', { name: 'Remixed' }))
    await userEvent.click(screen.getByRole('button', { name: /^Thing remix-fixed/ }))
    expect(saved().checked).toContain('bundle:remix-fixed:Thing remix-fixed')
    expect(screen.queryByRole('button', { name: /^Wild Horseradish/ })).not.toBeInTheDocument()
    expect(document.querySelectorAll('.obtained')).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Standard' }))
    expect(screen.queryByRole('button', { name: /^Thing remix-fixed/ })).not.toBeInTheDocument()
    expect(horseradish()).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelectorAll('.obtained')).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Remixed' }))
    expect(screen.getByRole('button', { name: /^Thing remix-fixed/ })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelectorAll('.obtained')).toHaveLength(1)
  })

  it('picks survive a Remixed -> Standard -> Remixed round trip', async () => {
    const picks = { pantry: ['remix-b2'], boiler: ['remix-p1', 'remix-p2'] }
    seed({ remix: { picks } })
    renderWithState(<BundlesView />)
    expect(heads().some((h) => h.startsWith('Name remix-b2'))).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Standard' }))
    expect(heads().some((h) => h.startsWith('Name remix-b2'))).toBe(false)
    expect(saved().remix.picks).toEqual(picks)
    await userEvent.click(screen.getByRole('button', { name: 'Remixed' }))
    expect(saved().remix.picks).toEqual(picks)
    expect(heads().some((h) => h.startsWith('Name remix-b2'))).toBe(true)
    expect(heads().some((h) => h.startsWith('Name remix-p1'))).toBe(true)
  })

  it('a room lock counts only chosen remixed bundles', async () => {
    seed({ remix: { picks: { pantry: ['remix-b2'] } } })
    renderWithState(<BundlesView />)
    // The Pantry needs 1 complete bundle. Complete the picked b2 and the lock text goes away.
    expect(screen.getByText(/You have 0 of 1\./)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Thing remix-b2/ }))
    expect(screen.queryByText(/You have \d of 1\./)).not.toBeInTheDocument()
    // Swap the pick to b1: the completed but unpicked b2 must no longer count.
    await userEvent.click(screen.getAllByRole('button', { name: 'Change' })[0])
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-b1/ }))
    expect(screen.getByText(/You have 0 of 1\./)).toBeInTheDocument()
    // Picking the completed bundle again brings the count back.
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-b2/ }))
    expect(screen.queryByText(/You have \d of 1\./)).not.toBeInTheDocument()
  })

  it('the Joja route shows only its message, no switch', () => {
    seed({ profile: { ...defaultSave().profile, remixed: true, route: 'joja' } })
    renderWithState(<BundlesView />)
    expect(screen.getByText(/Bundles are not used on the Joja route/)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Bundle mode' })).not.toBeInTheDocument()
  })
})
