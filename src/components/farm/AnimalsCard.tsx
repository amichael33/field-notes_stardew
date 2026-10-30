import { useState } from 'react'
import { ANIMAL_TYPES, BUILDINGS } from '../../data/farm-lookup'
import { capacityUsage, houseCapacity } from '../../data/farm'
import { useSave } from '../../state/SaveContext'
import ItemIcon from '../ItemIcon'

export default function AnimalsCard() {
  const { save, updateFarm } = useSave()
  const farm = save.farm
  const [picked, setPicked] = useState('')
  const [name, setName] = useState('')
  const typeName = ANIMAL_TYPES.some((a) => a.type === picked) ? picked : (ANIMAL_TYPES[0]?.type ?? '')
  const animalType = ANIMAL_TYPES.find((a) => a.type === typeName)
  const house = animalType?.house ?? 'Coop'
  const homes = (['Coop', 'Barn'] as const).filter(
    (h) => h === house && houseCapacity(BUILDINGS, farm.buildings, h) > 0,
  )
  const usage = capacityUsage(farm, BUILDINGS).filter((u) => u.max > 0 || u.used > 0)

  return (
    <section className="card" aria-label="Animals">
      <h2>Animals</h2>
      <form
        className="add-task no-print farm-form"
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = name.trim()
          if (!animalType || !trimmed || homes.length === 0) return
          const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
          updateFarm((f) => ({
            ...f,
            animals: [...f.animals, { id, type: animalType.type, name: trimmed, home: homes[0] }],
          }))
          setName('')
        }}
      >
        <select aria-label="Animal type" value={typeName} onChange={(e) => setPicked(e.target.value)}>
          {ANIMAL_TYPES.map((a) => (
            <option key={a.type} value={a.type}>
              {a.type}
            </option>
          ))}
        </select>
        <input
          type="text"
          aria-label="Animal name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select aria-label="Home" disabled={homes.length === 0}>
          {homes.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">
          Add animal
        </button>
        {homes.length === 0 && <span className="when">{`Build a ${house} first`}</span>}
      </form>
      {usage.length > 0 && (
        <ul aria-label="Capacity" className="path-list">
          {usage.map((u) => (
            <li key={u.house} className="path-row plan-row">
              <span className="row-check">
                <strong>{`${u.house} ${u.used} of ${u.max}`}</strong>
              </span>
              {u.max === 0 ? (
                <span className="when">No building</span>
              ) : (
                u.used > u.max && <span className="when">Over capacity</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {farm.animals.length > 0 && (
        <ul aria-label="Animals on the farm" className="path-list">
          {farm.animals.map((a) => {
            const known = ANIMAL_TYPES.some((t) => t.type === a.type)
            return (
              <li key={a.id} className="path-row plan-row">
                <span className="row-check">
                  <ItemIcon name={known ? a.type : 'Unknown animal'} />
                  <strong>{known ? `${a.name}, ${a.type}, ${a.home}` : `Unknown animal (${a.name})`}</strong>
                </span>
                <button
                  type="button"
                  className="btn-small no-print"
                  aria-label={`Remove ${a.name}`}
                  onClick={() => updateFarm((f) => ({ ...f, animals: f.animals.filter((x) => x.id !== a.id) }))}
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
