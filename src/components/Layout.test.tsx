import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppStateProvider } from '../state/AppState'
import { SaveProvider, useSave } from '../state/SaveContext'
import Layout from './Layout'

function Probe() {
  const { save, toggle, exportSave } = useSave()
  return (
    <div>
      <button type="button" onClick={() => toggle('path:0')}>
        tick zero
      </button>
      <div data-testid="checked">{save.checked.join(',')}</div>
      <div data-testid="export">{exportSave()}</div>
    </div>
  )
}

function renderLayout() {
  return render(
    <MemoryRouter>
      <SaveProvider>
        <AppStateProvider>
          <Layout />
          <Probe />
        </AppStateProvider>
      </SaveProvider>
    </MemoryRouter>,
  )
}

function upload(content: string) {
  const input = screen.getByLabelText('Import save file')
  const file = new File([content], 'save.json', { type: 'application/json' })
  return userEvent.upload(input, file)
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Layout export and import', () => {
  it('Export builds a download with the stored JSON', async () => {
    const create = vi.fn(() => 'blob:fake')
    const revoke = vi.fn()
    URL.createObjectURL = create
    URL.revokeObjectURL = revoke
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(create).toHaveBeenCalledTimes(1)
    const calls = create.mock.calls as unknown as Blob[][]
    const blob = calls[0][0]
    const text = await new Promise<string>((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.readAsText(blob)
    })
    expect(text).toBe(screen.getByTestId('export').textContent)
    expect(click).toHaveBeenCalled()
  })

  it('Import replaces the save from a valid file', async () => {
    renderLayout()
    await upload(
      JSON.stringify({
        version: 1,
        profile: { route: 'joja', farmType: 'standard' },
        checked: ['path:1'],
        notes: '',
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Imported')
    expect(screen.getByTestId('checked')).toHaveTextContent('path:1')
  })

  it('Import shows an error for invalid JSON and keeps data', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'tick zero' }))
    await upload('{not json')
    expect(await screen.findByRole('status')).toHaveTextContent('not valid JSON')
    expect(screen.getByTestId('checked')).toHaveTextContent('path:0')
  })

  it('Import rejects a newer version file', async () => {
    renderLayout()
    await upload(JSON.stringify({ version: 2 }))
    expect(await screen.findByRole('status')).toHaveTextContent(/newer/)
  })

  it("shows Couldn't save when storage writes fail", async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    renderLayout()
    await waitFor(() => expect(screen.getByText(/Couldn't save/)).toBeInTheDocument())
  })
})
