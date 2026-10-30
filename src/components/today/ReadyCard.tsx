import { cropById } from '../../data/farm-lookup'
import { harvestDate, harvestStatus } from '../../data/farm'
import { useSave } from '../../state/SaveContext'
import ItemIcon from '../ItemIcon'
import { HarvestButton } from '../farm/CropsCard'

export default function ReadyCard() {
  const { save } = useSave()
  if (!save.clock) return null
  const ready = save.farm.crops.flatMap((entry) => {
    const crop = cropById(entry.crop)
    if (!crop) return []
    const status = harvestStatus(harvestDate(entry, crop), save.clock)
    return status === 'ready' || status === 'tomorrow' ? [{ entry, crop, status }] : []
  })
  if (ready.length === 0) return null
  return (
    <section className="card aside-card">
      <h2>Ready to harvest</h2>
      <ul aria-label="Ready to harvest" className="path-list">
        {ready.map(({ entry, crop, status }) => (
          <li key={entry.id} className="path-row plan-row">
            <span className="row-check">
              <ItemIcon name={crop.name} />
              <strong>{`${entry.count} ${crop.name}, ${status === 'ready' ? 'Ready now' : 'Tomorrow'}`}</strong>
            </span>
            <HarvestButton entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  )
}
