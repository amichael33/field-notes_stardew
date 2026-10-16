import { useId } from 'react'
import { useSave } from '../state/SaveContext'
import { PLAN_GOALS } from '../data/plans'
import type { PlanGoal } from '../data/types'

export default function PlanGoalPicker() {
  const { save, setPlanGoal } = useSave()
  const goal = save.profile.planGoal
  const descId = useId()
  const current = PLAN_GOALS.find((g) => g.id === goal)
  return (
    <>
      <label>
        Plan goal{' '}
        <select value={goal} aria-describedby={descId} onChange={(e) => setPlanGoal(e.target.value as PlanGoal)}>
          {PLAN_GOALS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <small id={descId}>{current?.description}</small>
    </>
  )
}
