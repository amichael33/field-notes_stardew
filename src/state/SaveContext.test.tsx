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

  describe('clock', () => {
    const run = { season: 'spring', day: 3, minutes: 700, weather: 'sunny', status: 'running' } as const

    it('loads a running clock as paused', () => {
      localStorage.setItem(KEY, serializeSave({ ...defaultSave(), clock: { ...run } }))
      const { result } = renderHook(() => useSave(), { wrapper })
      expect(result.current.save.clock).toEqual({ ...run, status: 'paused' })
    })

    it('applies a clock from another tab as is, without restoreClock', () => {
      // Intentional: the storage handler does NOT call restoreClock. A running
      // clock from another tab stays running here, so both tabs show the same
      // time; only the owning tab (the one that last changed the clock) ticks.
      const { result } = renderHook(() => useSave(), { wrapper })
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: KEY, newValue: serializeSave({ ...defaultSave(), clock: { ...run } }) }),
        )
      })
      expect(result.current.save.clock).toEqual(run)
      expect(result.current.isClockOwner).toBe(false)
    })

    it('a tab is not the clock owner on load and becomes it on a local clock change', () => {
      localStorage.setItem(KEY, serializeSave({ ...defaultSave(), clock: { ...run } }))
      const { result } = renderHook(() => useSave(), { wrapper })
      expect(result.current.isClockOwner).toBe(false)
      act(() => result.current.updateClock((c) => c))
      expect(result.current.isClockOwner).toBe(true)
    })

    it('updateClock writes to localStorage', () => {
      const { result } = renderHook(() => useSave(), { wrapper })
      act(() => result.current.updateClock(() => ({ ...run })))
      expect(JSON.parse(localStorage.getItem(KEY)!).clock).toEqual(run)
    })

    it('importSave stores a running clock as paused', () => {
      const { result } = renderHook(() => useSave(), { wrapper })
      act(() => {
        result.current.importSave(serializeSave({ ...defaultSave(), clock: { ...run } }))
      })
      expect(result.current.save.clock).toEqual({ ...run, status: 'paused' })
    })

    it('importSave rejects a malformed clock and leaves save unchanged', () => {
      const { result } = renderHook(() => useSave(), { wrapper })
      const before = result.current.save
      let res: ReturnType<typeof result.current.importSave> | undefined
      act(() => {
        res = result.current.importSave(
          JSON.stringify({ ...defaultSave(), clock: { ...run, day: 99 } }),
        )
      })
      expect(res?.ok).toBe(false)
      expect(result.current.save).toBe(before)
    })
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
