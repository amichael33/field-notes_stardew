import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveProvider } from '../state/SaveContext'
import MarkdownNotes from './MarkdownNotes'

function setup() {
  return render(
    <SaveProvider>
      <MarkdownNotes id="n" label="Notes" />
    </SaveProvider>,
  )
}

async function write(text: string) {
  const box = screen.getByLabelText('Notes')
  await userEvent.click(box)
  await userEvent.paste(text)
}

const preview = () => userEvent.click(screen.getByRole('button', { name: 'Preview' }))

describe('MarkdownNotes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts in Edit with the textarea visible', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('renders nested bullets as a nested list', async () => {
    setup()
    await write('- a\n  - b')
    await preview()
    const outer = within(screen.getByLabelText('Notes preview')).getAllByRole('listitem')[0]
    expect(outer.querySelector('ul')).not.toBeNull()
    expect(within(outer).getByText('b')).toBeInTheDocument()
  })

  it('shows a script tag as text and does not render an element', async () => {
    setup()
    await write('<script>alert(1)</script>')
    await preview()
    const box = screen.getByLabelText('Notes preview')
    expect(box.querySelector('script')).toBeNull()
    expect(box).toHaveTextContent('alert(1)')
  })

  it('the Edit and Preview toggle keeps the note text', async () => {
    setup()
    await write('keep me')
    await preview()
    expect(screen.queryByLabelText('Notes')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Notes preview')).toHaveTextContent('keep me')
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Notes')).toHaveValue('keep me')
  })

  it('typing in Edit saves the note', async () => {
    const { unmount } = setup()
    await userEvent.type(screen.getByLabelText('Notes'), 'saved')
    unmount()
    setup()
    expect(screen.getByLabelText('Notes')).toHaveValue('saved')
  })

  it('links open in a new tab with noopener noreferrer', async () => {
    setup()
    await write('[site](https://example.com)')
    await preview()
    const link = screen.getByRole('link', { name: 'site' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('a very long unbroken note keeps its value and renders in Preview', async () => {
    setup()
    const long = 'x'.repeat(300)
    await write(long)
    expect(screen.getByLabelText('Notes')).toHaveValue(long)
    await preview()
    expect(screen.getByLabelText('Notes preview')).toHaveTextContent(long)
  })
})
