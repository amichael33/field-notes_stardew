import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'

const saved = () => JSON.parse(localStorage.getItem('field-notes-save')!).profile

describe('RouteToggle', () => {
  beforeEach(() => localStorage.clear())

  it('offers Community Center, Remixed Community Center and Joja', () => {
    renderWithState(<div />)
    const options = within(screen.getByLabelText(/Route/))
      .getAllByRole('option')
      .map((o) => o.textContent)
    expect(options).toEqual(['Community Center', 'Remixed Community Center', 'Joja'])
    expect(screen.getByLabelText(/Route/)).toHaveValue('community-center')
  })

  it('picking Remixed keeps the Community Center route and turns Remixed on', async () => {
    renderWithState(<div />)
    await userEvent.selectOptions(screen.getByLabelText(/Route/), 'remixed')
    expect(saved()).toMatchObject({ route: 'community-center', remixed: true })
    expect(screen.getByLabelText(/Route/)).toHaveValue('remixed')
  })

  it('Joja keeps the bundle mode, so switching back returns to Remixed', async () => {
    renderWithState(<div />)
    await userEvent.selectOptions(screen.getByLabelText(/Route/), 'remixed')
    await userEvent.selectOptions(screen.getByLabelText(/Route/), 'joja')
    expect(saved()).toMatchObject({ route: 'joja', remixed: true })
    expect(screen.getByLabelText(/Route/)).toHaveValue('joja')
  })

  it('Community Center turns Remixed back off', async () => {
    renderWithState(<div />)
    await userEvent.selectOptions(screen.getByLabelText(/Route/), 'remixed')
    await userEvent.selectOptions(screen.getByLabelText(/Route/), 'community-center')
    expect(saved()).toMatchObject({ route: 'community-center', remixed: false })
  })
})
