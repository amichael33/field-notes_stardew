import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SaveProvider, useSave } from './SaveContext'
import { defaultSave, serializeSave } from './save'

const KEY = 'field-notes-save'
const wrapper = ({ children }: { children: ReactNode }) => <SaveProvider>{children}</SaveProvider>

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SaveProvider', () => {
  it('starts from defaults when localStorage is empty', () => {
    const { result } = renderHook(() => useSave(), { wrapper })
    expect(result.current.save).toEqual(defaultSave())
    expect(result.current.saveError).toBe(false)
  })

  it('loads saved data from localStorage', () => {
    const saved = { ...defaultSave(), checked: ['a'], notes: 'hi' }
    localStorage.setItem(KEY, serializeSave(saved))
    const { result } = renderHook(() => useSave(), { wrapper })
    expect(result.current.save).toEqual(saved)
  })

  it('falls back to defaults when stored data is corrupt', () => {
    localStorage.setItem(KEY, '{nope')
    const { result } = renderHook(() => useSave(), { wrapper })
    expect(result.current.save).toEqual(defaultSave())
  })

  it('persists a toggle to localStorage', () => {
    const { result } = renderHook(() => useSave(), { wrapper })
    act(() => result.current.toggle('x'))
    expect(result.current.save.checked).toEqual(['x'])
    expect(JSON.parse(localStorage.getItem(KEY)!).checked).toEqual(['x'])
  })

  it('survives localStorage.getItem throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useSave(), { wrapper })
    expect(result.current.save).toEqual(defaultSave())
  })

  it('sets saveError when localStorage.setItem throws after a change', () => {
    const { result } = renderHook(() => useSave(), { wrapper })
    expect(result.current.saveError).toBe(false)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    act(() => result.current.toggle('x'))
    expect(result.current.saveError).toBe(true)
  })

  it('does not overwrite an unparseable stored value on load', () => {
    const original = JSON.stringify({ version: 2, future: true })
    localStorage.setItem(KEY, original)
    const { result } = renderHook(() => useSave(), { wrapper })
    expect(result.current.save).toEqual(defaultSave())
    expect(localStorage.getItem(KEY)).toBe(original)
    act(() => result.current.toggle('x'))
    expect(localStorage.getItem(KEY)).not.toBe(original)
  })

  it('adopts a valid save written by another tab', () => {
    const { result } = renderHook(() => useSave(), { wrapper })
    const other = { ...defaultSave(), notes: 'from other tab' }
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: KEY, newValue: serializeSave(other) }),
      )
    })
    expect(result.current.save.notes).toBe('from other tab')
  })

  it('ignores invalid, null or unrelated storage events', () => {
    const { result } = renderHook(() => useSave(), { wrapper })
    act(() => result.current.setNotes('mine'))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '{nope' }))
      window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: null }))
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'other',
          newValue: serializeSave({ ...defaultSave(), notes: 'x' }),
        }),
      )
    })
    expect(result.current.save.notes).toBe('mine')
  })

  it('importSave rejects bad data and leaves the save unchanged', () => {
    const { result } = renderHook(() => useSave(), { wrapper })
    act(() => result.current.toggle('x'))
    let res: ReturnType<typeof result.current.importSave> | undefined
    act(() => {
      res = result.current.importSave('{nope')
    })
    expect(res?.ok).toBe(false)
    expect(result.current.save.checked).toEqual(['x'])
  })

  it('importSave accepts valid data, and setRoute/setNotes/exportSave work', () => {
    const { result } = renderHook(() => useSave(), { wrapper })
    act(() => result.current.setRoute('joja'))
    act(() => result.current.setNotes('n'))
    expect(JSON.parse(result.current.exportSave())).toMatchObject({
      profile: { route: 'joja' },
      notes: 'n',
    })
    const incoming = { ...defaultSave(), checked: ['z'] }
    let res: ReturnType<typeof result.current.importSave> | undefined
    act(() => {
      res = result.current.importSave(serializeSave(incoming))
    })
    expect(res).toEqual({ ok: true })
    expect(result.current.save).toEqual(incoming)
  })

  it('useSave throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Probe() {
      useSave()
      return null
    }
    expect(() => render(<Probe />)).toThrow()
  })
})
