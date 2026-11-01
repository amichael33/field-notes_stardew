import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Clock, CustomTask, FarmData, PlanGoal, Route, SaveData } from '../data/types'
import { restoreClock } from './clock'
import { defaultSave, parseSave, serializeSave, toggleChecked } from './save'

const STORAGE_KEY = 'field-notes-save'

interface SaveApi {
  save: SaveData
  setRoute: (r: Route) => void
  setPlanGoal: (goal: PlanGoal) => void
  setRemixed: (on: boolean) => void
  setRemixPicks: (picks: Record<string, string[]>) => void
  toggle: (id: string) => void
  setNotes: (text: string) => void
  addCustomTask: (task: Omit<CustomTask, 'id'>) => void
  removeCustomTask: (id: string) => void
  updateClock: (fn: (c: Clock | null) => Clock | null) => void
  updateFarm: (fn: (f: FarmData) => FarmData) => void
  // True when this tab last changed the clock. Only the owner's ClockRunner
  // ticks, so two open tabs do not advance a running clock at double speed.
  isClockOwner: boolean
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
    return parsed.ok ? { ...parsed.data, clock: restoreClock(parsed.data.clock) } : defaultSave()
  } catch {
    return defaultSave()
  }
}

export function SaveProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(load)
  const [saveError, setSaveError] = useState(false)

  // A tab restoring a saved clock on load is not the owner (it is paused anyway).
  const [isClockOwner, setClockOwner] = useState(false)

  const dirty = useRef(false)
  const clockRef = useRef(save.clock)
  useEffect(() => {
    clockRef.current = save.clock
  }, [save.clock])

  useEffect(() => {
    // The other tab's save is applied as is: restoreClock is intentionally NOT
    // called here, so a clock running in another tab shows as running in this
    // one. This tab gives up clock ownership when the incoming clock differs
    // from its own (another tab changed it); an identical clock written back by
    // a tab that only changed something else keeps the owner ticking.
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue === null) return
      const parsed = parseSave(e.newValue)
      if (!parsed.ok) return
      if (JSON.stringify(parsed.data.clock) !== JSON.stringify(clockRef.current)) setClockOwner(false)
      setSave(parsed.data)
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
  const setPlanGoal = useCallback((planGoal: PlanGoal) => {
    dirty.current = true
    setSave((s) => ({ ...s, profile: { ...s.profile, planGoal } }))
  }, [])
  const setRemixed = useCallback((remixed: boolean) => {
    dirty.current = true
    setSave((s) => ({ ...s, profile: { ...s.profile, remixed } }))
  }, [])
  const setRemixPicks = useCallback((picks: Record<string, string[]>) => {
    dirty.current = true
    setSave((s) => ({ ...s, remix: { ...s.remix, picks } }))
  }, [])
  const toggle = useCallback((id: string) => {
    dirty.current = true
    setSave((s) => toggleChecked(s, id))
  }, [])
  const setNotes = useCallback((notes: string) => {
    dirty.current = true
    setSave((s) => ({ ...s, notes }))
  }, [])
  const addCustomTask = useCallback((task: Omit<CustomTask, 'id'>) => {
    dirty.current = true
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    setSave((s) => ({ ...s, customTasks: [...s.customTasks, { ...task, id }] }))
  }, [])
  const removeCustomTask = useCallback((id: string) => {
    dirty.current = true
    setSave((s) => ({
      ...s,
      customTasks: s.customTasks.filter((t) => t.id !== id),
      checked: s.checked.filter((c) => c !== `custom:${id}`),
    }))
  }, [])
  const updateClock = useCallback((fn: (c: Clock | null) => Clock | null) => {
    dirty.current = true
    setClockOwner(true)
    setSave((s) => ({ ...s, clock: fn(s.clock) }))
  }, [])
  const updateFarm = useCallback((fn: (f: FarmData) => FarmData) => {
    dirty.current = true
    setSave((s) => ({ ...s, farm: fn(s.farm) }))
  }, [])
  const importSave = useCallback((json: string) => {
    const parsed = parseSave(json)
    if (!parsed.ok) return { ok: false as const, error: parsed.error }
    dirty.current = true
    setClockOwner(true)
    setSave({ ...parsed.data, clock: restoreClock(parsed.data.clock) })
    return { ok: true as const }
  }, [])
  const exportSave = useCallback(() => serializeSave(save), [save])

  return (
    <SaveContext.Provider
      value={{
        save,
        setRoute,
        setPlanGoal,
        setRemixed,
        setRemixPicks,
        toggle,
        setNotes,
        addCustomTask,
        removeCustomTask,
        updateClock,
        updateFarm,
        isClockOwner,
        importSave,
        exportSave,
        saveError,
      }}
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
