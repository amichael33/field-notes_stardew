import { useEffect, useId, useRef, useState } from 'react'
import type { Clock, Season } from '../../data/types'
import { MORNING, NIGHT, formatTime } from '../../state/clock'

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']
const TIMES: number[] = []
for (let m = MORNING; m <= NIGHT; m += 10) TIMES.push(m)

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function ClockEditor({
  clock,
  onApply,
  onCancel,
}: {
  clock: Clock
  onApply: (p: { season: Season; day: number; minutes: number }) => void
  onCancel: () => void
}) {
  const [season, setSeason] = useState<Season>(clock.season)
  const [dayText, setDayText] = useState(String(clock.day))
  const [minutes, setMinutes] = useState(clock.minutes)

  const day = Number(dayText)
  const valid = dayText.trim() !== '' && Number.isInteger(day) && day >= 1 && day <= 28
  const errorId = useId()
  const first = useRef<HTMLSelectElement>(null)

  // Move focus into the editor when it opens.
  useEffect(() => {
    first.current?.focus()
  }, [])

  return (
    <form
      aria-label="Clock editor"
      className="clock-editor"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onApply({ season, day, minutes })
      }}
    >
      <label>
        Season
        <select ref={first} value={season} onChange={(e) => setSeason(e.target.value as Season)}>
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {cap(s)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Day
        <input
          type="number"
          min={1}
          max={28}
          step={1}
          value={dayText}
          aria-invalid={!valid}
          aria-describedby={valid ? undefined : errorId}
          onChange={(e) => setDayText(e.target.value)}
        />
      </label>
      <label>
        Time
        <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
          {TIMES.map((m) => (
            <option key={m} value={m}>
              {formatTime(m)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="banner-btn" disabled={!valid}>
        Apply
      </button>
      <button type="button" className="banner-btn" onClick={onCancel}>
        Cancel
      </button>
      {!valid && (
        <span id={errorId} role="alert" className="clock-editor-error">
          Day must be 1 to 28.
        </span>
      )}
    </form>
  )
}
