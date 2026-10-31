import type { ReactNode } from 'react'

export default function FarmTile({
  label,
  count,
  selected = false,
  onClick,
  className,
  children,
}: {
  label: string
  count?: number
  selected?: boolean
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={className ? `farm-tile ${className}` : 'farm-tile'}
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
      {count !== undefined && <span className="farm-tile-count">{count}</span>}
    </button>
  )
}
