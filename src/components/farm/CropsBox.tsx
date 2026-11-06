import { useState } from 'react'
import { CROPS, cropById } from '../../data/farm-lookup'
import { cropOptions, harvestDate, harvestStatus } from '../../data/farm'
import { daysUntil } from '../../data/calendar'
import type { SeasonDay } from '../../data/calendar'
import type { PlantedCrop } from '../../data/types'
import { useSave } from '../../state/SaveContext'
import ItemIcon from '../ItemIcon'
import FarmTile from './FarmTile'
import HarvestButton from './HarvestButton'
import PlantCost from './PlantCost'

const SPRING_1: SeasonDay = { season: 'spring', day: 1 }
const MAX_COUNT = 99999
const title = (date: SeasonDay) => `${date.season[0].toUpperCase()}${date.season.slice(1)} ${date.day}`

export default function CropsBox() {
  const { save, updateFarm } = useSave()
  const now = save.clock ?? SPRING_1
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [countText, setCountText] = useState('1')
  // Typed numbers are kept as typed until the box loses focus; anything unusable counts as 1.
  const count = Math.min(MAX_COUNT, Math.max(1, parseInt(countText, 10) || 1))

  const entries = save.farm.crops
  const nameOf = (entry: PlantedCrop) => cropById(entry.crop)?.name ?? 'Unknown crop'
  const selected = entries.find((e) => e.id === selectedId)
  const chosenOption = cropOptions(CROPS, now.season).find((o) => o.id === chosen)
  const chosenSeeds = chosen ? cropById(chosen)?.seeds : undefined

  const readyText = (entry: PlantedCrop) => {
    const crop = cropById(entry.crop)
    if (!crop) return ''
    const status = harvestStatus(entry, crop, save.clock)
    if (status === 'season-over') return 'Died at the season change'
    if (status === 'wont-finish') return 'Will not finish this season'
    if (status === 'ready') return 'Ready now'
    const date = harvestDate(entry, crop)
    const days = daysUntil(date, now)
    return `Ready ${title(date)} (in ${days} ${days === 1 ? 'day' : 'days'})`
  }

  const plantChosen = () => {
    if (!chosen) return
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    updateFarm((f) => ({
      ...f,
      crops: [...f.crops, { id, crop: chosen, count, season: now.season, day: now.day }],
    }))
    setChosen(null)
    setPicking(false)
    setCountText('1')
  }

  const togglePicking = () => {
    setPicking(!picking)
    setSelectedId(null)
    setChosen(null)
    setCountText('1')
  }

  const selectedName = selected ? nameOf(selected) : ''
  const selectedCrop = selected ? cropById(selected.crop) : undefined

  return (
    <section className="aside-card">
      <h2>Crops planted</h2>
      <div className="farm-tiles">
        {entries.map((e) => {
          const name = nameOf(e)
          return (
            <FarmTile
              key={e.id}
              label={`${name}, ${e.count} planted`}
              count={e.count}
              selected={e.id === selectedId}
              onClick={() => {
                setSelectedId(e.id === selectedId ? null : e.id)
                setPicking(false)
                setChosen(null)
              }}
            >
              <ItemIcon name={name} />
            </FarmTile>
          )
        })}
        <FarmTile label="Plant a crop" selected={picking} onClick={togglePicking} className="no-print">
          <span className="farm-tile-plus" aria-hidden="true">
            +
          </span>
        </FarmTile>
      </div>
      {selected && (
        <div role="region" aria-label={`${selectedName} actions`} className="farm-actions no-print">
          <strong>{selectedName}</strong>
          {selectedCrop && <span>{readyText(selected)}</span>}
          {selectedCrop && harvestStatus(selected, selectedCrop, save.clock) === 'ready' && (
            <HarvestButton entry={selected} />
          )}
          <button
            type="button"
            className="btn-small"
            onClick={() => {
              updateFarm((f) => ({
                ...f,
                crops: f.crops.filter((c) => c.id !== selected.id),
              }))
              setSelectedId(null)
            }}
          >
            Remove
          </button>
        </div>
      )}
      {picking && (
        <div className="farm-picker no-print">
          <ul role="list" aria-label="Crops to plant" className="farm-grid-list">
            {cropOptions(CROPS, now.season).map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="farm-pick"
                  aria-pressed={o.id === chosen}
                  onClick={() => setChosen(o.id)}
                >
                  <ItemIcon name={o.picture} />
                  <span>{o.label}</span>
                </button>
              </li>
            ))}
          </ul>
          {chosenOption && (
            <div className="farm-actions plant-pick">
              <strong>{chosenOption.label}</strong>
              <div className="count-row">
              <button
                type="button"
                className="btn-small"
                onClick={() => setCountText(String(Math.max(1, count - 1)))}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_COUNT}
                className="count-input"
                aria-label="Number to plant"
                value={countText}
                onChange={(e) => setCountText(e.target.value)}
                onBlur={() => setCountText(String(count))}
              />
              <button
                type="button"
                className="btn-small"
                onClick={() => setCountText(String(Math.min(MAX_COUNT, count + 1)))}
              >
                +
              </button>
              <button type="button" className="btn-small" onClick={plantChosen}>
                Plant
              </button>
              </div>
            </div>
          )}
          {chosenOption && chosenSeeds && <PlantCost seeds={chosenSeeds} count={count} />}
        </div>
      )}
    </section>
  )
}
