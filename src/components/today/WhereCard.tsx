import type { PathStep, Villager } from '../../data/types'
import { peopleToVisit } from '../../data/selectors'
import { locationAt, rainMayVary, scheduleFor } from '../../data/schedules'
import { stepWhen } from '../../data/when'
import { NIGHT } from '../../state/clock'
import { useSave } from '../../state/SaveContext'
import villagersJson from '../../data/villagers.json'
import { describeLocation } from './where-text'

const villagers = villagersJson as Villager[]

export default function WhereCard({ steps }: { steps: PathStep[] }) {
  const { save } = useSave()
  const people = peopleToVisit(steps, save.checked, villagers)
  if (people.length === 0) return null
  const clock = save.clock
  const raining = clock?.weather === 'rain'

  const rows = people.map(({ who, step }) => {
    let where: string | null = null
    if (clock) {
      const stops = scheduleFor(who, clock.season, clock.day, raining)
      if (stops) {
        const loc =
          clock.status === 'ended'
            ? { ...locationAt(stops, NIGHT), next: undefined }
            : locationAt(stops, clock.minutes)
        where = describeLocation(loc)
      }
    }
    return { who, step, where, vary: clock ? rainMayVary(who, raining) : false }
  })
  // Stable sort: people the clock places somewhere come first.
  rows.sort((a, b) => Number(b.where !== null) - Number(a.where !== null))

  return (
    <section className="card aside-card">
      <h2>Where is everyone</h2>
      <ul aria-label="People to visit">
        {rows.map(({ who, step, where, vary }) => {
          const when = stepWhen(step)
          return (
            <li key={`${who}-${step.order}`}>
              <strong>{who}</strong>: {where && <>{where}. </>}
              {step.title}
              {when && <span className="when"> ({when})</span>}
              {vary && <span className="when"> (may differ on rainy days)</span>}
            </li>
          )
        })}
      </ul>
      {!clock && <p className="when">Press Start day to see where they are.</p>}
    </section>
  )
}
