import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithState } from '../test-utils'
import AchievementsView from './AchievementsView'
import achievements from '../data/achievements.json'

describe('AchievementsView', () => {
  it('lists every achievement with its requirement', () => {
    renderWithState(<AchievementsView />)
    expect(screen.getAllByRole('listitem')).toHaveLength(achievements.length)
    expect(screen.getByText('Greenhorn')).toBeInTheDocument()
    expect(screen.getByText('Earn 15,000g')).toBeInTheDocument()
  })
})
