import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
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

  it('the Today card and the Notes tab share the same note', async () => {
    renderWithState(
      <>
        <PathView />
        <NotesView />
      </>,
    )
    await userEvent.type(screen.getByLabelText('Notes for tomorrow'), 'water the kale')
    const section = screen.getByRole('heading', { name: 'Notes' }).closest('section')!
    await userEvent.click(within(section).getByRole('button', { name: 'Preview' }))
    expect(screen.getByLabelText('Notes preview')).toHaveTextContent('water the kale')
  })
})
