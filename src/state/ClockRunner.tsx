import { useEffect, useRef } from 'react'
import { useSave } from './SaveContext'
import { STEP_MS, tick } from './clock'

export default function ClockRunner() {
  const { save, updateClock } = useSave()
  const running = save.clock?.status === 'running'
  const rem = useRef(0)

  useEffect(() => {
    if (!running) {
      rem.current = 0
      return
    }
    let last = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      rem.current += now - last
      last = now
      const steps = Math.floor(rem.current / STEP_MS)
      rem.current %= STEP_MS
      if (steps > 0) updateClock((c) => (c ? tick(c, steps) : c))
    }, 1000)
    return () => clearInterval(id)
  }, [running, updateClock])

  return null
}
