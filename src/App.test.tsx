import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('Farm tab shows the farm tracker', () => {
    window.location.hash = '#/farm'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Farm' })).toBeInTheDocument()
    expect(screen.queryByText(/Coming soon/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Crops in the ground' })).toBeInTheDocument()
  })

  it('Notes tab shows the notes editor', () => {
    window.location.hash = '#/notes'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('has no Print page button', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Print page' })).not.toBeInTheDocument()
  })
})
