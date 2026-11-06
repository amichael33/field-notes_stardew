import { useSave } from '../state/SaveContext'
import type { Route } from '../data/types'

type Choice = 'community-center' | 'remixed' | 'joja'

export default function RouteToggle() {
  const { save, setRoute, setRemixed } = useSave()
  const { route, remixed } = save.profile
  const value: Choice = route === 'joja' ? 'joja' : remixed ? 'remixed' : 'community-center'
  function choose(choice: Choice) {
    const next: Route = choice === 'joja' ? 'joja' : 'community-center'
    setRoute(next)
    // The Joja route keeps whichever bundle mode was last picked, for when you switch back.
    if (choice !== 'joja') setRemixed(choice === 'remixed')
  }
  return (
    <label>
      Route{' '}
      <select value={value} onChange={(e) => choose(e.target.value as Choice)}>
        <option value="community-center">Community Center</option>
        <option value="remixed">Remixed Community Center</option>
        <option value="joja">Joja</option>
      </select>
    </label>
  )
}
