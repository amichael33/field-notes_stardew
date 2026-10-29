import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import MyTasksCard from './MyTasksCard'
import NeededCard from './NeededCard'
import { defaultSave, serializeSave, parseSave } from '../../state/save'
import type { Clock } from '../../data/types'

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!)
const clock = (season: Clock['season'], day: number): Clock => ({
  season,
  day,
  minutes: 540,
  weather: 'sunny',
  status: 'paused',
})

describe('MyTasksCard', () => {
  beforeEach(() => localStorage.clear())

  it('adds a task for the current day, ticks it and removes it', async () => {
    renderWithState(<MyTasksCard />)
    await userEvent.type(screen.getByLabelText('Add a task for today'), 'Sell the melons')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(saved().customTasks).toMatchObject([{ season: 'spring', day: 1, text: 'Sell the melons' }])
    const box = screen.getByRole('checkbox', { name: 'Sell the melons' })
    await userEvent.click(box)
    expect(box).toBeChecked()
    expect(saved().checked[0]).toMatch(/^custom:/)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Sell the melons' }))
    expect(screen.queryByText('Sell the melons')).not.toBeInTheDocument()
    expect(saved().checked).toEqual([])
  })

  it('ignores blank input', async () => {
    renderWithState(<MyTasksCard />)
    await userEvent.type(screen.getByLabelText('Add a task for today'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(localStorage.getItem('field-notes-save')).toBeNull()
  })

  it('lists unfinished tasks from earlier days but not later ones', () => {
    localStorage.setItem(
      'field-notes-save',
      serializeSave({
        ...defaultSave(),
        clock: clock('spring', 5),
        customTasks: [
          { id: 'a', season: 'spring', day: 3, text: 'Old task' },
          { id: 'b', season: 'spring', day: 9, text: 'Future task' },
        ],
      }),
    )
    renderWithState(<MyTasksCard />)
    expect(screen.getByText('Old task')).toBeInTheDocument()
    expect(screen.queryByText('Future task')).not.toBeInTheDocument()
  })
})

describe('custom tasks in the save', () => {
  it('defaults to none for old saves and rejects bad entries', () => {
    const d = defaultSave() as unknown as Record<string, unknown>
    delete d.customTasks
    const old = parseSave(JSON.stringify(d))
    expect(old.ok && old.data.customTasks).toEqual([])
    const bad = parseSave(JSON.stringify({ ...d, customTasks: [{ id: 'x', season: 'spring', day: 40, text: 't' }] }))
    expect(bad.ok).toBe(false)
  })
})

describe('NeededCard season', () => {
  beforeEach(() => localStorage.clear())

  it('shows only spring items in spring and summer items in summer', () => {
    const { unmount } = renderWithState(<NeededCard />)
    expect(screen.getByRole('button', { name: 'Wild Horseradish' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Grape' })).not.toBeInTheDocument()
    unmount()
    localStorage.setItem('field-notes-save', serializeSave({ ...defaultSave(), clock: clock('summer', 3) }))
    renderWithState(<NeededCard />)
    expect(screen.getByRole('button', { name: 'Grape' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Wild Horseradish' })).not.toBeInTheDocument()
  })
})
