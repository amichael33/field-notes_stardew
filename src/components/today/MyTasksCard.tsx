import { useState } from 'react'
import type { CustomTask, Season } from '../../data/types'
import { useSave } from '../../state/SaveContext'

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']
const LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
}
const index = (t: { season: Season; day: number }) => SEASONS.indexOf(t.season) * 28 + t.day

function Row({ task, from }: { task: CustomTask; from?: string }) {
  const { save, toggle, removeCustomTask } = useSave()
  const id = `custom:${task.id}`
  const checked = save.checked.includes(id)
  return (
    <li className={checked ? 'path-row plan-row done' : 'path-row plan-row'}>
      <label className="row-check">
        <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
        <strong>{task.text}</strong>
        {from && <span className="when">from {from}</span>}
      </label>
      <button
        type="button"
        className="btn-small"
        aria-label={`Remove ${task.text}`}
        onClick={() => removeCustomTask(task.id)}
      >
        Remove
      </button>
    </li>
  )
}

export default function MyTasksCard() {
  const { save, addCustomTask } = useSave()
  const [text, setText] = useState('')
  const season = save.clock?.season ?? 'spring'
  const day = save.clock?.day ?? 1
  const now = index({ season, day })
  const today = save.customTasks.filter((t) => t.season === season && t.day === day)
  const earlier = save.customTasks
    .filter((t) => index(t) < now && !save.checked.includes(`custom:${t.id}`))
    .sort((a, b) => index(a) - index(b))
  return (
    <section className="card" aria-label="Your tasks">
      <h2>
        Your tasks{' '}
        <span className="when">
          {LABEL[season]} {day}
        </span>
      </h2>
      <form
        className="add-task"
        onSubmit={(e) => {
          e.preventDefault()
          const t = text.trim()
          if (!t) return
          addCustomTask({ season, day, text: t })
          setText('')
        }}
      >
        <label className="visually-hidden" htmlFor="add-task-input">
          Add a task for today
        </label>
        <input
          id="add-task-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add your own task for today"
        />
        <button type="submit" className="btn">
          Add
        </button>
      </form>
      {today.length + earlier.length > 0 && (
        <ul aria-label="Your tasks today" className="path-list">
          {earlier.map((t) => (
            <Row key={t.id} task={t} from={`${LABEL[t.season]} ${t.day}`} />
          ))}
          {[...today]
            .sort(
              (a, b) =>
                Number(save.checked.includes(`custom:${a.id}`)) -
                Number(save.checked.includes(`custom:${b.id}`)),
            )
            .map((t) => (
              <Row key={t.id} task={t} />
            ))}
        </ul>
      )}
    </section>
  )
}
