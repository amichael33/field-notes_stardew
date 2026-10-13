import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App routing', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('redirects unknown hash route to the Today view', () => {
    window.location.hash = '#/nope'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
  })

  it('renders the six tabs', () => {
    render(<App />)
    for (const name of ['Today', 'Community Center', 'Goals', 'People', 'Farm', 'Notes']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('shows the Field Notes name in the header', () => {
    render(<App />)
    expect(screen.getByText('Field Notes')).toBeInTheDocument()
  })

  it.each([
    ['Farm', '#/farm'],
    ['Notes', '#/notes'],
  ])('%s tab says it is coming soon', (name, hash) => {
    window.location.hash = hash
    render(<App />)
    expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    expect(screen.getByText(/Coming soon/)).toBeInTheDocument()
  })

  it('Print button opens the print dialog', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Print page' }))
    expect(print).toHaveBeenCalledTimes(1)
  })
})
