import type { PathStep } from '../../data/types'
import { pathId } from '../../data/selectors'
import { stepWhen } from '../../data/when'
import { useSave } from '../../state/SaveContext'

export default function PathRibbon({ steps }: { steps: PathStep[] }) {
  const { save, toggle } = useSave()
  const done = steps.filter((s) => save.checked.includes(pathId(s))).length
  return (
    <section className="ribbon" aria-label="Path ribbon">
      <h2 className="ribbon-head">
        {done} of {steps.length} on track
      </h2>
      <div className="ribbon-chips">
        {steps.map((step) => {
          const on = save.checked.includes(pathId(step))
          return (
            <button
              key={step.order}
              type="button"
              className={on ? 'chip on' : 'chip'}
              aria-pressed={on}
              onClick={() => toggle(pathId(step))}
            >
              <span className="chip-title">
                {stepWhen(step) || 'Any day'}: {step.title}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
