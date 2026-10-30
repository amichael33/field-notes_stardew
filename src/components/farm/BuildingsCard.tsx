import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { BUILDINGS, UPGRADES } from '../../data/farm-lookup'
import { chainLevels } from '../../data/farm'
import type { FarmMaterial } from '../../data/types'
import { useSave } from '../../state/SaveContext'
import ItemIcon from '../ItemIcon'

const COUNTED = ['Cabin', 'Fish Pond', 'Stable', 'Junimo Hut', 'Pet Bowl']
const MAX_COUNT = 99

const gold = (n: number) => `${n.toLocaleString('en-US')}g`

function Materials({ materials }: { materials: FarmMaterial[] }) {
  if (materials.length === 0) return null
  return (
    <span className="icon-grid" role="list">
      {materials.map((m) => (
        <span key={m.item} className="item-icon-only" role="listitem" title={`${m.amount} ${m.item}`}>
          <ItemIcon name={m.item} />
          <span className="item-stack">{m.amount}</span>
        </span>
      ))}
    </span>
  )
}

interface Row {
  key: string
  built: boolean
  render: (cls: string) => ReactNode
}

export default function BuildingsCard() {
  const { save, updateFarm } = useSave()
  const owned = save.farm.buildings
  const chains = chainLevels(BUILDINGS)
  const chainRoots = Object.keys(chains).filter((id) => chains[id].length > 1)
  const singles = Object.keys(chains).filter((id) => chains[id].length === 1)
  const houseUpgrades = UPGRADES.filter((u) => u.group === 'house')
  const known = new Set<string>([...Object.keys(chains), ...houseUpgrades.map((u) => u.id)])
  const unknown = Object.keys(owned).filter((id) => !known.has(id) && owned[id] > 0)

  const setOwned = (id: string, value: number) =>
    updateFarm((f) => ({ ...f, buildings: { ...f.buildings, [id]: value } }))

  const rows: Row[] = []

  for (const root of chainRoots) {
    const chain = chains[root]
    const level = Math.min(owned[root] ?? 0, chain.length)
    const next = chain[level]
    rows.push({
      key: root,
      built: level >= chain.length,
      render: (cls) => (
        <li className={`path-row plan-row ${cls}`}>
          <div className="row-body">
            <select
              aria-label={`${chain[0].name} level`}
              value={level}
              onChange={(e) => setOwned(root, Number(e.target.value))}
            >
              <option value={0}>Not built</option>
              {chain.map((b, i) => (
                <option key={b.id} value={i + 1}>
                  {b.name}
                </option>
              ))}
            </select>
            {next && (
              <>
                <p className="row-detail">{`Next: ${next.name}, ${gold(next.cost)}`}</p>
                <Materials materials={next.materials} />
              </>
            )}
          </div>
        </li>
      ),
    })
  }

  for (const id of singles) {
    const b = chains[id][0]
    if (COUNTED.includes(id)) {
      const count = owned[id] ?? 0
      rows.push({
        key: id,
        built: count > 0,
        render: (cls) => (
          <li className={`path-row plan-row ${cls}`}>
            <div className="row-body" role="group" aria-label={b.name}>
              <strong>{`${b.name}: ${count}`}</strong>
              <p className="row-detail">{gold(b.cost)}</p>
              <Materials materials={b.materials} />
            </div>
            <span className="no-print">
              <button
                type="button"
                className="btn-small"
                aria-label={`Remove ${b.name}`}
                disabled={count <= 0}
                onClick={() => setOwned(id, Math.max(0, count - 1))}
              >
                -
              </button>{' '}
              <button
                type="button"
                className="btn-small"
                aria-label={`Add ${b.name}`}
                disabled={count >= MAX_COUNT}
                onClick={() => setOwned(id, Math.min(MAX_COUNT, count + 1))}
              >
                +
              </button>
            </span>
          </li>
        ),
      })
    } else {
      const built = (owned[id] ?? 0) > 0
      rows.push({
        key: id,
        built,
        render: (cls) => (
          <li className={`path-row plan-row ${cls}`}>
            <div className="row-body">
              <label className="row-check">
                <input type="checkbox" checked={built} onChange={() => setOwned(id, built ? 0 : 1)} />
                <strong>{b.name}</strong>
              </label>
              {!built && (
                <>
                  <p className="row-detail">{gold(b.cost)}</p>
                  <Materials materials={b.materials} />
                </>
              )}
            </div>
          </li>
        ),
      })
    }
  }

  houseUpgrades.forEach((u, i) => {
    const built = (owned[u.id] ?? 0) > 0
    const previousBuilt = i === 0 || (owned[houseUpgrades[i - 1].id] ?? 0) > 0
    rows.push({
      key: u.id,
      built,
      render: (cls) => (
        <li className={`path-row plan-row ${cls}`}>
          <div className="row-body">
            <label className="row-check">
              <input
                type="checkbox"
                checked={built}
                disabled={!built && !previousBuilt}
                onChange={() =>
                  updateFarm((f) => {
                    const buildings = { ...f.buildings }
                    houseUpgrades.forEach((h, j) => {
                      if (j === i) buildings[h.id] = built ? 0 : 1
                      else if (built && j > i) buildings[h.id] = 0
                    })
                    return { ...f, buildings }
                  })
                }
              />
              <strong>{u.label}</strong>
            </label>
            {!built && (
              <>
                <p className="row-detail">{gold(u.cost)}</p>
                <Materials materials={u.materials} />
              </>
            )}
          </div>
        </li>
      ),
    })
  })

  const nextKey = rows.find((r) => !r.built)?.key

  return (
    <section className="card" aria-label="Buildings">
      <h2>Buildings</h2>
      <ul className="path-list">
        {rows.map((r) => (
          <Fragment key={r.key}>{r.render(r.key === nextKey ? 'next' : '')}</Fragment>
        ))}
      </ul>
      {unknown.length > 0 && (
        <ul aria-label="Unknown buildings" className="path-list">
          {unknown.map((id) => (
            <li key={id} className="path-row plan-row">
              <span className="row-check">
                <ItemIcon name="Unknown building" />
                <strong>{`Unknown building (${owned[id]})`}</strong>
              </span>
              <button
                type="button"
                className="btn-small no-print"
                onClick={() =>
                  updateFarm((f) => {
                    const buildings = { ...f.buildings }
                    delete buildings[id]
                    return { ...f, buildings }
                  })
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
