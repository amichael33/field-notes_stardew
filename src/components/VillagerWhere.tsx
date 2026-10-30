import { useEffect, useRef, useState } from 'react'
import { MAP_SIZE, PLACE_POSITIONS } from '../data/map-places'
import { locationAt, scheduleFor } from '../data/schedules'
import type { Clock, Location } from '../data/types'
import { NIGHT, formatTime } from '../state/clock'
import { useSave } from '../state/SaveContext'

function locate(name: string, clock: Clock): Location | null {
  const stops = scheduleFor(name, clock.season, clock.day, clock.weather === 'rain')
  if (!stops) return null
  return clock.status === 'ended'
    ? { ...locationAt(stops, NIGHT), next: undefined }
    : locationAt(stops, clock.minutes)
}

function Marker({ place, kind, label }: { place: string; kind: 'now' | 'next'; label: string }) {
  const pos = PLACE_POSITIONS[place]
  if (!pos) return null
  return (
    <span
      className={`map-marker ${kind}`}
      style={{ left: `${(pos.x / MAP_SIZE.w) * 100}%`, top: `${(pos.y / MAP_SIZE.h) * 100}%` }}
      title={`${label}: ${place}`}
    >
      <span className="map-marker-label">{label}</span>
    </span>
  )
}

function MapDialog({ name, loc, clock, onClose }: { name: string; loc: Location; clock: Clock; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  const atHome = loc.since === null
  return (
    <dialog
      ref={ref}
      className="map-dialog"
      aria-label={`Where ${name} is`}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <h3>{name}</h3>
      <div className="map-frame">
        <img src={`map/${clock.season}.png`} alt={`Stardew Valley map in ${clock.season}`} className="map-img" />
        {!atHome && <Marker place={loc.place} kind="now" label="Now" />}
        {loc.next && <Marker place={loc.next.place} kind="next" label="Next" />}
      </div>
      <ul className="map-legend">
        <li>
          <strong>Now:</strong> {atHome ? 'At home' : `${loc.place} since ${formatTime(loc.since as number)}`}
        </li>
        {loc.next && (
          <li>
            <strong>Next:</strong> {loc.next.place} at {formatTime(loc.next.time)}
          </li>
        )}
      </ul>
      <button type="button" className="btn" onClick={onClose}>
        Close
      </button>
    </dialog>
  )
}

/** Where a villager is now and where they go next, from the game clock. Click for the map. */
export default function VillagerWhere({ name }: { name: string }) {
  const { save } = useSave()
  const [open, setOpen] = useState(false)
  const clock = save.clock
  if (!clock) return null
  const loc = locate(name, clock)
  if (!loc) return <p className="when where-none">No schedule data.</p>
  const now = loc.since === null ? 'At home' : `${loc.place} since ${formatTime(loc.since)}`
  const next = loc.next ? ` Next: ${loc.next.place} at ${formatTime(loc.next.time)}.` : ''
  return (
    <>
      <button
        type="button"
        className="where-btn"
        aria-label={`${name} location: ${now}.${next} Show on the map.`}
        onClick={() => setOpen(true)}
      >
        <span>
          <strong>Now:</strong> {now}
        </span>
        {loc.next && (
          <span>
            <strong>Next:</strong> {loc.next.place} at {formatTime(loc.next.time)}
          </span>
        )}
      </button>
      {open && <MapDialog name={name} loc={loc} clock={clock} onClose={() => setOpen(false)} />}
    </>
  )
}
