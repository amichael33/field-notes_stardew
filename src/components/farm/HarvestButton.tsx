import { cropById } from '../../data/farm-lookup'
import { harvest } from '../../data/farm'
import type { SeasonDay } from '../../data/calendar'
import type { PlantedCrop } from '../../data/types'
import { useSave } from '../../state/SaveContext'

const SPRING_1: SeasonDay = { season: 'spring', day: 1 }

/** The "Harvested" button: a one-off crop is removed, a regrowing crop restarts its regrow timer today. */
export default function HarvestButton({ entry }: { entry: PlantedCrop }) {
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
