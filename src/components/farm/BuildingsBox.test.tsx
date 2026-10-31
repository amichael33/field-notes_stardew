import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import BuildingsBox from './BuildingsBox'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'

vi.mock('../../data/farm-lookup', async (orig) => {
  const b = (id: string, cost: number, upgradesFrom: string | null = null) => ({
    id,
    name: id,
    builder: 'Robin',
    cost,
    materials: [],
    buildDays: 2,
    capacity: 0,
    upgradesFrom,
  })
  return {
    ...(await orig<typeof import('../../data/farm-lookup')>()),
    BUILDINGS: [
      b('Coop', 4000),
      b('Big Coop', 10000, 'Coop'),
      b('Deluxe Coop', 20000, 'Big Coop'),
      b('Well', 1000),
      b('Cabin', 100),
    ],
    UPGRADES: [
      { id: 'house:1', group: 'house', label: 'Kitchen', cost: 10000, materials: [] },
      { id: 'house:2', group: 'house', label: "Children's room", cost: 65000, materials: [] },
    ],
  }
})

function seed(buildings: Record<string, number> = {}, goal: string | null = null) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), farm: { ...defaultFarm(), buildings, goal } }),
  )
}
const savedFarm = () => JSON.parse(localStorage.getItem('field-notes-save')!).farm

describe('BuildingsBox', () => {
  beforeEach(() => localStorage.clear())

  it('shows only the plus tile on an empty farm and lists buildable targets by cost', async () => {
    seed()
    renderWithState(<BuildingsBox />)
    expect(screen.getByRole('heading', { name: 'Buildings' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Build something' }))
    const items = within(screen.getByRole('list', { name: 'Buildings to build' })).getAllByRole('listitem')
    expect(items.map((li) => li.querySelector('.farm-pick-name')?.textContent)).toEqual([
      'Cabin',
      'Well',
      'Coop',
      'Kitchen',
    ])
    expect(within(items[1]).getByText('1,000g')).toBeInTheDocument()
  })

  it('builds a Coop, offers the upgrade, sets and then completes the goal', async () => {
    seed()
    renderWithState(<BuildingsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Build something' }))
    await userEvent.click(screen.getByRole('button', { name: 'Build Coop' }))
    expect(savedFarm().buildings).toEqual({ Coop: 1 })
    const tile = screen.getByRole('button', { name: 'Coop' })
    await userEvent.click(tile)
    const row = screen.getByRole('region', { name: 'Coop actions' })
    await userEvent.click(within(row).getByRole('button', { name: '★ Set Big Coop as goal' }))
    expect(savedFarm().goal).toBe('Big Coop')
    expect(
      within(screen.getByRole('button', { name: 'Coop' })).getByRole('img', { name: 'Goal' }),
    ).toBeInTheDocument()
    await userEvent.click(
      within(screen.getByRole('region', { name: 'Coop actions' })).getByRole('button', {
        name: 'Upgrade to Big Coop',
      }),
    )
    expect(savedFarm().buildings).toEqual({ Coop: 2 })
    expect(savedFarm().goal).toBeNull()
    expect(screen.getByRole('button', { name: 'Big Coop' })).toBeInTheDocument()
  })

  it('removes a level and keeps another goal', async () => {
    seed({ Coop: 2 }, 'house:1')
    renderWithState(<BuildingsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Big Coop' }))
    await userEvent.click(
      within(screen.getByRole('region', { name: 'Big Coop actions' })).getByRole('button', {
        name: 'Remove',
      }),
    )
    expect(savedFarm().buildings).toEqual({ Coop: 1 })
    expect(savedFarm().goal).toBe('house:1')
  })

  it('shows a badge for two cabins and a goal star in the grid', async () => {
    seed({ Cabin: 2 }, 'Well')
    renderWithState(<BuildingsBox />)
    const tile = screen.getByRole('button', { name: 'Cabin, 2 built' })
    expect(within(tile).getByText('2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Build something' }))
    const grid = screen.getByRole('list', { name: 'Buildings to build' })
    expect(within(grid).getAllByRole('img', { name: 'Goal' })).toHaveLength(1)
    await userEvent.click(within(grid).getByRole('button', { name: 'Set Coop as goal' }))
    expect(savedFarm().goal).toBe('Coop')
  })

  it('hides the plus tile, grid and action rows when printing', async () => {
    seed({ Coop: 1 })
    renderWithState(<BuildingsBox />)
    expect(screen.getByRole('button', { name: 'Build something' })).toHaveClass('no-print')
    await userEvent.click(screen.getByRole('button', { name: 'Coop' }))
    expect(screen.getByRole('region', { name: 'Coop actions' })).toHaveClass('no-print')
    await userEvent.click(screen.getByRole('button', { name: 'Build something' }))
    expect(screen.getByRole('list', { name: 'Buildings to build' }).parentElement).toHaveClass('no-print')
  })
})
