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
    expect(screen.getByLabelText('Notes')).toHaveValue('buy parsnip seeds')
  })

  it('the Today card and the Notes tab share the same note', async () => {
    renderWithState(
      <>
        <PathView />
        <NotesView />
      </>,
    )
    const [card, page] = screen.getAllByLabelText('Notes')
    await userEvent.type(card, 'water the kale')
    expect(card).toHaveValue('water the kale')
    expect(page).toHaveValue('water the kale')
  })
})
