import type { ReactNode } from 'react'

export default function FarmTile({
  label,
  count,
  selected = false,
  onClick,
  className,
  disabled = false,
  children,
}: {
  label: string
  count?: number
  selected?: boolean
  onClick: () => void
  className?: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={className ? `farm-tile ${className}` : 'farm-tile'}
      aria-label={label}
      data-tip={label}
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      {count !== undefined && <span className="farm-tile-count">{count}</span>}
    </button>
  )
}
