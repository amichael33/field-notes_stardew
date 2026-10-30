import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import ProgressCard from './ProgressCard'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'

vi.mock('../../data/farm-lookup', async (orig) => {
  const tool = (n: number, name: string, cost: number) => ({
    id: `tool:Axe:${n}`,
    group: 'tool',
    label: `${name} Axe`,
    cost,
    materials: [{ item: `${name} Bar`, amount: 5 }],
  })
  return {
    ...(await orig<typeof import('../../data/farm-lookup')>()),
    BUILDINGS: [],
    UPGRADES: [
      tool(1, 'Copper', 2000),
      tool(2, 'Steel', 5000),
      tool(3, 'Gold', 10000),
      tool(4, 'Iridium', 25000),
      { id: 'backpack:1', group: 'backpack', label: 'Large Pack', cost: 2000, materials: [] },
    ],
  }
})

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)
function seed(farm: Partial<ReturnType<typeof defaultFarm>> = {}) {
  localStorage.setItem('field-notes-save', serializeSave({ ...defaultSave(), farm: { ...defaultFarm(), ...farm } }))
}

describe('ProgressCard', () => {
  beforeEach(() => localStorage.clear())

  it('saves the chosen tool level and shows the next cost', async () => {
    seed()
    renderWithState(<ProgressCard />)
    await userEvent.selectOptions(screen.getByLabelText('Axe level'), 'Copper')
    expect(saved().farm.tools.Axe).toBe(1)
    expect(screen.getByText(/Steel Axe, 5,000g/)).toBeInTheDocument()
  })

  it('says fully upgraded at Iridium', () => {
    seed({ tools: { ...defaultFarm().tools, Axe: 4 } })
    renderWithState(<ProgressCard />)
    expect(screen.getByText('Fully upgraded')).toBeInTheDocument()
  })

  it('clamps skill levels to 0-10', async () => {
    seed()
    renderWithState(<ProgressCard />)
    const input = screen.getByLabelText('Farming level')
    await userEvent.clear(input)
    await userEvent.type(input, '11')
    expect(saved().farm.skills.Farming).toBe(10)
    fireEvent.change(input, { target: { value: '-3' } })
    expect(saved().farm.skills.Farming).toBe(0)
  })

  it('saves gold as an integer and an empty box as 0', async () => {
    seed({ gold: 50 })
    renderWithState(<ProgressCard />)
    const input = screen.getByLabelText('Gold')
    await userEvent.clear(input)
    expect(saved().farm.gold).toBe(0)
    await userEvent.type(input, '12.7')
    expect(Number.isInteger(saved().farm.gold)).toBe(true)
    expect(saved().farm.gold).toBeGreaterThanOrEqual(0)
  })

  it('shows progress toward the saving goal', async () => {
    seed({ gold: 1000 })
    renderWithState(<ProgressCard />)
    await userEvent.selectOptions(screen.getByLabelText('Saving for'), 'Large Pack')
    expect(saved().farm.saving).toBe('backpack:1')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByText('1,000g of 2,000g')).toBeInTheDocument()
  })

  it('hides the bar when saving for Nothing', async () => {
    seed({ gold: 1000, saving: 'backpack:1' })
    renderWithState(<ProgressCard />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Saving for'), 'Nothing')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(saved().farm.saving).toBeNull()
  })

  it('shows nothing selected for an unknown saved goal', () => {
    seed({ saving: 'bogus' })
    renderWithState(<ProgressCard />)
    expect(screen.getByLabelText('Saving for')).toHaveValue('')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
