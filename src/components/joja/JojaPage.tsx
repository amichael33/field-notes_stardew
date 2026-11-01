import { JOJA, JOJA_TOTAL, MEMBERSHIP, PROJECTS, gold, jojaId } from '../../data/joja'
import type { Season } from '../../data/types'
import ItemIcon from '../ItemIcon'
import { useSave } from '../../state/SaveContext'

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface StockItem {
  name: string
  price: number
  note?: string
}

function StockList({ items }: { items: StockItem[] }) {
  return (
    <ul className="joja-stock">
      {items.map((i) => (
        <li key={i.name}>
          <ItemIcon name={i.name} />
          <span>
            {i.name}
            {i.note ? ` (${i.note})` : ''} <span className="when">{gold(i.price)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Step({
  id,
  name,
  price,
  description,
}: {
  id: string
  name: string
  price: number
  description: string
}) {
  const { save, toggle } = useSave()
  const key = jojaId(id)
  const done = save.checked.includes(key)
  return (
    <li className={done ? 'goal-row done' : 'goal-row'}>
      <div>
        <label className="row-check goal-done">
          <input type="checkbox" checked={done} onChange={() => toggle(key)} />
          <strong>{name}</strong>
        </label>{' '}
        <span className="tag joja-price">{gold(price)}</span>
        <p className="row-detail">{description}</p>
      </div>
    </li>
  )
}

export default function JojaPage() {
  const { save } = useSave()
  const now = save.clock?.season ?? 'spring'
  // The current season first, then the rest in calendar order; winter has no stock.
  const order = [now, ...SEASONS.filter((s) => s !== now)]
  const stock = JOJA.stock as Record<string, StockItem[]>
  return (
    <section>
      <h1>Community Center</h1>
      <section className="card" aria-label="JojaMart">
        <h2>JojaMart</h2>
        <p>Bundles are not used on the Joja route. Here is what JojaMart offers instead.</p>
        <ul className="joja-facts">
          <li>
            <strong>Open:</strong> {JOJA.store.hours}. <strong>Closed:</strong> {JOJA.store.closed}.
          </li>
          <li>
            <strong>Where:</strong> {JOJA.store.address}. <strong>Manager:</strong> {JOJA.store.manager}.
          </li>
          {JOJA.store.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
      <section className="card" aria-label="Membership and projects">
        <h2>Membership and projects</h2>
        <p className="when">
          {gold(JOJA_TOTAL)} in all, or {gold(JOJA_TOTAL + MEMBERSHIP.price)} with the membership. One
          purchase per day.
        </p>
        <ul className="goal-list" aria-label="Membership">
          <Step {...MEMBERSHIP} description={JOJA.store.membership.description} />
        </ul>
        <ul className="goal-list" aria-label="Community Development Projects">
          {PROJECTS.map((p) => (
            <Step key={p.id} {...p} />
          ))}
        </ul>
      </section>
      <section className="card" aria-label="Stock and prices">
        <h2>Stock and prices</h2>
        <h3>Always in stock</h3>
        <StockList items={JOJA.stock.permanent} />
        {order.map((s) =>
          stock[s].length === 0 ? null : (
            <div key={s}>
              <h3>{cap(s)} stock</h3>
              <StockList items={stock[s]} />
            </div>
          ),
        )}
        <h3>Winter stock</h3>
        <p className="when">JojaMart sells no seeds in winter.</p>
      </section>
      <section className="card" aria-label="Not sold at JojaMart">
        <h2>Not sold at JojaMart</h2>
        <ul>
          {JOJA.notSold.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <h3>Good to know</h3>
        <ul>
          {JOJA.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </section>
  )
}
