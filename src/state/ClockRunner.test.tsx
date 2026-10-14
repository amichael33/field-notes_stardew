import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { SaveProvider, useSave } from './SaveContext'
import ClockRunner from './ClockRunner'
import { defaultSave, serializeSave } from './save'
import { nudge, togglePause } from './clock'
import type { Clock } from '../data/types'

const KEY = 'field-notes-save'
let api: ReturnType<typeof useSave>
function Probe() {
  api = useSave()
  return null
}
function setup(clock: Clock) {
  localStorage.setItem(KEY, serializeSave({ ...defaultSave(), clock }))
  render(
    <SaveProvider>
      <ClockRunner />
      <Probe />
    </SaveProvider>,
  )
}
const paused: Clock = { season: 'spring', day: 1, minutes: 360, weather: 'sunny', status: 'paused' }
const start = () => act(() => api.updateClock((c) => (c ? togglePause(c) : c)))
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('ClockRunner', () => {
  it('adds 10 minutes per 7000 ms while running', () => {
    setup(paused)
    start()
    advance(7000)
    expect(api.save.clock?.minutes).toBe(370)
  })

  it('catches up after a long jump', () => {
    setup(paused)
    start()
    act(() => {
      vi.setSystemTime(Date.now() + 21000)
      vi.advanceTimersByTime(1000)
    })
    expect(api.save.clock?.minutes).toBe(390)
  })

  it('does not move a paused clock', () => {
    setup(paused)
    advance(30000)
    expect(api.save.clock?.minutes).toBe(360)
  })

  it('stops at ended on reaching 1560', () => {
    setup({ ...paused, minutes: 1550 })
    start()
    advance(7000)
    expect(api.save.clock).toMatchObject({ minutes: 1560, status: 'ended' })
    advance(30000)
    expect(api.save.clock?.minutes).toBe(1560)
  })

  it('a manual nudge does not reset the carried partial interval', () => {
    setup(paused)
    start()
    advance(5000)
    act(() => api.updateClock((c) => (c ? nudge(c, 10) : c)))
    expect(api.save.clock?.minutes).toBe(370)
    advance(2000)
    expect(api.save.clock?.minutes).toBe(380)
  })
})
