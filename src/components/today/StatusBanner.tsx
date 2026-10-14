import { useState } from 'react'
import type { PathStep } from '../../data/types'
import { stepWhen } from '../../data/when'
import { useSave } from '../../state/SaveContext'
import {
  WEEKDAYS,
  formatTime,
  nudge,
  setDateTime,
  setWeather,
  startDay,
  togglePause,
  weekdayOf,
} from '../../state/clock'
import ClockEditor from './ClockEditor'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function StatusBanner({ nextStep }: { nextStep?: PathStep }) {
  const { save, updateClock } = useSave()
  const clock = save.clock
  const [editing, setEditing] = useState(false)
  // An import or another tab can clear the clock; do not leave the editor
  // armed to reappear when a clock comes back.
  if (!clock && editing) setEditing(false)

  const label = clock
    ? `${cap(clock.season)} ${clock.day} · ${WEEKDAYS[weekdayOf(clock.day)]}`
    : (nextStep && stepWhen(nextStep)) || 'Opening route'
  const canPause = clock?.status === 'running' || clock?.status === 'paused'

  return (
    <section className="banner" aria-label="Today status">
      <div className="banner-main">
        <h1>Today</h1>
        <p className="banner-when">{label}</p>
      </div>
      <div className="banner-controls">
        {clock && (
          <div className="banner-clock">
            <span className="clock-face">{formatTime(clock.minutes)}</span>
            {clock.status === 'ended' && <span className="banner-soon">Day over</span>}
          </div>
        )}
        <div className="banner-buttons">
          {canPause ? (
            <button type="button" className="banner-btn" onClick={() => updateClock((c) => (c ? togglePause(c) : c))}>
              {clock?.status === 'running' ? 'Pause' : 'Resume'}
            </button>
          ) : (
            <button type="button" className="banner-btn" onClick={() => updateClock((c) => startDay(c))}>
              Start day
            </button>
          )}
          {canPause && (
            <button type="button" className="banner-btn" onClick={() => updateClock((c) => startDay(c))}>
              Next day
            </button>
          )}
          {clock && (
            <>
              <button type="button" className="banner-btn" onClick={() => updateClock((c) => (c ? nudge(c, -10) : c))}>
                -10
              </button>
              <button type="button" className="banner-btn" onClick={() => updateClock((c) => (c ? nudge(c, 10) : c))}>
                +10
              </button>
              <button type="button" className="banner-btn" onClick={() => setEditing(true)}>
                Set time and date
              </button>
            </>
          )}
        </div>
        {clock && (
          <div className="weather-toggle" role="group" aria-label="Weather">
            {(['sunny', 'rain'] as const).map((w) => (
              <button
                key={w}
                type="button"
                className="banner-btn"
                aria-pressed={clock.weather === w}
                onClick={() => updateClock((c) => (c ? setWeather(c, w) : c))}
              >
                {cap(w)}
              </button>
            ))}
          </div>
        )}
        {clock && editing && (
          <ClockEditor
            clock={clock}
            onCancel={() => setEditing(false)}
            onApply={(p) => {
              updateClock((c) => (c ? setDateTime(c, p) : c))
              setEditing(false)
            }}
          />
        )}
      </div>
    </section>
  )
}
