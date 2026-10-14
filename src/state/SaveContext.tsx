import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Route, SaveData } from '../data/types'
import { defaultSave, parseSave, serializeSave, toggleChecked } from './save'

const STORAGE_KEY = 'field-notes-save'

interface SaveApi {
  save: SaveData
  setRoute: (r: Route) => void
  toggle: (id: string) => void
  setNotes: (text: string) => void
  importSave: (json: string) => { ok: true } | { ok: false; error: string }
  exportSave: () => string
  saveError: boolean
}

const SaveContext = createContext<SaveApi | null>(null)

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaultSave()
    const parsed = parseSave(raw)
    return parsed.ok ? parsed.data : defaultSave()
  } catch {
    return defaultSave()
  }
}

export function SaveProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(load)
  const [saveError, setSaveError] = useState(false)

  const dirty = useRef(false)

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue === null) return
      const parsed = parseSave(e.newValue)
      if (parsed.ok) setSave(parsed.data)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!dirty.current) return
    try {
      localStorage.setItem(STORAGE_KEY, serializeSave(save))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [save])

  const setRoute = useCallback((route: Route) => {
    dirty.current = true
    setSave((s) => ({ ...s, profile: { ...s.profile, route } }))
  }, [])
  const toggle = useCallback((id: string) => {
    dirty.current = true
    setSave((s) => toggleChecked(s, id))
  }, [])
  const setNotes = useCallback((notes: string) => {
    dirty.current = true
    setSave((s) => ({ ...s, notes }))
  }, [])
  const importSave = useCallback((json: string) => {
    const parsed = parseSave(json)
    if (!parsed.ok) return { ok: false as const, error: parsed.error }
    dirty.current = true
    setSave(parsed.data)
    return { ok: true as const }
  }, [])
  const exportSave = useCallback(() => serializeSave(save), [save])

  return (
    <SaveContext.Provider
      value={{ save, setRoute, toggle, setNotes, importSave, exportSave, saveError }}
    >
      {children}
    </SaveContext.Provider>
  )
}

export function useSave(): SaveApi {
  const ctx = useContext(SaveContext)
  if (!ctx) throw new Error('useSave must be used inside SaveProvider')
  return ctx
}
