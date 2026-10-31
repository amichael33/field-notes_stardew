import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import AnimalsBox from './AnimalsBox'
import BuildingsBox from './BuildingsBox'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'

function seed(buildings: Record<string, number> = {}, animals: Record<string, number> = {}) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), farm: { ...defaultFarm(), buildings, animals } }),
  )
}
const savedFarm = () => JSON.parse(localStorage.getItem('field-notes-save')!).farm

describe('AnimalsBox', () => {
  beforeEach(() => localStorage.clear())

  it('offers chickens but not cows with only a coop, and counts them per type', async () => {
    seed({ Coop: 1 })
    renderWithState(<AnimalsBox />)
    expect(screen.getByRole('heading', { name: 'Animals' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add an animal' }))
    const grid = screen.getByRole('list', { name: 'Animals to add' })
    expect(within(grid).getByRole('button', { name: 'Add White Chicken' })).toBeInTheDocument()
    expect(within(grid).queryByRole('button', { name: 'Add White Cow' })).not.toBeInTheDocument()
    await userEvent.click(within(grid).getByRole('button', { name: 'Add White Chicken' }))
    await userEvent.click(within(grid).getByRole('button', { name: 'Add White Chicken' }))
    expect(savedFarm().animals).toEqual({ 'White Chicken': 2 })
    const tile = screen.getByRole('button', { name: 'White Chicken, 2' })
    expect(within(tile).getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Coop 2 of 4')).toBeInTheDocument()
    expect(screen.queryByText('Over capacity')).not.toBeInTheDocument()
  })

  it('warns when over capacity', () => {
    seed({ Coop: 1 }, { 'White Chicken': 5 })
    renderWithState(<AnimalsBox />)
    expect(screen.getByText('Coop 5 of 4')).toBeInTheDocument()
    expect(screen.getByText('Over capacity')).toBeInTheDocument()
  })

  it('says when animals have no house', () => {
    seed({}, { 'White Chicken': 2 })
    renderWithState(<AnimalsBox />)
    expect(screen.getByText('No coop built')).toBeInTheDocument()
  })

  it('adds and removes one from the action row, deleting the type at zero', async () => {
    seed({ Coop: 1 }, { Duck: 1 })
    renderWithState(<AnimalsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Duck, 1' }))
    const row = screen.getByRole('region', { name: 'Duck actions' })
    await userEvent.click(within(row).getByRole('button', { name: 'Add one Duck' }))
    expect(savedFarm().animals).toEqual({ Duck: 2 })
    await userEvent.click(within(row).getByRole('button', { name: 'Remove one Duck' }))
    await userEvent.click(within(row).getByRole('button', { name: 'Remove one Duck' }))
    expect(savedFarm().animals).toEqual({})
    expect(screen.queryByRole('region', { name: 'Duck actions' })).not.toBeInTheDocument()
  })

  it('caps a type at 99', async () => {
    seed({ Coop: 1 }, { Duck: 99 })
    renderWithState(<AnimalsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Duck, 99' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add one Duck' }))
    expect(savedFarm().animals).toEqual({ Duck: 99 })
  })

  it('shows a hint and disables the plus tile with nothing built', () => {
    seed()
    renderWithState(<AnimalsBox />)
    expect(screen.getByText('Build a coop or barn to add animals.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add an animal' })).toBeDisabled()
  })

  it('hides the plus tile, grid and action rows when printing', async () => {
    seed({ Coop: 1 }, { Duck: 1 })
    renderWithState(<AnimalsBox />)
    expect(screen.getByRole('button', { name: 'Add an animal' })).toHaveClass('no-print')
    await userEvent.click(screen.getByRole('button', { name: 'Duck, 1' }))
    expect(screen.getByRole('region', { name: 'Duck actions' })).toHaveClass('no-print')
    await userEvent.click(screen.getByRole('button', { name: 'Add an animal' }))
    expect(screen.getByRole('list', { name: 'Animals to add' }).parentElement).toHaveClass('no-print')
  })

  it('closes the picker when the last coop is removed', async () => {
    seed({ Coop: 1 })
    renderWithState(
      <>
        <AnimalsBox />
        <BuildingsBox />
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add an animal' }))
    expect(screen.getByRole('list', { name: 'Animals to add' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Coop' }))
    await userEvent.click(
      within(screen.getByRole('region', { name: 'Coop actions' })).getByRole('button', { name: /^Remove/ }),
    )
    expect(screen.queryByRole('list', { name: 'Animals to add' })).not.toBeInTheDocument()
  })

  it('shows an unknown animal type as a tile that can be removed', async () => {
    seed({}, { Dodo: 2 })
    renderWithState(<AnimalsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Dodo, 2' }))
    const row = screen.getByRole('region', { name: 'Dodo actions' })
    await userEvent.click(within(row).getByRole('button', { name: 'Remove one Dodo' }))
    expect(savedFarm().animals).toEqual({ Dodo: 1 })
    await userEvent.click(within(row).getByRole('button', { name: 'Remove one Dodo' }))
    expect(savedFarm().animals).toEqual({})
  })
})
