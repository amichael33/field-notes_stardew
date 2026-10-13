import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'
import VillagersView from './VillagersView'
import type { Villager } from '../data/types'

const v = (name: string, season: Villager['birthday']['season'], day: number, loves: string[] = ['Gem'], likes: string[] = ['Rock']): Villager => ({
  name, birthday: { season, day }, loves, likes,
})

describe('VillagersView', () => {
  it('lists birthdays sorted by day', () => {
    renderWithState(<VillagersView villagers={[v('Cara', 'spring', 24), v('Abe', 'spring', 3), v('Bo', 'spring', 14)]} />)
    const items = within(screen.getByRole('list', { name: 'Birthday calendar' })).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining('Abe'),
      expect.stringContaining('Bo'),
      expect.stringContaining('Cara'),
    ])
  })

  it('shows loves and likes', () => {
    renderWithState(<VillagersView villagers={[v('Abe', 'fall', 1, ['Diamond'], ['Quartz'])]} />)
    const card = screen.getByRole('article', { name: 'Abe' })
    expect(within(card).getByText('Diamond')).toBeInTheDocument()
    expect(within(card).getByText('Quartz')).toBeInTheDocument()
  })

  it("shows 'None listed' for empty loves", () => {
    renderWithState(<VillagersView villagers={[v('Abe', 'fall', 1, [], ['Quartz'])]} />)
    const card = screen.getByRole('article', { name: 'Abe' })
    expect(within(card).getByText('None listed')).toBeInTheDocument()
  })

  it('season filter limits the calendar', async () => {
    renderWithState(<VillagersView villagers={[v('Abe', 'spring', 3), v('Winnie', 'winter', 5)]} />)
    await userEvent.selectOptions(screen.getByLabelText(/Season/), 'winter')
    const cal = within(screen.getByRole('list', { name: 'Birthday calendar' }))
    expect(cal.getByText(/Winnie/)).toBeInTheDocument()
    expect(cal.queryByText(/Abe/)).not.toBeInTheDocument()
  })
})

describe('VillagersView universal tastes note', () => {
  it('explains that universal loves and likes are not repeated per villager', () => {
    renderWithState(<VillagersView villagers={[]} />)
    expect(screen.getByText(/Universal Loves and Likes apply to most villagers/)).toBeInTheDocument()
  })
})
