import type { PlanTask, Season } from '../../data/types'
import { useSave } from '../../state/SaveContext'
import { PlanTaskRow } from './DayPlanCard'

const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
}

export default function CatchUp({
  groups,
}: {
  groups: { season: Season; day: number; tasks: PlanTask[] }[]
}) {
  const { save } = useSave()
  if (groups.length === 0) return null
  const goal = save.profile.planGoal
  const count = groups.reduce((n, g) => n + g.tasks.length, 0)
  return (
    <details className="catch-up">
      <summary>Catch-up ({count})</summary>
      {groups.map((g) => (
        <div key={`${g.season}-${g.day}`}>
          <h3>
            {SEASON_LABEL[g.season]} {g.day}
          </h3>
          <ul className="path-list">
            {g.tasks.map((t) => (
              <PlanTaskRow key={t.id} goal={goal} task={t} />
            ))}
          </ul>
        </div>
      ))}
    </details>
  )
}
