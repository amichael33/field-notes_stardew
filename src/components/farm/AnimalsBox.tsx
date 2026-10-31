import { useState } from 'react'
import { ANIMAL_TYPES, BUILDINGS } from '../../data/farm-lookup'
import { capacityUsage } from '../../data/farm'
import { useSave } from '../../state/SaveContext'
import FarmSprite from './FarmSprite'
import FarmTile from './FarmTile'

const MAX_PER_TYPE = 99

export default function AnimalsBox() {
  const { save, updateFarm } = useSave()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const { animals, buildings: owned } = save.farm
  // Known types first, then any type in the save that this app does not know.
  const known = ANIMAL_TYPES.map((a) => a.type)
  const types = [
    ...known.filter((type) => (animals[type] ?? 0) > 0),
    ...Object.keys(animals).filter((type) => !known.includes(type) && animals[type] > 0),
  ]
  const selected = types.find((type) => type === selectedType)
  const addable = ANIMAL_TYPES.filter((a) => (owned[a.house] ?? 0) >= 1)
  const houses = capacityUsage(save.farm, BUILDINGS, ANIMAL_TYPES).filter(
    (h) => (owned[h.house] ?? 0) > 0 || h.used > 0,
  )

  const change = (type: string, delta: number) =>
    updateFarm((f) => {
      const next = Math.min(MAX_PER_TYPE, (f.animals[type] ?? 0) + delta)
      const rest = { ...f.animals }
      if (next <= 0) delete rest[type]
      else rest[type] = next
      return { ...f, animals: rest }
    })

  return (
    <section className="aside-card">
      <h2>Animals</h2>
      <div className="farm-tiles">
        {types.map((type) => (
          <FarmTile
            key={type}
            label={`${type}, ${animals[type]}`}
            count={animals[type]}
            selected={type === selectedType}
            onClick={() => {
              setSelectedType(type === selectedType ? null : type)
              setPicking(false)
            }}
          >
            <FarmSprite kind="animal" id={type} />
          </FarmTile>
        ))}
        <FarmTile
          label="Add an animal"
          selected={picking}
          disabled={addable.length === 0}
          onClick={() => {
            setPicking(!picking)
            setSelectedType(null)
          }}
          className="no-print"
        >
          <span className="farm-tile-plus" aria-hidden="true">
            +
          </span>
        </FarmTile>
      </div>
      {houses.length === 0 && <p>Build a coop or barn to add animals.</p>}
      {houses.map((h) => (
        <p key={h.house}>
          <span>{`${h.house} ${h.used} of ${h.max}`}</span>
          {h.max === 0 ? (
            <strong> {`No ${h.house.toLowerCase()} built`}</strong>
          ) : (
            h.used > h.max && <strong> Over capacity</strong>
          )}
        </p>
      ))}
      {selected && (
        <div role="region" aria-label={`${selected} actions`} className="farm-actions no-print">
          <button
            type="button"
            className="btn-small"
            aria-label={`Add one ${selected}`}
            onClick={() => change(selected, 1)}
          >
            +1
          </button>
          <button
            type="button"
            className="btn-small"
            aria-label={`Remove one ${selected}`}
            onClick={() => {
              if (animals[selected] === 1) setSelectedType(null)
              change(selected, -1)
            }}
          >
            −1
          </button>
        </div>
      )}
      {picking && addable.length > 0 && (
        <div className="farm-picker no-print">
          <ul role="list" aria-label="Animals to add" className="farm-grid-list">
            {addable.map((a) => (
              <li key={a.type}>
                <button
                  type="button"
                  className="farm-pick"
                  aria-label={`Add ${a.type}`}
                  onClick={() => change(a.type, 1)}
                >
                  <FarmSprite kind="animal" id={a.type} />
                  <span>{a.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
