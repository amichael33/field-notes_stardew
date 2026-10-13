import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App routing', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('redirects unknown hash route to the path view', () => {
    window.location.hash = '#/nope'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Beginner Path' })).toBeInTheDocument()
  })

  it('renders four nav links', () => {
    render(<App />)
    for (const name of ['Path', 'Bundles', 'Villagers', 'Achievements']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })
})
