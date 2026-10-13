import { useAppState } from '../state/AppState'
import type { Route } from '../data/types'

export default function RouteToggle() {
  const { route, setRoute } = useAppState()
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
