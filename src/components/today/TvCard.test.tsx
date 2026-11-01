import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import TvCard from './TvCard'
import { defaultSave, serializeSave } from '../../state/save'
import type { Season } from '../../data/types'

function seed(season: Season, day: number, checked: string[] = []) {
  const s = defaultSave()
  localStorage.setItem(
    'field-notes-save',
    serializeSave({
      ...s,
      checked,
      clock: { season, day, minutes: 360, weather: 'sunny', status: 'running' },
    }),
  )
}

describe('TvCard', () => {
  beforeEach(() => localStorage.clear())

  it('shows the recipe todo on an air day and saves the tick', async () => {
    seed('spring', 14)
    renderWithState(<TvCard />)
    const box = screen.getByRole('checkbox', { name: /learn Coleslaw/ })
    expect(box).not.toBeChecked()
    await userEvent.click(box)
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).checked).toContain('tv:Coleslaw')
  })

  it('labels a Thursday rerun, and hides it once the recipe was watched', () => {
    seed('spring', 18)
    const first = renderWithState(<TvCard />)
    expect(screen.getByText('Rerun')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /rerun.*Coleslaw/ })).toBeInTheDocument()
    first.unmount()
    seed('spring', 18, ['tv:Coleslaw'])
    renderWithState(<TvCard />)
    expect(screen.queryByText('On TV today')).not.toBeInTheDocument()
  })

  it('renders nothing on a day with no episode', () => {
    seed('spring', 9)
    renderWithState(<TvCard />)
    expect(screen.queryByText('On TV today')).not.toBeInTheDocument()
  })
})
