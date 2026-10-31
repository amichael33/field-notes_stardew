import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import CropsBox from './CropsBox'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'
import type { Clock, PlantedCrop } from '../../data/types'

vi.mock('../../data/farm-lookup', async (orig) => {
  const crops = [
    { id: 'parsnip', name: 'Parsnip', seeds: 'Parsnip Seeds', seasons: ['spring'], daysToGrow: 4, regrowDays: null },
    { id: 'bean', name: 'Green Bean', seeds: 'Bean Starter', seasons: ['spring'], daysToGrow: 10, regrowDays: 3 },
    { id: 'melon', name: 'Melon', seeds: 'Melon Seeds', seasons: ['summer'], daysToGrow: 12, regrowDays: null },
  ]
  return {
    ...(await orig<typeof import('../../data/farm-lookup')>()),
    CROPS: crops,
    cropById: (id: string) => crops.find((c) => c.id === id),
  }
})

const clock = (season: Clock['season'], day: number): Clock => ({ season, day, minutes: 540, weather: 'sunny', status: 'paused' })
function seed(c: Clock | null, crops: PlantedCrop[] = []) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), clock: c, farm: { ...defaultFarm(), crops } }),
  )
}
const savedCrops = () => JSON.parse(localStorage.getItem('field-notes-save')!).farm.crops as PlantedCrop[]
const plant = (id: string, crop: string, day: number, count = 3): PlantedCrop => ({ id, crop, count, season: 'spring', day })

describe('CropsBox', () => {
  beforeEach(() => localStorage.clear())

  it('plants a crop on the clock date', async () => {
    seed(clock('spring', 12))
    renderWithState(<CropsBox />)
    expect(screen.getByRole('heading', { name: 'Crops planted' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Plant a crop' }))
    const grid = screen.getByRole('list', { name: 'Crops to plant' })
    await userEvent.click(within(grid).getByRole('button', { name: /^Parsnip/ }))
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    await userEvent.click(screen.getByRole('button', { name: 'Plant' }))
    const saved = savedCrops()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ crop: 'parsnip', count: 3, season: 'spring', day: 12 })
    expect(screen.queryByRole('list', { name: 'Crops to plant' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Parsnip, 3 planted' })).toBeInTheDocument()
  })

  it('plants on Spring 1 without a clock', async () => {
    seed(null)
    renderWithState(<CropsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Plant a crop' }))
    await userEvent.click(screen.getByRole('button', { name: /^Parsnip/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Plant' }))
    expect(savedCrops()[0]).toMatchObject({ crop: 'parsnip', count: 1, season: 'spring', day: 1 })
  })

  it('shows the action row with the ready date and no Harvested', async () => {
    seed(clock('spring', 1), [plant('a', 'parsnip', 1)])
    renderWithState(<CropsBox />)
    const tile = screen.getByRole('button', { name: 'Parsnip, 3 planted' })
    expect(within(tile).getByText('3')).toBeInTheDocument()
    await userEvent.click(tile)
    const row = screen.getByRole('region', { name: 'Parsnip actions' })
    expect(within(row).getByText('Ready Spring 5 (in 4 days)')).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: /^Harvest/ })).not.toBeInTheDocument()
  })

  it('removes a crop', async () => {
    seed(clock('spring', 1), [plant('a', 'parsnip', 1)])
    renderWithState(<CropsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Parsnip, 3 planted' }))
    await userEvent.click(within(screen.getByRole('region', { name: 'Parsnip actions' })).getByRole('button', { name: 'Remove' }))
    expect(savedCrops()).toEqual([])
  })

  it('harvests a ready regrowing crop and keeps the tile', async () => {
    seed(clock('spring', 12), [plant('b', 'bean', 1)])
    renderWithState(<CropsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Green Bean, 3 planted' }))
    const row = screen.getByRole('region', { name: 'Green Bean actions' })
    expect(within(row).getByText('Ready now')).toBeInTheDocument()
    await userEvent.click(within(row).getByRole('button', { name: 'Harvest Green Bean' }))
    expect(savedCrops()[0].lastHarvest).toEqual({ season: 'spring', day: 12 })
    expect(screen.getByRole('button', { name: 'Green Bean, 3 planted' })).toBeInTheDocument()
  })

  it('lists summer crops in the grid when the clock is in summer', async () => {
    seed(clock('summer', 3))
    renderWithState(<CropsBox />)
    await userEvent.click(screen.getByRole('button', { name: 'Plant a crop' }))
    const grid = screen.getByRole('list', { name: 'Crops to plant' })
    expect(within(grid).getByRole('button', { name: /^Melon/ })).toBeInTheDocument()
    expect(within(grid).queryByRole('button', { name: /^Parsnip/ })).not.toBeInTheDocument()
  })
})
