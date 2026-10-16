import type { ReactNode } from 'react'
import type { PlanGoal, PlanTask } from '../../data/types'
import { PLANS, missedTasks, planForDay, planTaskId, yearComplete } from '../../data/plans'
import { formatTime } from '../../state/clock'
import { useSave } from '../../state/SaveContext'
import ItemIcon from '../ItemIcon'
import CatchUp from './CatchUp'

export function PlanTaskRow({ goal, task }: { goal: PlanGoal; task: PlanTask }) {
  const { save, toggle } = useSave()
  const id = planTaskId(goal, task)
  const checked = save.checked.includes(id)
  const where = [task.place, task.time !== undefined ? formatTime(task.time) : undefined]
    .filter(Boolean)
    .join(' at ')
  return (
    <li className={checked ? 'path-row done' : 'path-row'}>
      <div className="row-body">
        <label className="row-check">
          <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
          {task.item && <ItemIcon name={task.item} />}
          <strong>{task.text}</strong>
        </label>
        {where && <p className="row-detail">{where}</p>}
      </div>
    </li>
  )
}

export default function DayPlanCard({ fallback }: { fallback: ReactNode }) {
  const { save } = useSave()
  const { clock, checked, profile } = save
  if (yearComplete(clock)) {
    return (
      <section className="card">
        <h2>Year 1 complete</h2>
      </section>
    )
  }
  const goal = profile.planGoal
  const plan = planForDay(
    goal,
    profile.route,
    clock?.season ?? 'spring',
    clock?.day ?? 1,
    clock?.weather ?? 'sunny',
    PLANS,
  )
  if (!plan) return <>{fallback}</>
  const done = plan.tasks.filter((t) => checked.includes(planTaskId(goal, t))).length
  const missed = missedTasks(goal, profile.route, clock, checked, PLANS)
  return (
    <section className="card path-card">
      <div className="path-title">
        <h2>Day plan</h2>
        <span className="tag">
          {done}/{plan.tasks.length}
        </span>
      </div>
      <p>{plan.day.why}</p>
      {plan.raining && <p className="rain-banner">Rainy day plan</p>}
      <ol aria-label="Day tasks" className="path-list">
        {plan.tasks.map((t) => (
          <PlanTaskRow key={t.id} goal={goal} task={t} />
        ))}
      </ol>
      <CatchUp groups={missed} />
    </section>
  )
}
