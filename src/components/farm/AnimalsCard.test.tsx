import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import AnimalsCard from './AnimalsCard'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'
import type { FarmAnimal } from '../../data/types'

vi.mock('../../data/farm-lookup', async (orig) => {
  const b = (id: string, upgradesFrom: string | null, capacity: number) => ({
    id,
    name: id,
    builder: 'Robin',
    cost: 1000,
    materials: [],
    buildDays: 2,
    capacity,
    upgradesFrom,
  })
  return {
    ...(await orig<typeof import('../../data/farm-lookup')>()),
    BUILDINGS: [
      b('Coop', null, 4),
      b('Big Coop', 'Coop', 8),
      b('Deluxe Coop', 'Big Coop', 12),
      b('Barn', null, 4),
      b('Big Barn', 'Barn', 8),
      b('Deluxe Barn', 'Big Barn', 12),
    ],
    ANIMAL_TYPES: [
      { type: 'White Chicken', house: 'Coop', price: 800, daysToMature: 3 },
      { type: 'Duck', house: 'Coop', price: 1200, daysToMature: 5 },
      { type: 'White Cow', house: 'Barn', price: 1500, daysToMature: 5 },
    ],
  }
})

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)
function seed(buildings: Record<string, number> = { Coop: 1 }, animals: FarmAnimal[] = []) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), farm: { ...defaultFarm(), buildings, animals } }),
  )
}
const hen = (n: number): FarmAnimal => ({ id: `a${n}`, type: 'White Chicken', name: `Hen ${n}`, home: 'Coop' })

describe('AnimalsCard', () => {
  beforeEach(() => localStorage.clear())

  it('offers the Coop as home for a chicken', () => {
    seed()
    renderWithState(<AnimalsCard />)
    const home = screen.getByLabelText('Home')
    expect(home).toBeEnabled()
    expect(screen.getByRole('option', { name: 'Coop' })).toBeInTheDocument()
  })

  it('shows a hint and disables the home for a cow with no Barn', async () => {
    seed()
    renderWithState(<AnimalsCard />)
    await userEvent.selectOptions(screen.getByLabelText('Animal type'), 'White Cow')
    expect(screen.getByLabelText('Home')).toBeDisabled()
    expect(screen.getByText('Build a Barn first')).toBeInTheDocument()
  })

  it('adds an animal and updates the capacity line', async () => {
    seed()
    renderWithState(<AnimalsCard />)
    await userEvent.type(screen.getByLabelText('Animal name'), '  Clucky ')
    await userEvent.click(screen.getByRole('button', { name: 'Add animal' }))
    expect(saved().farm.animals).toMatchObject([{ type: 'White Chicken', name: 'Clucky', home: 'Coop' }])
    expect(screen.getByText('Coop 1 of 4')).toBeInTheDocument()
  })

  it('rejects a blank name', async () => {
    seed()
    renderWithState(<AnimalsCard />)
    await userEvent.type(screen.getByLabelText('Animal name'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Add animal' }))
    expect(saved().farm?.animals ?? []).toEqual([])
  })

  it('warns when over capacity', () => {
    seed({ Coop: 1 }, [1, 2, 3, 4, 5].map(hen))
    renderWithState(<AnimalsCard />)
    expect(screen.getByText('Coop 5 of 4')).toBeInTheDocument()
    expect(screen.getByText('Over capacity')).toBeInTheDocument()
  })

  it('does not warn at exactly full', () => {
    seed({ Coop: 1 }, [1, 2, 3, 4].map(hen))
    renderWithState(<AnimalsCard />)
    expect(screen.queryByText('Over capacity')).not.toBeInTheDocument()
  })

  it('warns when animals live in a house that is not built', () => {
    seed({ Coop: 0 }, [hen(1)])
    renderWithState(<AnimalsCard />)
    expect(screen.getByText('No building')).toBeInTheDocument()
  })

  it('removes an animal', async () => {
    seed({ Coop: 1 }, [hen(1)])
    renderWithState(<AnimalsCard />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Hen 1' }))
    expect(saved().farm.animals).toEqual([])
  })

  it('shows an unknown type', () => {
    seed({ Coop: 1 }, [{ id: 'x', type: 'Dragon', name: 'Smaug', home: 'Coop' }])
    renderWithState(<AnimalsCard />)
    expect(screen.getByText(/Unknown animal/)).toBeInTheDocument()
  })
})
