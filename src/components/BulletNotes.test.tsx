import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveProvider } from '../state/SaveContext'
import BulletNotes from './BulletNotes'
import { autoBullet, bulletEnter, bulletIndent } from './bullets'

function setup() {
  render(
    <SaveProvider>
      <BulletNotes id="n" label="Notes" />
    </SaveProvider>,
  )
  return screen.getByLabelText('Notes') as HTMLTextAreaElement
}

describe('bullet helpers', () => {
  it('turns a dash and space into a bullet', () => {
    expect(autoBullet('- buy', 5)).toEqual({ value: '• buy', cursor: 5 })
    expect(autoBullet('plain', 5)).toBeNull()
  })
  it('continues a bullet on Enter and ends it when empty', () => {
    expect(bulletEnter('• buy', 5)).toEqual({ value: '• buy\n• ', cursor: 8 })
    expect(bulletEnter('• buy\n• ', 8)).toEqual({ value: '• buy\n', cursor: 6 })
    expect(bulletEnter('hello', 5)).toBeNull()
  })
  it('indents and outdents with the right bullet', () => {
    expect(bulletIndent('• a', 3, false)).toEqual({ value: '  ◦ a', cursor: 5 })
    expect(bulletIndent('  ◦ a', 5, true)).toEqual({ value: '• a', cursor: 3 })
    expect(bulletIndent('• a', 3, true)).toBeNull()
  })
})

describe('BulletNotes', () => {
  beforeEach(() => localStorage.clear())

  it('is plain text with no Edit or Preview toggle', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('typing a dash and space makes a bullet and Enter continues the list', async () => {
    const box = setup()
    await userEvent.type(box, '- buy seeds{Enter}water crops')
    expect(box.value).toBe('• buy seeds\n• water crops')
  })

  it('Tab nests a bullet', async () => {
    const box = setup()
    await userEvent.type(box, '- one{Enter}{Tab}two')
    expect(box.value).toBe('• one\n  ◦ two')
  })

  it('Add bullet starts a bullet', async () => {
    const box = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Add bullet' }))
    await userEvent.type(box, 'hello')
    expect(box.value).toBe('• hello')
  })

  it('saves the note', async () => {
    const box = setup()
    await userEvent.type(box, 'x')
    expect(JSON.parse(localStorage.getItem('field-notes-save')!).notes).toBe('x')
  })
})
