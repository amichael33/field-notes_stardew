import { useState } from 'react'
import { CROPS, cropById } from '../../data/farm-lookup'
import { harvest, harvestDate, harvestStatus } from '../../data/farm'
import { SEASONS, daysUntil } from '../../data/calendar'
import type { SeasonDay } from '../../data/calendar'
import type { PlantedCrop, Season } from '../../data/types'
import { useSave } from '../../state/SaveContext'
import ItemIcon from '../ItemIcon'

const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
}

const SPRING_1: SeasonDay = { season: 'spring', day: 1 }

/** The "Harvested" button: a one-off crop is removed, a regrowing crop restarts its regrow timer today. */
export function HarvestButton({ entry }: { entry: PlantedCrop }) {
  const { save, updateFarm } = useSave()
  const crop = cropById(entry.crop)
  if (!crop) return null
  const now = save.clock ?? SPRING_1
  return (
    <button
      type="button"
      className="btn-small no-print"
      aria-label={`Harvest ${crop.name}`}
      onClick={() =>
        updateFarm((f) => ({
          ...f,
          crops: f.crops.flatMap((c) => {
            if (c.id !== entry.id) return [c]
            const next = harvest(c, crop, now)
            return next ? [next] : []
          }),
        }))
      }
    >
      Harvested
    </button>
  )
}

function Row({ entry }: { entry: PlantedCrop }) {
  const { save, updateFarm } = useSave()
  const crop = cropById(entry.crop)
  const remove = (label: string) => (
    <button
      type="button"
      className="btn-small no-print"
      aria-label={`Remove ${label}`}
      onClick={() => updateFarm((f) => ({ ...f, crops: f.crops.filter((c) => c.id !== entry.id) }))}
    >
      Remove
    </button>
  )
  if (!crop) {
    return (
      <li className="path-row plan-row">
        <span className="row-check">
          <ItemIcon name="Unknown crop" />
          <strong>Unknown crop</strong>
        </span>
        {remove('unknown crop')}
      </li>
    )
  }
  const date = harvestDate(entry, crop)
  const status = harvestStatus(entry, crop, save.clock)
  const left = daysUntil(date, save.clock ?? SPRING_1)
  const when =
    status === 'season-over'
      ? 'Died at the season change'
      : status === 'wont-finish'
        ? 'Will not finish this season'
        : status === 'ready'
          ? 'Ready now'
          : `ready ${SEASON_LABEL[date.season]} ${date.day} (in ${left} ${left === 1 ? 'day' : 'days'})`
  return (
    <li className="path-row plan-row">
      <span className="row-check">
        <ItemIcon name={crop.name} />
        <strong>{`${entry.count} ${crop.name}, ${when}`}</strong>
      </span>
      {status !== 'wont-finish' && status !== 'season-over' && <HarvestButton entry={entry} />}
      {remove(crop.name)}
    </li>
  )
}

export default function CropsCard() {
  const { save, updateFarm } = useSave()
  const season = save.clock?.season ?? 'spring'
  const options = CROPS.filter((c) => c.seasons.includes(season))
  const [picked, setPicked] = useState('')
  const [countText, setCountText] = useState('1')
  const [changing, setChanging] = useState(false)
  const [plantedSeason, setPlantedSeason] = useState<Season | null>(null)
  const [dayText, setDayText] = useState<string | null>(null)
  const cropId = options.some((c) => c.id === picked) ? picked : (options[0]?.id ?? '')
  const count = Math.floor(Number(countText))
  const clockDay = save.clock?.day ?? 1
  const day = Math.floor(Number(dayText ?? clockDay))
  const dayValid = day >= 1 && day <= 28
  const planted: SeasonDay = {
    season: plantedSeason ?? save.clock?.season ?? 'spring',
    day: dayValid ? day : clockDay,
  }

  return (
    <section className="card" aria-label="Crops in the ground">
      <h2>Crops in the ground</h2>
      <form
        className="add-task no-print farm-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!cropId || !(count >= 1) || !dayValid) return
          const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
          updateFarm((f) => ({
            ...f,
            crops: [...f.crops, { id, crop: cropId, count, season: planted.season, day: planted.day }],
          }))
          setCountText('1')
        }}
      >
        <select aria-label="Crop" value={cropId} onChange={(e) => setPicked(e.target.value)}>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          aria-label="Count"
          min={1}
          value={countText}
          onChange={(e) => setCountText(e.target.value)}
        />
        <button type="submit" className="btn">
          Add crop
        </button>
        <span className="when">
          Planted {SEASON_LABEL[planted.season]} {planted.day}
        </span>
        <button type="button" className="btn-small" onClick={() => setChanging((v) => !v)}>
          Change date
        </button>
        {changing && (
          <>
            <select
              aria-label="Planted season"
              value={planted.season}
              onChange={(e) => setPlantedSeason(e.target.value as Season)}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              type="number"
              aria-label="Planted day"
              min={1}
              max={28}
              value={dayText ?? String(clockDay)}
              onChange={(e) => setDayText(e.target.value)}
            />
          </>
        )}
      </form>
      {save.farm.crops.length > 0 && (
        <ul aria-label="Planted crops" className="path-list">
          {save.farm.crops.map((entry) => (
            <Row key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
      <p className="when">Only what you record here is tracked.</p>
    </section>
  )
}
