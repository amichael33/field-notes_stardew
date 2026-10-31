import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FarmTile from './FarmTile'

describe('FarmTile', () => {
  it('shows the picture, the count badge and the name', () => {
    render(
      <FarmTile label="Chicken" count={3} onClick={() => {}}>
        <span>pic</span>
      </FarmTile>,
    )
    const button = screen.getByRole('button', { name: 'Chicken' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('pic')).toBeInTheDocument()
  })

  it('has no badge without a count, reports selected, and clicks', async () => {
    const onClick = vi.fn()
    render(
      <FarmTile label="Coop" selected onClick={onClick}>
        <span>pic</span>
      </FarmTile>,
    )
    const button = screen.getByRole('button', { name: 'Coop' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button.querySelector('.farm-tile-count')).toBeNull()
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
