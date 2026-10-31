import type { BuildTarget } from '../../data/farm-build'
import ItemIcon from '../ItemIcon'

export default function GoalMaterials({ target }: { target: BuildTarget }) {
  if (target.materials.length === 0) return null
  return (
    <ul className="path-list">
      {target.materials.map((m) => (
        <li key={m.item} aria-label={`${m.amount} ${m.item}`}>
          <ItemIcon name={m.item} /> {m.amount}
        </li>
      ))}
    </ul>
  )
}
