import type { BuildTarget } from '../../data/farm-build'
import ItemIcon from '../ItemIcon'
import { gold } from './goal'

/** 1500 is 1.5k, 40000 is 40k: short enough for the corner of a tile. */
const short = (n: number) => (n >= 1000 ? `${Number((n / 1000).toFixed(1))}k` : String(n))

export function CostTiles({
  money,
  materials,
}: {
  money: number
  materials: { item: string; amount: number }[]
}) {
  if (money <= 0 && materials.length === 0) return null
  return (
    <ul className="icon-grid" role="list">
      {money > 0 && (
        <li
          className="item-icon-only"
          role="listitem"
          aria-label={gold(money)}
          title={gold(money)}
          data-tip={gold(money)}
          tabIndex={0}
          style={{ cursor: 'default' }}
        >
          <ItemIcon name={gold(money)} />
          <span className="item-stack">{short(money)}</span>
        </li>
      )}
      {materials.map((m) => {
        const label = `${m.amount} ${m.item}`
        return (
          <li
            key={m.item}
            className="item-icon-only"
            role="listitem"
            aria-label={label}
            title={label}
            data-tip={label}
            tabIndex={0}
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

export default function GoalMaterials({ target }: { target: BuildTarget }) {
  return <CostTiles money={target.cost} materials={target.materials} />
}
