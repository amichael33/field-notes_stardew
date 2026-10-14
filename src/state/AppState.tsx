import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Season } from '../data/types'

interface AppState {
  season: Season | 'all'
  setSeason: (s: Season | 'all') => void
}

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<Season | 'all'>('all')
  return (
    <AppStateContext.Provider value={{ season, setSeason }}>{children}</AppStateContext.Provider>
  )
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
