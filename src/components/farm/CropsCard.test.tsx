import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import CropsCard from './CropsCard'
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

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)
const clock = (season: Clock['season'], day: number): Clock => ({
  season,
  day,
  minutes: 540,
  weather: 'sunny',
  status: 'paused',
})
function seed(c: Clock | null, crops: PlantedCrop[] = []) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), clock: c, farm: { ...defaultFarm(), crops } }),
  )
}
const optionNames = () => within(screen.getByLabelText('Crop')).getAllByRole('option').map((o) => o.textContent)

describe('CropsCard', () => {
  beforeEach(() => localStorage.clear())

  it('adds a crop planted on the clock date and shows when it is ready', async () => {
    seed(clock('spring', 1))
    renderWithState(<CropsCard />)
    await userEvent.selectOptions(screen.getByLabelText('Crop'), 'Parsnip')
    await userEvent.clear(screen.getByLabelText('Count'))
    await userEvent.type(screen.getByLabelText('Count'), '3')
    expect(screen.getByText('Planted Spring 1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add crop' }))
    expect(saved().farm.crops).toMatchObject([{ crop: 'parsnip', count: 3, season: 'spring', day: 1 }])
    expect(screen.getByText('3 Parsnip, ready Spring 5 (in 4 days)')).toBeInTheDocument()
  })

  it('lists only crops for the clock season, and spring crops with no clock', () => {
    seed(clock('summer', 3))
    const { unmount } = renderWithState(<CropsCard />)
    expect(optionNames()).toEqual(['Melon'])
    unmount()
    localStorage.clear()
    renderWithState(<CropsCard />)
    expect(optionNames()).toEqual(['Parsnip', 'Green Bean'])
  })

  it('lets the planting date be changed, and says when a crop will not finish', async () => {
    seed(clock('spring', 1))
    renderWithState(<CropsCard />)
    await userEvent.click(screen.getByRole('button', { name: 'Change date' }))
    await userEvent.clear(screen.getByLabelText('Planted day'))
    await userEvent.type(screen.getByLabelText('Planted day'), '26')
    expect(screen.getByText('Planted Spring 26')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add crop' }))
    expect(screen.getByText('1 Parsnip, Will not finish this season')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Harvest Parsnip' })).not.toBeInTheDocument()
  })

  it('Harvested removes a one-off crop and restarts a regrowing one', async () => {
    seed(clock('spring', 11), [
      { id: 'a', crop: 'parsnip', count: 2, season: 'spring', day: 1 },
      { id: 'b', crop: 'bean', count: 10, season: 'spring', day: 1 },
    ])
    renderWithState(<CropsCard />)
    expect(screen.getByText('10 Green Bean, Ready now')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Harvest Parsnip' }))
    expect(screen.queryByText(/2 Parsnip/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Harvest Green Bean' }))
    expect(screen.getByText('10 Green Bean, ready Spring 14 (in 3 days)')).toBeInTheDocument()
    expect(saved().farm.crops).toMatchObject([{ id: 'b', lastHarvest: { season: 'spring', day: 11 } }])
  })

  it('Remove deletes an entry', async () => {
    seed(clock('spring', 1), [{ id: 'a', crop: 'parsnip', count: 1, season: 'spring', day: 1 }])
    renderWithState(<CropsCard />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Parsnip' }))
    expect(screen.queryByText(/1 Parsnip/)).not.toBeInTheDocument()
    expect(saved().farm.crops).toEqual([])
  })

  it('shows an unknown crop with only Remove', async () => {
    seed(clock('spring', 1), [{ id: 'a', crop: 'gone', count: 1, season: 'spring', day: 1 }])
    renderWithState(<CropsCard />)
    expect(screen.getByText('Unknown crop')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Harvest/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove unknown crop' }))
    expect(screen.queryByText('Unknown crop')).not.toBeInTheDocument()
  })

  it('notes that only recorded crops are tracked', () => {
    renderWithState(<CropsCard />)
    expect(screen.getByText('Only what you record here is tracked.')).toBeInTheDocument()
  })
})
