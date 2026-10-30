import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import BuildingsCard from './BuildingsCard'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'

vi.mock('../../data/farm-lookup', async (orig) => {
  const b = (id: string, cost: number, upgradesFrom: string | null, materials: { item: string; amount: number }[]) => ({
    id,
    name: id,
    builder: 'Robin',
    cost,
    materials,
    buildDays: 2,
    capacity: null,
    upgradesFrom,
  })
  return {
    ...(await orig<typeof import('../../data/farm-lookup')>()),
    BUILDINGS: [
      b('Coop', 4000, null, [{ item: 'Wood', amount: 300 }]),
      b('Big Coop', 10000, 'Coop', [{ item: 'Wood', amount: 400 }]),
      b('Deluxe Coop', 20000, 'Big Coop', [{ item: 'Wood', amount: 500 }]),
      b('Well', 1000, null, [{ item: 'Stone', amount: 75 }]),
      b('Cabin', 100, null, []),
    ],
    UPGRADES: [
      { id: 'house:1', group: 'house', label: 'Kitchen', cost: 10000, materials: [] },
      { id: 'house:2', group: 'house', label: "Children's room", cost: 65000, materials: [] },
      { id: 'house:3', group: 'house', label: 'Cellar', cost: 100000, materials: [] },
      { id: 'tool:1', group: 'tool', label: 'Copper Axe', cost: 2000, materials: [] },
    ],
  }
})

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)
function seed(buildings: Record<string, number> = {}) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), farm: { ...defaultFarm(), buildings } }),
  )
}
const row = (name: string) => screen.getByLabelText(name).closest('li')!

describe('BuildingsCard', () => {
  beforeEach(() => localStorage.clear())

  it('saves the chosen level of a chain', async () => {
    seed()
    renderWithState(<BuildingsCard />)
    await userEvent.selectOptions(screen.getByLabelText('Coop level'), 'Big Coop')
    expect(saved().farm.buildings.Coop).toBe(2)
  })

  it('shows the next level cost for a built chain', () => {
    seed({ Coop: 2 })
    renderWithState(<BuildingsCard />)
    expect(screen.getByText(/Deluxe Coop, 20,000g/)).toBeInTheDocument()
  })

  it('ticks a single building', async () => {
    seed()
    renderWithState(<BuildingsCard />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Well' }))
    expect(saved().farm.buildings.Well).toBe(1)
  })

  it('steps a counted building up and never below zero', async () => {
    seed()
    renderWithState(<BuildingsCard />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Cabin' }))
    expect(saved().farm.buildings.Cabin ?? 0).toBe(0)
    await userEvent.click(screen.getByRole('button', { name: 'Add Cabin' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add Cabin' }))
    expect(saved().farm.buildings.Cabin).toBe(2)
  })

  it('needs house upgrades in order, and unticking one clears the later ones', async () => {
    seed()
    renderWithState(<BuildingsCard />)
    const second = screen.getByRole('checkbox', { name: "Children's room" })
    expect(second).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Kitchen' }))
    expect(second).toBeEnabled()
    await userEvent.click(second)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cellar' }))
    expect(saved().farm.buildings).toMatchObject({ 'house:1': 1, 'house:2': 1, 'house:3': 1 })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Kitchen' }))
    expect(saved().farm.buildings).toMatchObject({ 'house:1': 0, 'house:2': 0, 'house:3': 0 })
  })

  it('marks the first unbuilt row as next', () => {
    seed({ Coop: 3 })
    renderWithState(<BuildingsCard />)
    expect(row('Well')).toHaveClass('next')
    expect(row('Coop level')).not.toHaveClass('next')
    expect(row('Cabin')).not.toHaveClass('next')
  })

  it('lists an unknown saved id and removes it', async () => {
    seed({ Mystery: 3 })
    renderWithState(<BuildingsCard />)
    expect(screen.getByText(/Unknown building/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(saved().farm.buildings.Mystery).toBeUndefined()
  })
})
