import type { PathStep } from '../../data/types'
import { firstUnchecked } from '../../data/selectors'
import { PLANS, nextPlanTask } from '../../data/plans'
import GoalMaterials from '../farm/GoalMaterials'
import { gold, useGoalTarget } from '../farm/goal'
import { useSave } from '../../state/SaveContext'

export default function NextGoalCard({ steps }: { steps: PathStep[] }) {
  const { save } = useSave()
  const planned = nextPlanTask(
    save.profile.planGoal,
    save.profile.route,
    save.clock,
    save.checked,
    PLANS,
  )
  const building = useGoalTarget()
  const goals = steps.filter((s) => s.order === 9 || s.order === 10)
  const next = firstUnchecked(goals, save.checked)
  return (
    <section className="card aside-card">
      <h2>Next goal</h2>
      {planned ? (
        <>
          <p className="goal-title">
            <strong>{planned.task.text}</strong>
          </p>
          <p className="row-detail">{planned.day.why}</p>
        </>
      ) : next ? (
        <>
          <p className="goal-title">
            <strong>{next.title}</strong>
          </p>
          <p className="row-detail">{next.detail}</p>
        </>
      ) : (
        <p>All goals done</p>
      )}
      {building && (
        <>
          <p className="row-detail">{`Building goal: ${building.name}, ${gold(building.cost)}`}</p>
          <GoalMaterials target={building} />
        </>
      )}
    </section>
  )
}
