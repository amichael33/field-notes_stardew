import type { PathStep } from '../../data/types'
import { firstUnchecked } from '../../data/selectors'
import { useSave } from '../../state/SaveContext'

export default function NextGoalCard({ steps }: { steps: PathStep[] }) {
  const { save } = useSave()
  const goals = steps.filter((s) => s.order === 9 || s.order === 10)
  const next = firstUnchecked(goals, save.checked)
  return (
    <section className="card aside-card">
      <h2>Next goal</h2>
      {next ? (
        <>
          <p className="goal-title">
            <strong>{next.title}</strong>
          </p>
          <p className="row-detail">{next.detail}</p>
        </>
      ) : (
        <p>All goals done</p>
      )}
    </section>
  )
}
