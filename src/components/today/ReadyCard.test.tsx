import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import ReadyCard from './ReadyCard'
import { defaultSave, serializeSave } from '../../state/save'
import { defaultFarm } from '../../state/farm-save'
import type { Clock, PlantedCrop } from '../../data/types'

vi.mock('../../data/farm-lookup', async (orig) => {
  const crops = [
    { id: 'parsnip', name: 'Parsnip', seeds: 'Parsnip Seeds', seasons: ['spring'], daysToGrow: 4, regrowDays: null },
    { id: 'bean', name: 'Green Bean', seeds: 'Bean Starter', seasons: ['spring'], daysToGrow: 10, regrowDays: 3 },
  ]
  return {
    ...(await orig<typeof import('../../data/farm-lookup')>()),
    CROPS: crops,
    cropById: (id: string) => crops.find((c) => c.id === id),
  }
})

const clock: Clock = { season: 'spring', day: 5, minutes: 540, weather: 'sunny', status: 'paused' }
function seed(c: Clock | null, crops: PlantedCrop[]) {
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...defaultSave(), clock: c, farm: { ...defaultFarm(), crops } }),
  )
}
const parsnip = (id: string, day: number, count = 3): PlantedCrop => ({
  id,
  crop: 'parsnip',
  count,
  season: 'spring',
  day,
})

describe('ReadyCard', () => {
  beforeEach(() => localStorage.clear())

  it('is hidden with no clock', () => {
    seed(null, [parsnip('a', 1)])
    renderWithState(<ReadyCard />)
    expect(screen.queryByRole('heading', { name: 'Ready to harvest' })).not.toBeInTheDocument()
  })

  it('is hidden when nothing is ready', () => {
    seed(clock, [parsnip('a', 3)])
    renderWithState(<ReadyCard />)
    expect(screen.queryByRole('heading', { name: 'Ready to harvest' })).not.toBeInTheDocument()
  })

  it('shows crops ready today and tomorrow, but not later ones', () => {
    seed(clock, [
      parsnip('a', 1),
      parsnip('b', 2, 5),
      { id: 'c', crop: 'bean', count: 2, season: 'spring', day: 1 },
    ])
    renderWithState(<ReadyCard />)
    expect(screen.getByRole('heading', { name: 'Ready to harvest' })).toBeInTheDocument()
    expect(screen.getByText('3 Parsnip, Ready now')).toBeInTheDocument()
    expect(screen.getByText('5 Parsnip, Tomorrow')).toBeInTheDocument()
    expect(screen.queryByText(/Green Bean/)).not.toBeInTheDocument()
  })

  it('never shows a crop that will not finish', () => {
    seed({ ...clock, day: 28 }, [parsnip('w', 26)])
    renderWithState(<ReadyCard />)
    expect(screen.queryByRole('heading', { name: 'Ready to harvest' })).not.toBeInTheDocument()
  })

  it('Harvested updates the saved entry', async () => {
    seed({ ...clock, day: 11 }, [{ id: 'b', crop: 'bean', count: 2, season: 'spring', day: 1 }])
    renderWithState(<ReadyCard />)
    expect(screen.getByText('2 Green Bean, Ready now')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Harvest Green Bean' }))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).farm.crops[0].lastHarvest).toEqual({
      season: 'spring',
      day: 11,
    })
    expect(screen.queryByRole('heading', { name: 'Ready to harvest' })).not.toBeInTheDocument()
  })
})
