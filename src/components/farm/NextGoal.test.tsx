import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import NextGoal from './NextGoal'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'

vi.mock('../../data/farm-lookup', async (orig) => ({
  ...(await orig<typeof import('../../data/farm-lookup')>()),
  BUILDINGS: [
    {
      id: 'Barn',
      name: 'Barn',
      cost: 6000,
      materials: [
        { item: 'Wood', amount: 350 },
        { item: 'Stone', amount: 150 },
      ],
      builder: 'Robin',
      buildDays: 3,
    },
  ],
  UPGRADES: [],
}))

function seed(goal: string | null, buildings: Record<string, number> = {}) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), farm: { ...defaultFarm(), goal, buildings } }),
  )
}

describe('NextGoal', () => {
  beforeEach(() => localStorage.clear())

  it('shows the goal with cost, builder and materials', () => {
    seed('Barn')
    renderWithState(<NextGoal />)
    expect(screen.getByRole('heading', { name: 'Next goal' })).toBeInTheDocument()
    expect(screen.getByText('Barn')).toBeInTheDocument()
    expect(screen.getByLabelText('6,000g')).toHaveTextContent('6k')
    expect(screen.getByLabelText('6,000g')).toHaveClass('item-icon-only')
    expect(screen.getByText('from Robin, 3 days')).toBeInTheDocument()
    expect(screen.getByLabelText('350 Wood')).toHaveTextContent('350')
    expect(screen.getByLabelText('150 Stone')).toHaveTextContent('150')
    expect(screen.getByLabelText('350 Wood')).toHaveAttribute('title', '350 Wood')
    expect(screen.getByLabelText('350 Wood')).toHaveClass('item-icon-only')
    expect(screen.getByLabelText('350 Wood').parentElement).toHaveClass('icon-grid')
  })

  it('clears the goal', async () => {
    seed('Barn')
    renderWithState(<NextGoal />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear goal' }))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).farm.goal).toBeNull()
  })

  it('shows a hint without a goal', () => {
    seed(null)
    renderWithState(<NextGoal />)
    expect(screen.getByText('Pick a goal with ★ in Buildings.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear goal' })).not.toBeInTheDocument()
  })

  it('shows Unknown goal with a Clear button for a stale id', () => {
    seed('Nope')
    renderWithState(<NextGoal />)
    expect(screen.getByText('Unknown goal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear goal' })).toBeInTheDocument()
  })

  it('shows the pick hint once the goal is already built', () => {
    seed('Barn', { Barn: 1 })
    renderWithState(<NextGoal />)
    expect(screen.getByText('Pick a goal with ★ in Buildings.')).toBeInTheDocument()
    expect(screen.queryByLabelText('6,000g')).not.toBeInTheDocument()
  })

  it('renders the sprite at 96px', () => {
    seed('Barn')
    const { container } = renderWithState(<NextGoal />)
    expect(container.querySelector('.goal-title img')).toHaveAttribute('width', '96')
  })
})
