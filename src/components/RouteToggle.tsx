import { useSave } from '../state/SaveContext'
import type { Route } from '../data/types'

export default function RouteToggle() {
  const { save, setRoute } = useSave()
  const route = save.profile.route
  return (
    <label>
      Route{' '}
      <select value={route} onChange={(e) => setRoute(e.target.value as Route)}>
        <option value="community-center">Community Center</option>
        <option value="joja">Joja</option>
      </select>
    </label>
  )
}
