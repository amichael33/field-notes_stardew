import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../test-utils'
import NotesView from './NotesView'
import PathView from './PathView'

describe('NotesView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('edits the same note the Today card shows', async () => {
    const first = renderWithState(<NotesView />)
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Notes'), 'buy parsnip seeds')
    first.unmount()
    renderWithState(<PathView />)
    expect(screen.getByLabelText('Notes for tomorrow')).toHaveValue('buy parsnip seeds')
  })
})
