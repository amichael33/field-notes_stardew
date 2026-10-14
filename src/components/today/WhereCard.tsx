import type { PathStep, Villager } from '../../data/types'
import { peopleToVisit } from '../../data/selectors'
import { stepWhen } from '../../data/when'
import { useSave } from '../../state/SaveContext'
import villagersJson from '../../data/villagers.json'

const villagers = villagersJson as Villager[]

export default function WhereCard({ steps }: { steps: PathStep[] }) {
  const { save } = useSave()
  const people = peopleToVisit(steps, save.checked, villagers)
  if (people.length === 0) return null
  return (
    <section className="card aside-card">
      <h2>Where is everyone</h2>
      <ul aria-label="People to visit">
        {people.map(({ who, step }) => {
          const when = stepWhen(step)
          return (
            <li key={`${who}-${step.order}`}>
              <strong>{who}</strong>: {step.title}
              {when && <span className="when"> ({when})</span>}
            </li>
          )
        })}
      </ul>
      <p className="when">Locations by time come with the schedule data.</p>
    </section>
  )
}
