import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'
import VillagerWhere from './VillagerWhere'
import { defaultSave, serializeSave } from '../state/save'
import type { Clock } from '../data/types'

const clock = (over: Partial<Clock> = {}): Clock => ({
  season: 'spring',
  day: 1,
  minutes: 600,
  weather: 'sunny',
  status: 'paused',
  ...over,
})
const seed = (c: Clock | null) =>
  localStorage.setItem('field-notes-save', serializeSave({ ...defaultSave(), clock: c }))

describe('VillagerWhere', () => {
  beforeEach(() => localStorage.clear())

  it('shows nothing without a clock', () => {
    renderWithState(<VillagerWhere name="Pierre" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows where Pierre is now, and what comes next once he has moved on', () => {
    seed(clock({ minutes: 600 }))
    renderWithState(<VillagerWhere name="Pierre" />)
    expect(screen.getByRole('button', { name: /Pierre location: Pierre's General Store since/ })).toBeInTheDocument()
  })

  it('shows the map on hover and removes it when the pointer leaves the map', async () => {
    seed(clock({ season: 'summer', day: 3, minutes: 600 }))
    renderWithState(<VillagerWhere name="Pierre" />)
    await userEvent.hover(screen.getByRole('button', { name: /Pierre location/ }))
    const popup = screen.getByRole('dialog', { name: 'Where Pierre is' })
    expect(popup.querySelector('img')).toHaveAttribute('src', 'map/summer.png')
    expect(popup.querySelector('.map-marker.now')).not.toBeNull()
    await userEvent.unhover(popup)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }, 15000)

  it('shows the map on click too, and Escape closes it', async () => {
    seed(clock())
    renderWithState(<VillagerWhere name="Pierre" />)
    await userEvent.click(screen.getByRole('button', { name: /Pierre location/ }))
    expect(screen.getByRole('dialog', { name: 'Where Pierre is' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('says there is no schedule data for villagers without one', () => {
    seed(clock())
    renderWithState(<VillagerWhere name="Nobody" />)
    expect(screen.getByText('No schedule data.')).toBeInTheDocument()
  })
})
