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

type Pin = { place: string; kind: 'now' | 'next'; label: string }

/** Draws the current spot and the next one on the map, joined by an arrow from first to second. */
function MapOverlay({ pins }: { pins: Pin[] }) {
  const placed = pins.filter((p) => PLACE_POSITIONS[p.place])
  const [from, to] = placed
  const a = from && PLACE_POSITIONS[from.place]
  const b = to && PLACE_POSITIONS[to.place]
  const apart = a && b && (a.x !== b.x || a.y !== b.y)
  return (
    <svg className="map-overlay" viewBox={`0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`} aria-hidden="true">
      <defs>
        <marker id="map-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 z" fill="#fff" stroke="#1f3b2d" strokeWidth="0.8" />
        </marker>
      </defs>
      {apart && (
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="#1f3b2d"
          strokeWidth="1.8"
          strokeDasharray="3 2.4"
          markerEnd="url(#map-arrow)"
          opacity="0.85"
        />
      )}
      {placed.map((p) => {
        const pos = PLACE_POSITIONS[p.place]
        const label = !apart && placed.length > 1 ? 'Now and next' : p.label
        // Put each label on the outer side so two close spots never cover each other.
        const other = placed.find((q) => q !== p)
        const left = apart && other ? pos.x <= PLACE_POSITIONS[other.place].x : p.kind === 'now'
        return (
          <g key={p.kind} data-marker={p.kind}>
            {p.kind === 'now' && <circle className="map-pulse" cx={pos.x} cy={pos.y} r="5" />}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="4.6"
              fill={p.kind === 'now' ? '#e0452f' : '#f0b33d'}
              stroke="#fff"
              strokeWidth="1.4"
            />
            <circle cx={pos.x} cy={pos.y} r="5.6" fill="none" stroke="#1f3b2d" strokeWidth="0.8" />
            <text
              className="map-text"
              x={left ? pos.x - 8.5 : pos.x + 8.5}
              y={pos.y + 3}
              textAnchor={left ? 'end' : 'start'}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
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
        <MapOverlay
          pins={[
            ...(atHome ? [] : [{ place: loc.place, kind: 'now' as const, label: 'Now' }]),
            ...(loc.next ? [{ place: loc.next.place, kind: 'next' as const, label: 'Next' }] : []),
          ]}
        />
      </div>
      <ul className="map-legend">
        <li>
          <span className="swatch now" /> <strong>Now:</strong>{' '}
          {atHome ? 'At home' : `${loc.place} since ${formatTime(loc.since as number)}`}
        </li>
        {loc.next ? (
          <li>
            <span className="swatch next" /> <strong>Next:</strong> {loc.next.place} at {formatTime(loc.next.time)}
          </li>
        ) : (
          <li className="when">No more moves today.</li>
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
