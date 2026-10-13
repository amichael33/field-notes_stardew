import { useAppState } from '../state/AppState'
import type { Season } from '../data/types'

const SEASONS: (Season | 'all')[] = ['all', 'spring', 'summer', 'fall', 'winter']

export default function SeasonFilter() {
  const { season, setSeason } = useAppState()
  return (
    <label>
      Season{' '}
      <select value={season} onChange={(e) => setSeason(e.target.value as Season | 'all')}>
        {SEASONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  )
}
