import type { ReactNode } from 'react'

export default function FarmTile({
  label,
  count,
  selected = false,
  onClick,
  children,
}: {
  label: string
  count?: number
  selected?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className="farm-tile" aria-label={label} aria-pressed={selected} onClick={onClick}>
      {children}
      {count !== undefined && <span className="farm-tile-count">{count}</span>}
    </button>
  )
}
