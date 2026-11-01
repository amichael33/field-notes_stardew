import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'
import AchievementsView from './AchievementsView'
import achievements from '../data/achievements.json'
import perfection from '../data/perfection.json'
import extras from '../data/achievement-extras.json'
import notes from '../data/achievement-notes.json'
import icons from '../data/item-icons.json'
import { existsSync } from 'node:fs'

const hiddenCount = (list: { spoiler?: boolean }[]) => list.filter((x) => x.spoiler).length
const spoilerAchievements = Object.values(extras).filter((e) => (e as { spoiler?: boolean }).spoiler).length

describe('AchievementsView', () => {
  it('lists every achievement that is not a spoiler with its requirement and hat', () => {
    renderWithState(<AchievementsView />)
    const list = screen.getByRole('list', { name: 'All achievements' })
    expect(list.children).toHaveLength(achievements.length)
    expect(screen.getByText('Greenhorn')).toBeInTheDocument()
    expect(screen.getByText('Earn 15,000g')).toBeInTheDocument()
    expect(screen.getByText("Unlocks: Good Ol' Cap")).toBeInTheDocument()
  })

  it('gives every achievement an icon that exists', () => {
    for (const a of achievements) {
      const e = (extras as Record<string, { icon: string }>)[a.name]
      expect(e, a.name).toBeDefined()
      expect(existsSync(`public/${e.icon}`), `${a.name} icon ${e.icon}`).toBe(true)
    }
  })

  it('shows the Needed for Perfection list, weighing 100 percent in all', () => {
    renderWithState(<AchievementsView />)
    const section = screen.getByRole('region', { name: 'Needed for Perfection' })
    expect(within(section).getAllByRole('listitem')).toHaveLength(perfection.length)
    expect(perfection.reduce((n, p) => n + p.weight, 0)).toBe(100)
    expect(within(section).getByText('Fish Caught')).toBeInTheDocument()
    const fish = within(section).getByText('Fish Caught').closest('li')!
    expect(within(fish).getByText('10% of Perfection')).toBeInTheDocument()
  })

  it('hides spoilers until each one is clicked', async () => {
    renderWithState(<AchievementsView />)
    expect(screen.queryByText("Fector's Challenge")).not.toBeInTheDocument()
    expect(screen.queryByText('Golden Walnuts found')).not.toBeInTheDocument()
    const hidden = screen.getAllByRole('button', { name: /Hidden spoiler/ })
    expect(hidden).toHaveLength(hiddenCount(perfection) + spoilerAchievements)
    const card = screen.getByRole('listitem', { name: 'Hidden achievement 40' })
    await userEvent.click(within(card).getByRole('button'))
    expect(screen.getByText("Fector's Challenge")).toBeInTheDocument()
    expect(screen.queryByText('Golden Walnuts found')).not.toBeInTheDocument()
  })

  it('shows the Polyculture crops and the Monoculture extras with pictures', () => {
    renderWithState(<AchievementsView />)
    const poly = notes.polyculture.groups.flatMap((g) => g.crops)
    expect(poly).toHaveLength(28)
    const polyItem = screen.getByText('Polyculture').closest('li')!
    expect(within(polyItem).getAllByRole('listitem')).toHaveLength(28)
    const mono = notes.monoculture.groups.flatMap((g) => g.crops)
    expect(mono).toHaveLength(5)
    for (const crop of [...poly, ...mono]) expect(icons, crop).toHaveProperty([crop])
  })

  it('puts every spoiler after the other entries in both lists', () => {
    renderWithState(<AchievementsView />)
    const perf = [
      ...screen.getByRole('region', { name: 'Needed for Perfection' }).querySelectorAll('ul > li'),
    ]
    const ach = [...screen.getByRole('list', { name: 'All achievements' }).children]
    for (const items of [perf, ach]) {
      const firstHidden = items.findIndex((li) => li.classList.contains('goal-hidden'))
      expect(firstHidden).toBeGreaterThan(0)
      expect(items.slice(firstHidden).every((li) => li.classList.contains('goal-hidden'))).toBe(true)
    }
  })

  it('marks an entry done with a checkbox that is saved', async () => {
    renderWithState(<AchievementsView />)
    const box = screen.getByRole('checkbox', { name: /^Greenhorn/ })
    expect(box).not.toBeChecked()
    await userEvent.click(box)
    expect(box).toBeChecked()
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).checked).toContain('goal:a:Greenhorn')
    await userEvent.click(screen.getByRole('checkbox', { name: /^Fish Caught/ }))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).checked).toContain('goal:p:fish')
  })

  it('only offers the done checkbox for a spoiler after it is revealed', async () => {
    renderWithState(<AchievementsView />)
    expect(screen.queryByRole('checkbox', { name: /^Perfection/ })).not.toBeInTheDocument()
    const card = screen.getByRole('listitem', { name: 'Hidden achievement 49' })
    await userEvent.click(within(card).getByRole('button'))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Perfection/ }))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).checked).toContain('goal:a:Perfection')
  })
})
