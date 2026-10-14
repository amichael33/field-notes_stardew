import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithState } from '../../test-utils'
import WhereCard from './WhereCard'
import { describeLocation } from './where-text'
import type { Clock, PathStep } from '../../data/types'
import { defaultSave, serializeSave } from '../../state/save'
import { formatTime } from '../../state/clock'
import { locationAt, rainMayVary, scheduleFor } from '../../data/schedules'

const steps: PathStep[] = [
  { order: 1, season: 'spring', day: 1, title: 'Talk to Krobus', detail: 'Krobus lives in the sewers.' },
  { order: 2, season: 'spring', day: 1, title: 'Meet the town', detail: 'Say hello to Pierre and Abigail.' },
]

const base: Clock = { season: 'spring', day: 1, minutes: 540, weather: 'sunny', status: 'paused' }

function seed(clock: Clock | null, checked: string[] = []) {
  localStorage.setItem('field-notes-save', serializeSave({ ...defaultSave(), clock, checked }))
}

const rowOf = (who: string) =>
  within(screen.getByRole('list', { name: 'People to visit' }))
    .getAllByRole('listitem')
    .find((li) => li.textContent?.startsWith(who))!

describe('WhereCard', () => {
  it('with no clock lists people and steps and prompts to start the day', () => {
    seed(null)
    renderWithState(<WhereCard steps={steps} />)
    expect(rowOf('Pierre').textContent).toContain('Meet the town')
    expect(screen.getByText('Press Start day to see where they are.')).toBeInTheDocument()
    expect(screen.queryByText(/come with the schedule data/)).not.toBeInTheDocument()
  })

  it('shows where Pierre is at 9:00 AM and what comes next', () => {
    seed(base)
    renderWithState(<WhereCard steps={steps} />)
    const stops = scheduleFor('Pierre', 'spring', 1, false)!
    const loc = locationAt(stops, 540)
    const text = rowOf('Pierre').textContent!
    expect(text).toContain("Pierre's General Store since " + formatTime(loc.since!))
    expect(text).toContain(`then ${loc.next!.place} at ${formatTime(loc.next!.time)}`)
    expect(text).toContain('Meet the town')
    expect(screen.queryByText('Press Start day to see where they are.')).not.toBeInTheDocument()
  })

  it('says At home until the first stop before it', () => {
    seed({ ...base, minutes: 360 })
    renderWithState(<WhereCard steps={steps} />)
    const first = scheduleFor('Pierre', 'spring', 1, false)![0]
    expect(rowOf('Pierre').textContent).toContain(
      `At home until ${formatTime(first.time)}, then ${first.place}`,
    )
  })

  it('lists people with a location before people without, and shows the step only for no schedule', () => {
    seed(base)
    renderWithState(<WhereCard steps={steps} />)
    const rows = within(screen.getByRole('list', { name: 'People to visit' })).getAllByRole('listitem')
    const krobus = rows.findIndex((li) => li.textContent?.startsWith('Krobus'))
    const pierre = rows.findIndex((li) => li.textContent?.startsWith('Pierre'))
    expect(pierre).toBeLessThan(krobus)
    expect(rows[krobus].textContent).toBe('Krobus: Talk to Krobus (Spring 1)')
  })

  it('an ended clock shows end-of-day places with no then', () => {
    seed({ ...base, minutes: 1560, status: 'ended' })
    renderWithState(<WhereCard steps={steps} />)
    const text = rowOf('Pierre').textContent!
    expect(text).toMatch(/since/)
    expect(text).not.toContain('then')
  })

  it('notes that rainy days may differ for villagers with a rain2 rule', () => {
    expect(rainMayVary('Abigail', true)).toBe(true)
    seed({ ...base, weather: 'rain' })
    renderWithState(<WhereCard steps={steps} />)
    expect(rowOf('Abigail').textContent).toContain('may differ on rainy days')
    expect(rowOf('Pierre').textContent).not.toContain('may differ on rainy days')
  })

  it('hides when Meet the town is ticked', () => {
    seed(base, ['path:2'])
    renderWithState(<WhereCard steps={steps} />)
    expect(screen.queryByText('Where is everyone')).not.toBeInTheDocument()
  })

  it('describeLocation formats the three shapes', () => {
    expect(describeLocation({ place: 'Saloon', since: 600 })).toBe('Saloon since 10:00 AM')
    expect(describeLocation({ place: 'At home', since: null, next: { time: 600, place: 'Saloon' } })).toBe(
      'At home until 10:00 AM, then Saloon',
    )
    expect(describeLocation({ place: 'Saloon', since: 600, next: { time: 700, place: 'Beach' } })).toBe(
      'Saloon since 10:00 AM, then Beach at 11:40 AM',
    )
  })
})
