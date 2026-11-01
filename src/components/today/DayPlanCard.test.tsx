import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import DayPlanCard from './DayPlanCard'
import type { Clock } from '../../data/types'
import { defaultSave, serializeSave } from '../../state/save'

vi.mock('../../data/plans', async (orig) => ({
  ...(await orig<typeof import('../../data/plans')>()),
  PLANS: {
    'community-center': [
      {
        season: 'spring',
        day: 1,
        why: 'Get the farm started.',
        tasks: [
          { id: 's1-parsnips', text: 'Plant parsnips', item: 'Parsnip Seeds', place: 'Farm', time: 540 },
          { id: 's1-lewis', text: 'Meet Lewis' },
        ],
        rainTasks: [{ id: 's1-rain', text: 'Chop wood in the rain' }],
      },
      {
        season: 'spring',
        day: 2,
        why: 'Water and forage.',
        tasks: [
          { id: 's2-cc', text: 'Check the bulletin board', route: 'community-center' },
          { id: 's2-joja', text: 'Sign up at Joja', route: 'joja' },
          { id: 's2-water', text: 'Water crops' },
        ],
      },
      {
        season: 'spring',
        day: 3,
        why: 'Gather for the bundles.',
        tasks: [{ id: 's3-bundle', text: 'Hand in the Spring Foraging bundle' }],
      },
    ],
    money: [],
  },
}))

const base: Clock = { season: 'spring', day: 1, minutes: 540, weather: 'sunny', status: 'paused' }

function seed(
  clock: Clock | null,
  checked: string[] = [],
  route: 'community-center' | 'joja' = 'community-center',
  remixed = false,
) {
  const d = defaultSave()
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...d, clock, checked, profile: { ...d.profile, route, remixed } }),
  )
}

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)

function renderCard() {
  return renderWithState(<DayPlanCard fallback={<p>No plan today.</p>} />)
}

describe('DayPlanCard', () => {
  beforeEach(() => localStorage.clear())

  it('notes that bundle steps follow the standard list only in Remixed mode on a bundle day', () => {
    const note = 'Bundle steps follow the standard list.'
    seed({ ...base, day: 3 }, [], 'community-center', true)
    const { unmount } = renderCard()
    expect(screen.getByText(note)).toBeInTheDocument()
    unmount()
    seed({ ...base, day: 3 })
    const second = renderCard()
    expect(screen.queryByText(note)).not.toBeInTheDocument()
    second.unmount()
    seed({ ...base, day: 2 }, [], 'community-center', true)
    renderCard()
    expect(screen.queryByText(note)).not.toBeInTheDocument()
  })

  it('treats a null clock as Spring 1', () => {
    seed(null)
    renderCard()
    expect(screen.getByRole('heading', { name: 'Day plan' })).toBeInTheDocument()
    expect(screen.getByText('Get the farm started.')).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Day tasks' })
    expect(within(list).getByLabelText('Plant parsnips', { exact: false })).toBeInTheDocument()
    expect(within(list).getByText('Farm', { exact: false }).textContent).toContain('9:00 AM')
    expect(screen.getByText('0/2')).toBeInTheDocument()
    expect(screen.queryByText('Rainy day plan')).not.toBeInTheDocument()
  })

  it('shows rain tasks and the label on a rainy day with a rain variant', () => {
    seed({ ...base, weather: 'rain' })
    renderCard()
    expect(screen.getByText('Rainy day plan')).toBeInTheDocument()
    expect(screen.getByLabelText('Chop wood in the rain', { exact: false })).toBeInTheDocument()
    expect(screen.queryByLabelText('Plant parsnips', { exact: false })).not.toBeInTheDocument()
  })

  it('shows normal tasks and no rain label on rain without a rain variant', () => {
    seed({ ...base, day: 2, weather: 'rain' })
    renderCard()
    expect(screen.queryByText('Rainy day plan')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Water crops', { exact: false })).toBeInTheDocument()
  })

  it('checking a task saves the plan id and updates the counter', async () => {
    seed(base)
    renderCard()
    await userEvent.click(screen.getByLabelText('Meet Lewis', { exact: false }))
    expect(saved().checked).toContain('plan:community-center:s1-lewis')
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('filters tasks by route', () => {
    seed({ ...base, day: 2 })
    const { unmount } = renderCard()
    expect(screen.getByLabelText('Check the bulletin board', { exact: false })).toBeInTheDocument()
    expect(screen.queryByLabelText('Sign up at Joja', { exact: false })).not.toBeInTheDocument()
    unmount()
    seed({ ...base, day: 2 }, [], 'joja')
    renderCard()
    expect(screen.getByLabelText('Sign up at Joja', { exact: false })).toBeInTheDocument()
    expect(screen.queryByLabelText('Check the bulletin board', { exact: false })).not.toBeInTheDocument()
  })

  it('renders the fallback when the day has no plan', () => {
    seed({ ...base, season: 'summer' })
    renderCard()
    expect(screen.getByText('No plan today.')).toBeInTheDocument()
    expect(screen.queryByText('Day plan')).not.toBeInTheDocument()
  })

  it('shows Year 1 complete when winter 28 has ended', () => {
    seed({ ...base, season: 'winter', day: 28, status: 'ended' })
    renderCard()
    expect(screen.getByText('Year 1 complete')).toBeInTheDocument()
    expect(screen.queryByText('No plan today.')).not.toBeInTheDocument()
  })

  it('carries missed tasks over, open, of missed tasks that shrinks as they are checked', async () => {
    seed({ ...base, day: 2 })
    renderCard()
    const summary = screen.getByText('Carried over from earlier days (2)')
    const details = summary.closest('details')!
    expect(details).toHaveAttribute('open')
    expect(within(details).getByRole('heading', { name: 'Spring 1' })).toBeInTheDocument()
    await userEvent.click(within(details).getByLabelText('Meet Lewis', { exact: false }))
    expect(screen.getByText('Carried over from earlier days (1)')).toBeInTheDocument()
    expect(saved().checked).toContain('plan:community-center:s1-lewis')
  })

  it('shows no catch-up on the first day', () => {
    seed(base)
    renderCard()
    expect(screen.queryByText(/Carried over/)).not.toBeInTheDocument()
  })

  it('keeps community-center ids when switching to the money goal', async () => {
    seed(base, ['plan:community-center:s1-lewis'])
    renderCard()
    await userEvent.selectOptions(screen.getByLabelText('Plan goal'), 'money')
    expect(saved().profile.planGoal).toBe('money')
    expect(saved().checked).toContain('plan:community-center:s1-lewis')
  })
})

describe('DayPlanCard order', () => {
  beforeEach(() => localStorage.clear())

  it('moves a ticked task to the bottom and back when unticked', async () => {
    seed(base)
    renderCard()
    const names = () =>
      within(screen.getByRole('list', { name: 'Day tasks' }))
        .getAllByRole('checkbox')
        .map((c) => c.closest('label')!.querySelector('strong')!.textContent)
    expect(names()).toEqual(['Plant parsnips', 'Meet Lewis'])
    await userEvent.click(screen.getByRole('checkbox', { name: /Plant parsnips/ }))
    expect(names()).toEqual(['Meet Lewis', 'Plant parsnips'])
    await userEvent.click(screen.getByRole('checkbox', { name: /Plant parsnips/ }))
    expect(names()).toEqual(['Plant parsnips', 'Meet Lewis'])
  })
})
