import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import ReadyToday from './ReadyToday'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'
import type { Clock, PlantedCrop } from '../../data/types'

vi.mock('../../data/farm-lookup', async (orig) => {
  const crops = [
    { id: 'parsnip', name: 'Parsnip', seeds: 'Parsnip Seeds', seasons: ['spring'], daysToGrow: 4, regrowDays: null },
    { id: 'potato', name: 'Potato', seeds: 'Potato Seeds', seasons: ['spring'], daysToGrow: 6, regrowDays: null },
    { id: 'bean', name: 'Green Bean', seeds: 'Bean Starter', seasons: ['spring'], daysToGrow: 10, regrowDays: 3 },
  ]
  return {
    ...(await orig<typeof import('../../data/farm-lookup')>()),
    CROPS: crops,
    cropById: (id: string) => crops.find((c) => c.id === id),
  }
})

const clock: Clock = { season: 'spring', day: 12, minutes: 540, weather: 'sunny', status: 'paused' }
function seed(c: Clock | null, crops: PlantedCrop[]) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), clock: c, farm: { ...defaultFarm(), crops } }),
  )
}
const plant = (id: string, crop: string, day: number, count = 10, season: PlantedCrop['season'] = 'spring'): PlantedCrop => ({
  id,
  crop,
  count,
  season,
  day,
})

describe('ReadyToday', () => {
  beforeEach(() => localStorage.clear())

  it('lists ready and tomorrow crops, harvesting a ready one', async () => {
    seed(clock, [plant('a', 'parsnip', 8, 4), plant('b', 'potato', 7, 5)])
    renderWithState(<ReadyToday />)
    expect(screen.getByRole('heading', { name: 'Ready today' })).toBeInTheDocument()
    expect(screen.getByText('Ready now')).toBeInTheDocument()
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Harvest / })).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Harvest Parsnip' }))
    const saved = JSON.parse(localStorage.getItem('field-notes-save')!).farm.crops
    expect(saved.map((c: PlantedCrop) => c.id)).toEqual(['b'])
  })

  it('shows dead crops with a Remove button', async () => {
    seed({ ...clock, season: 'summer', day: 3 }, [plant('d', 'parsnip', 1)])
    renderWithState(<ReadyToday />)
    expect(screen.getByText('Died at the season change')).toBeInTheDocument()
    expect(screen.getByText('Nothing to harvest today.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove Parsnip' }))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).farm.crops).toEqual([])
  })

  it('lists coming up crops and the empty state with a next harvest', () => {
    seed(clock, [plant('c', 'bean', 5), plant('x', 'bean', 10)])
    renderWithState(<ReadyToday />)
    expect(screen.getByText('Coming up')).toBeInTheDocument()
    expect(screen.getByText('Green Bean ×10, Spring 15 (in 3 days)')).toBeInTheDocument()
    expect(screen.getByText('Nothing to harvest today.')).toBeInTheDocument()
    expect(screen.getByText('Next: Green Bean ×10, Spring 15 (in 3 days)')).toBeInTheDocument()
  })

  it('points to Crops planted when nothing is planted', () => {
    seed(clock, [])
    renderWithState(<ReadyToday />)
    expect(screen.getByText('Nothing to harvest today.')).toBeInTheDocument()
    expect(screen.getByText('Plant something in Crops planted.')).toBeInTheDocument()
  })
})
