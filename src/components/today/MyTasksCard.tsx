import { useState } from 'react'
import type { CustomTask, Season } from '../../data/types'
import { useSave } from '../../state/SaveContext'

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']
const LABEL: Record<Season, string> = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' }
const index = (t: { season: Season; day: number }) => SEASONS.indexOf(t.season) * 28 + t.day

function Row({ task }: { task: CustomTask }) {
  const { save, toggle, removeCustomTask } = useSave()
  const id = `custom:${task.id}`
  const checked = save.checked.includes(id)
  return (
    <li className={checked ? 'path-row plan-row done' : 'path-row plan-row'}>
      <label className="row-check">
        <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
        <strong>{task.text}</strong>
      </label>
      <button type="button" className="btn-small" aria-label={`Remove ${task.text}`} onClick={() => removeCustomTask(task.id)}>
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
        Your tasks <span className="when">{LABEL[season]} {day}</span>
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
      {today.length > 0 && (
        <ul aria-label="Your tasks today" className="path-list">
          {today.map((t) => (
            <Row key={t.id} task={t} />
          ))}
        </ul>
      )}
      {earlier.length > 0 && (
        <>
          <h3>Unfinished from earlier</h3>
          <ul aria-label="Your unfinished tasks" className="path-list">
            {earlier.map((t) => (
              <li key={t.id} className="plan-label">
                <span className="when">
                  {LABEL[t.season]} {t.day}
                </span>
                <ul className="path-list">
                  <Row task={t} />
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
