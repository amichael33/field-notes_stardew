import { useState } from 'react'
import spritesJson from '../../data/farm-sprites.json'

const sprites = spritesJson as { buildings: Record<string, string>; animals: Record<string, string> }

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export default function FarmSprite({
  kind,
  id,
  size = 48,
  label,
  title,
}: {
  kind: 'building' | 'animal'
  id: string
  size?: number
  label?: string
  /** Shown on hover. */
  title?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const map = kind === 'building' ? sprites.buildings : sprites.animals
  // Every house upgrade (Kitchen, Children's room, Cellar) is drawn as the farmhouse.
  const key = kind === 'building' && id.startsWith('house:') ? 'Farmhouse' : id
  const src = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt=""
        title={title}
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
        onError={() => setFailedSrc(src)}
      />
    )
  }
  return (
    <span className="item-tile" aria-hidden="true" title={title} style={{ width: size, height: size }}>
      {initials(label ?? id)}
    </span>
  )
}
