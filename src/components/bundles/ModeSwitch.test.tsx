import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import ModeSwitch from './ModeSwitch'

describe('ModeSwitch', () => {
  beforeEach(() => localStorage.clear())

  it('shows Standard pressed by default', () => {
    renderWithState(<ModeSwitch />)
    expect(screen.getByRole('group', { name: 'Bundle mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Standard' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Remixed' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('saves remixed mode and can go back', async () => {
    renderWithState(<ModeSwitch />)
    await userEvent.click(screen.getByRole('button', { name: 'Remixed' }))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).profile.remixed).toBe(true)
    expect(screen.getByRole('button', { name: 'Remixed' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Standard' }))
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).profile.remixed).toBe(false)
  })
})
