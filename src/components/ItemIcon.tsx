import { useState } from 'react'
import iconsJson from '../data/item-icons.json'

const icons = iconsJson as Record<string, string | null>

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export default function ItemIcon({ name }: { name: string }) {
  const [failedName, setFailedName] = useState<string | null>(null)
  const failed = failedName === name
  const known = Object.prototype.hasOwnProperty.call(icons, name)
  const src = known ? icons[name] : undefined

  if (known && src === null) {
    return (
      <svg className="item-coin" width={48} height={48} viewBox="0 0 48 48" role="img" aria-label="Gold">
        <circle cx="24" cy="24" r="20" fill="#f0b33d" stroke="#a8741a" strokeWidth="4" />
        <circle cx="24" cy="24" r="12" fill="none" stroke="#c98f24" strokeWidth="2" />
      </svg>
    )
  }
  if (typeof src === 'string' && !failed) {
    return (
      <img
        className="item-icon"
        src={src}
        alt=""
        width={48}
        height={48}
        onError={() => setFailedName(name)}
      />
    )
  }
  return (
    <span className="item-tile" aria-hidden="true">
      {initials(name)}
    </span>
  )
}
