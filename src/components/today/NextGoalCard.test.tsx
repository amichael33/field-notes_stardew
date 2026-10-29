import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithState } from '../../test-utils'
import NextGoalCard from './NextGoalCard'
import { defaultSave, serializeSave } from '../../state/save'
import type { PathStep } from '../../data/types'
import stepsJson from '../../data/path-steps.json'

const fixture = vi.hoisted(() => ({
  'community-center': [] as unknown[],
  money: [] as unknown[],
}))

vi.mock('../../data/plans', async (orig) => ({
  ...(await orig<typeof import('../../data/plans')>()),
  PLANS: fixture,
}))

const steps = stepsJson as PathStep[]

describe('NextGoalCard', () => {
  beforeEach(() => {
    localStorage.clear()
    fixture['community-center'] = []
  })

  it('shows the next unchecked plan task, then the one after it', () => {
    fixture['community-center'] = [
      {
        season: 'spring',
        day: 1,
        why: 'Get the farm started.',
        tasks: [
          { id: 'a', text: 'Plant parsnips' },
          { id: 'b', text: 'Meet Lewis' },
        ],
      },
    ]
    const { unmount } = renderWithState(<NextGoalCard steps={steps} />)
    expect(screen.getByText('Plant parsnips')).toBeInTheDocument()
    expect(screen.getByText('Get the farm started.')).toBeInTheDocument()
    unmount()
    localStorage.setItem(
      'field-notes-save',
      serializeSave({ ...defaultSave(), checked: ['plan:community-center:a'] }),
    )
    renderWithState(<NextGoalCard steps={steps} />)
    expect(screen.getByText('Meet Lewis')).toBeInTheDocument()
  })

  it('keeps the legacy goal when the plan has no tasks', () => {
    renderWithState(<NextGoalCard steps={steps} />)
    const first = steps.filter((s) => s.order === 9 || s.order === 10).sort((a, b) => a.order - b.order)[0]
    expect(screen.getByText(first.title)).toBeInTheDocument()
  })
})
