import type { PathStep } from '../../data/types'
import { firstUnchecked, pathId, sortedPathSteps } from '../../data/selectors'
import { stepWhen } from '../../data/when'
import { useSave } from '../../state/SaveContext'

export default function PathCard({ steps }: { steps: PathStep[] }) {
  const { save, toggle } = useSave()
  const ordered = sortedPathSteps(steps)
  const next = firstUnchecked(ordered, save.checked)
  const done = ordered.filter((s) => save.checked.includes(pathId(s))).length
  return (
    <section className="card path-card">
      <div className="path-title">
        <h2>Opening path</h2>
        <span className="tag">
          {done}/{ordered.length}
        </span>
      </div>
      <p className="rain-banner">On a rainy day, do the rainy day steps first.</p>
      <ol aria-label="Path steps" className="path-list">
        {ordered.map((step) => {
          const id = pathId(step)
          const checked = save.checked.includes(id)
          const cls = ['path-row', checked ? 'done' : '', next === step ? 'next' : '']
            .filter(Boolean)
            .join(' ')
          return (
            <li key={step.order} className={cls}>
              <span className="row-when">{stepWhen(step)}</span>
              <div className="row-body">
                <label className="row-check">
                  <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
                  <strong>{step.title}</strong>
                </label>
                {step.rainy && <span className="badge">Rainy day</span>}
                <p className="row-detail">{step.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
