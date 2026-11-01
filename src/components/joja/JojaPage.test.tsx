import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import JojaPage from './JojaPage'
import { defaultSave, serializeSave } from '../../state/save'
import type { Clock } from '../../data/types'

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)
const clock = (season: Clock['season']): Clock => ({
  season,
  day: 3,
  minutes: 540,
  weather: 'sunny',
  status: 'paused',
})

describe('JojaPage', () => {
  beforeEach(() => localStorage.clear())

  it('keeps the bundles message and shows the store facts and membership price', () => {
    renderWithState(<JojaPage />)
    expect(screen.getByText(/Bundles are not used on the Joja route/)).toBeInTheDocument()
    expect(screen.getByText(/9:00am to 11:00pm/)).toBeInTheDocument()
    expect(screen.getByText('5,000g', { selector: '.joja-price' })).toBeInTheDocument()
  })

  it('lists the projects with prices and the total', () => {
    renderWithState(<JojaPage />)
    const list = screen.getByRole('list', { name: 'Community Development Projects' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(within(items[0]).getByText('Minecarts')).toBeInTheDocument()
    expect(within(items[4]).getByText('40,000g')).toBeInTheDocument()
    expect(screen.getByText(/135,000g in all/)).toBeInTheDocument()
    expect(screen.getByText(/140,000g with the membership/)).toBeInTheDocument()
  })

  it('ticks a project as done and saves it', async () => {
    renderWithState(<JojaPage />)
    const box = screen.getByRole('checkbox', { name: /^Minecarts/ })
    expect(box).not.toBeChecked()
    await userEvent.click(box)
    expect(box).toBeChecked()
    expect(saved().checked).toContain('joja:minecarts')
    await userEvent.click(screen.getByRole('checkbox', { name: /^JojaMart Membership/ }))
    expect(saved().checked).toContain('joja:membership')
  })

  it('shows the current season stock first and the other seasons after', () => {
    localStorage.setItem('field-notes-save', serializeSave({ ...defaultSave(), clock: clock('fall') }))
    renderWithState(<JojaPage />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    const stock = headings.filter((h) => /^(Spring|Summer|Fall|Winter) stock$/.test(h ?? ''))
    expect(stock[0]).toBe('Fall stock')
    expect(stock).toHaveLength(4)
    expect(screen.getByText('Corn Seeds')).toBeInTheDocument()
    expect(screen.getByText('187g')).toBeInTheDocument()
  })

  it('lists what Pierre sells that Joja does not', () => {
    renderWithState(<JojaPage />)
    expect(screen.getByText(/Garlic Seeds/)).toBeInTheDocument()
  })
})
