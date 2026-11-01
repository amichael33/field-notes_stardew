import { tvTaskFor } from '../../data/queen-of-sauce'
import { formatTime } from '../../state/clock'
import { useSave } from '../../state/SaveContext'

export default function TvCard() {
  const { save, toggle } = useSave()
  const { clock, checked } = save
  const task = clock ? tvTaskFor(clock.season, clock.day, checked) : undefined
  if (!task) return null
  return (
    <section className="card path-card" aria-label="On TV today">
      <div className="path-title">
        <h2>On TV today</h2>
        {task.rerun && <span className="tag">Rerun</span>}
      </div>
      <ul className="path-list" aria-label="TV tasks">
        <li className={checked.includes(task.id) ? 'path-row plan-row done' : 'path-row plan-row'}>
          <div className="row-body">
            <label className="row-check">
              <input type="checkbox" checked={checked.includes(task.id)} onChange={() => toggle(task.id)} />
              <strong>{task.text}</strong>
            </label>
            <p className="row-detail">{`Living room TV at ${formatTime(task.time)}`}</p>
          </div>
        </li>
      </ul>
    </section>
  )
}
