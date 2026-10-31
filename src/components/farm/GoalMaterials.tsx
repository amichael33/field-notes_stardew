import type { BuildTarget } from '../../data/farm-build'
import ItemIcon from '../ItemIcon'

export default function GoalMaterials({ target }: { target: BuildTarget }) {
  if (target.materials.length === 0) return null
  return (
    <ul className="icon-grid" role="list">
      {target.materials.map((m) => {
        const label = `${m.amount} ${m.item}`
        return (
          <li
            key={m.item}
            className="item-icon-only"
            role="listitem"
            aria-label={label}
            title={label}
            style={{ cursor: 'default' }}
          >
            <ItemIcon name={m.item} />
            <span className="item-stack">{m.amount}</span>
          </li>
        )
      })}
    </ul>
  )
}
