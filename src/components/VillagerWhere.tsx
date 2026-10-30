import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

function MapPopup({
  name,
  loc,
  clock,
  anchor,
  onClose,
  popupRef,
}: {
  name: string
  loc: Location
  clock: Clock
  anchor: DOMRect
  onClose: () => void
  popupRef: React.RefObject<HTMLDivElement>
}) {
  const atHome = loc.since === null
  const width = Math.min(560, window.innerWidth - 16)
  const height = (width * MAP_SIZE.h) / MAP_SIZE.w + 84
  // Cover the button so the pointer is already over the map; leaving the map closes it.
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8))
  const top = Math.max(8, Math.min(anchor.top, window.innerHeight - height - 8))
  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-label={`Where ${name} is`}
      className="map-popup"
      style={{ left, top, width }}
      onMouseLeave={onClose}
    >
      <div className="map-frame">
        <img src={`map/${clock.season}.png`} alt={`Stardew Valley map in ${clock.season}`} className="map-img" />
        {!atHome && <Marker place={loc.place} kind="now" label="Now" />}
        {loc.next && <Marker place={loc.next.place} kind="next" label="Next" />}
      </div>
      <ul className="map-legend">
        <li>
          <strong>{name} now:</strong> {atHome ? 'At home' : `${loc.place} since ${formatTime(loc.since as number)}`}
        </li>
        {loc.next && (
          <li>
            <strong>Next:</strong> {loc.next.place} at {formatTime(loc.next.time)}
          </li>
        )}
      </ul>
    </div>,
    document.body,
  )
}

/** Where a villager is now and where they go next, from the game clock. Click for the map. */
export default function VillagerWhere({ name }: { name: string }) {
  const { save } = useSave()
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const clock = save.clock

  // Tapping elsewhere or pressing Escape closes the map (for touch and keyboard).
  useEffect(() => {
    if (!anchor) return
    const close = () => setAnchor(null)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!popup.current?.contains(t) && !button.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
    }
  }, [anchor])

  if (!clock) return null
  const loc = locate(name, clock)
  if (!loc) return <p className="when where-none">No schedule data.</p>
  const now = loc.since === null ? 'At home' : `${loc.place} since ${formatTime(loc.since)}`
  const next = loc.next ? ` Next: ${loc.next.place} at ${formatTime(loc.next.time)}.` : ''
  const show = () => button.current && setAnchor(button.current.getBoundingClientRect())
  return (
    <>
      <button
        ref={button}
        type="button"
        className="where-btn"
        aria-label={`${name} location: ${now}.${next} Show on the map.`}
        onMouseEnter={show}
        onFocus={show}
        onClick={show}
        onMouseLeave={(e) => {
          if (!popup.current?.contains(e.relatedTarget as Node)) setAnchor(null)
        }}
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
      {anchor && (
        <MapPopup
          name={name}
          loc={loc}
          clock={clock}
          anchor={anchor}
          popupRef={popup}
          onClose={() => setAnchor(null)}
        />
      )}
    </>
  )
}
