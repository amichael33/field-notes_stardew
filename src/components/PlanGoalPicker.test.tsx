import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveProvider } from '../state/SaveContext'
import PlanGoalPicker from './PlanGoalPicker'

function setup() {
  return render(
    <SaveProvider>
      <PlanGoalPicker />
    </SaveProvider>,
  )
}

describe('PlanGoalPicker', () => {
  beforeEach(() => localStorage.clear())

  it('renders a Plan goal select with both goals, defaulting to Community Center', () => {
    setup()
    const select = screen.getByRole('combobox', { name: 'Plan goal' })
    expect(select).toHaveValue('community-center')
    expect(screen.getByRole('option', { name: 'Community Center in year 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Max money and farm growth' })).toBeInTheDocument()
  })

  it('saves the chosen goal', async () => {
    setup()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Plan goal' }), 'Max money and farm growth')
    expect(localStorage.getItem('field-notes-save')).toContain('"planGoal": "money"')
  })

  it('shows the description of the selected goal', async () => {
    setup()
    const select = screen.getByRole('combobox', { name: 'Plan goal' })
    expect(select).toHaveAccessibleDescription(/finishing the Community Center bundles/)
    await userEvent.selectOptions(select, 'money')
    expect(select).toHaveAccessibleDescription(/earning as much as possible/)
  })
})
