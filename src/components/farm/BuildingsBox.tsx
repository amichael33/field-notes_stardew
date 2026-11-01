import { useState } from 'react'
import { BUILDINGS, UPGRADES } from '../../data/farm-lookup'
import { build, buildable, nextUpgrade, ownedTiles, unbuild } from '../../data/farm-build'
import { useSave } from '../../state/SaveContext'
import FarmSprite from './FarmSprite'
import FarmTile from './FarmTile'
import { gold } from './goal'

const GoalStar = () => (
  <span className="farm-goal-star" role="img" aria-label="Goal">
    ★
  </span>
)

export default function BuildingsBox() {
  const { save, updateFarm } = useSave()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const { buildings: owned, goal } = save.farm
  const tiles = ownedTiles(owned, BUILDINGS, UPGRADES)
  const selected = tiles.find((t) => t.key === selectedKey)
  const houseLevel = (key: string) => (key.startsWith('house:') ? Number(key.slice('house:'.length)) : null)
  const topHouse = Math.max(0, ...tiles.map((t) => houseLevel(t.key) ?? 0))
  // Lower house tiles share the one next house upgrade; only the top one offers it.
  const upgradeFor = (key: string) => {
    const level = houseLevel(key)
    return level !== null && level !== topHouse ? undefined : nextUpgrade(key, owned, BUILDINGS, UPGRADES)
  }
  const next = selected ? upgradeFor(selected.key) : undefined
  const targets = buildable(owned, BUILDINGS, UPGRADES)

  const setGoal = (id: string) => updateFarm((f) => ({ ...f, goal: id }))

  return (
    <section className="aside-card">
      <h2>Buildings</h2>
      <div className="farm-tiles">
        {tiles.map((t) => {
          const upcoming = upgradeFor(t.key)
          return (
            <FarmTile
              key={t.key}
              label={t.count > 1 ? `${t.name}, ${t.count} built` : t.name}
              count={t.count > 1 ? t.count : undefined}
              selected={t.key === selectedKey}
              onClick={() => {
                setSelectedKey(t.key === selectedKey ? null : t.key)
                setPicking(false)
              }}
            >
              <FarmSprite kind="building" id={t.id} label={t.name} title={t.name} />
              {goal !== null && upcoming?.id === goal && <GoalStar />}
            </FarmTile>
          )
        })}
        <FarmTile
          label="Build something"
          selected={picking}
          onClick={() => {
            setPicking(!picking)
            setSelectedKey(null)
          }}
          className="no-print"
        >
          <span className="farm-tile-plus" aria-hidden="true">
            +
          </span>
        </FarmTile>
      </div>
      {selected && (
        <div role="region" aria-label={`${selected.name} actions`} className="farm-actions no-print">
          {next && (
            <>
              <button
                type="button"
                className="btn-small"
                onClick={() => updateFarm((f) => build(f, next.id, BUILDINGS, UPGRADES))}
              >
                Upgrade to {next.name}
              </button>
              <button type="button" className="btn-small" onClick={() => setGoal(next.id)}>
                ★ Set {next.name} as goal
              </button>
            </>
          )}
          <button
            type="button"
            className="btn-small"
            onClick={() => {
              updateFarm((f) => unbuild(f, selected.key, BUILDINGS))
              setSelectedKey(null)
            }}
          >
            Remove
          </button>
        </div>
      )}
      {picking && (
        <div className="farm-picker no-print">
          <ul role="list" aria-label="Buildings to build" className="farm-grid-list">
            {targets.map((t) => (
              <li key={t.id} className="farm-pick">
                <FarmSprite kind="building" id={t.id} label={t.name} title={t.name} />
                <span className="farm-pick-name">
                  {t.name}
                  {t.id === goal && <GoalStar />}
                </span>
                <span>{gold(t.cost)}</span>
                <button
                  type="button"
                  className="btn-small"
                  aria-label={`Build ${t.name}`}
                  onClick={() => updateFarm((f) => build(f, t.id, BUILDINGS, UPGRADES))}
                >
                  Build
                </button>
                <button
                  type="button"
                  className="btn-small"
                  aria-label={`Set ${t.name} as goal`}
                  onClick={() => setGoal(t.id)}
                >
                  ★ Goal
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
