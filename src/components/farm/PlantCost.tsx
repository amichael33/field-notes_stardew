import { useState } from 'react'
import { FERTILIZERS, SPRINKLERS, plantCost } from '../../data/farm-costs'
import { CostTiles } from './GoalMaterials'
import { gold } from './goal'

/** Gold and materials to plant `count` tiles of a seed: seeds, fertilizer and sprinklers. */
export default function PlantCost({ seeds, count }: { seeds: string; count: number }) {
  const [fertilizer, setFertilizer] = useState('')
  const [sprinkler, setSprinkler] = useState('')
  const cost = plantCost(seeds, count, fertilizer || undefined, sprinkler || undefined)
  const fertilizerNote = FERTILIZERS.find((f) => f.name === fertilizer)?.note
  return (
    <div className="plant-cost" role="group" aria-label="Cost to plant">
      <h3>Cost to plant</h3>
      <p>
        {cost.seedPrice === null
          ? `${seeds}: Pierre's does not sell these.`
          : `${seeds}: ${count.toLocaleString('en-US')} × ${gold(cost.seedPrice)} = ${gold(count * cost.seedPrice)}`}
      </p>
      <div className="farm-actions">
        <label>
          Fertilizer{' '}
          <select value={fertilizer} onChange={(e) => setFertilizer(e.target.value)}>
            <option value="">None</option>
            {FERTILIZERS.map((f) => (
              <option key={f.name} value={f.name}>
                {`${f.name} (${gold(f.price)} each)`}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sprinklers{' '}
          <select value={sprinkler} onChange={(e) => setSprinkler(e.target.value)}>
            <option value="">None</option>
            {SPRINKLERS.map((s) => (
              <option key={s.name} value={s.name}>
                {`${s.name} (waters ${s.covers})`}
              </option>
            ))}
          </select>
        </label>
      </div>
      {fertilizerNote && <p className="when">{fertilizerNote}. One per tile.</p>}
      {cost.sprinklerCount > 0 && (
        <p>{`${cost.sprinklerCount} ${sprinkler}${cost.sprinklerCount === 1 ? '' : 's'} to craft`}</p>
      )}
      <CostTiles money={cost.money} materials={cost.materials} />
    </div>
  )
}
