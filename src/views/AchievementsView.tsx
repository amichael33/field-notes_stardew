import { useState, type ReactNode } from 'react'
import type { Achievement } from '../data/types'
import achievementsJson from '../data/achievements.json'
import extrasJson from '../data/achievement-extras.json'
import notesJson from '../data/achievement-notes.json'
import perfectionJson from '../data/perfection.json'
import ItemIcon from '../components/ItemIcon'
import FarmSprite from '../components/farm/FarmSprite'
import { useSave } from '../state/SaveContext'

const achievements = achievementsJson as Achievement[]
const extras = extrasJson as Record<
  string,
  { icon: string; unlocks?: string; spoiler?: boolean; note?: string }
>
const notes = notesJson as Record<string, { text: string; groups?: { title: string; crops: string[] }[] }>
const perfection = perfectionJson as {
  id: string
  name: string
  description: string
  count: number
  weight: number
  icon: { type: 'achievement' | 'building' | 'item'; id: string }
  spoiler?: boolean
}[]

function AchievementIcon({ name }: { name: string }) {
  return <img className="goal-icon" src={extras[name].icon} alt="" width={48} height={48} />
}

function Hidden({ label, onReveal }: { label: string; onReveal: () => void }) {
  return (
    <li className="goal-row goal-hidden" aria-label={label}>
      <button
        type="button"
        className="spoiler-btn"
        aria-label="Hidden spoiler, click to reveal"
        onClick={onReveal}
      >
        <span className="goal-icon spoiler-q" aria-hidden="true">
          ?
        </span>
        <span>Spoiler: click to reveal</span>
      </button>
    </li>
  )
}

function Notes({ keyName }: { keyName: string }) {
  const note = notes[keyName]
  if (!note) return null
  return (
    <details className="goal-notes">
      <summary>Notes</summary>
      <p className="row-detail">{note.text}</p>
      {note.groups?.map((g) => (
        <div key={g.title}>
          <h3>{g.title}</h3>
          <ul className="goal-crops">
            {g.crops.map((c) => (
              <li key={c} title={c} aria-label={c} data-tip={c} tabIndex={0} className="tip-focus">
                <ItemIcon name={c} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </details>
  )
}

/** Keeps the order, but puts spoilers after the rest and finished goals after everything else. */
const sortGoals = <T,>(items: T[], isSpoiler: (t: T) => boolean, isDone: (t: T) => boolean) => {
  const rank = (t: T) => (isDone(t) ? 2 : 0) + (isSpoiler(t) ? 1 : 0)
  return [...items].sort((a, b) => rank(a) - rank(b))
}

function Done({ id, name }: { id: string; name: string }) {
  const { save, toggle } = useSave()
  return (
    <label className="row-check goal-done">
      <input type="checkbox" checked={save.checked.includes(id)} onChange={() => toggle(id)} />
      <strong>{name}</strong>
    </label>
  )
}

export default function AchievementsView() {
  const { save } = useSave()
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const reveal = (id: string) => setRevealed((s) => new Set(s).add(id))

  const perfIcon = (p: (typeof perfection)[number]): ReactNode =>
    p.icon.type === 'achievement' ? (
      <AchievementIcon name={p.icon.id} />
    ) : p.icon.type === 'building' ? (
      <FarmSprite kind="building" id={p.icon.id} />
    ) : (
      <ItemIcon name={p.icon.id} />
    )

  return (
    <section>
      <h1>Goals</h1>
      <section className="card" aria-label="Needed for Perfection">
        <h2>Needed for Perfection</h2>
        <p className="when">All of these together make up the 100% Perfection score.</p>
        <ul className="goal-list">
          {sortGoals(
            perfection.map((p, i) => ({ p, i })),
            ({ p }) => !!p.spoiler,
            ({ p }) => save.checked.includes(`goal:p:${p.id}`),
          ).map(({ p, i }) =>
            p.spoiler && !revealed.has(`p:${p.id}`) ? (
              <Hidden key={p.id} label={`Hidden requirement ${i + 1}`} onReveal={() => reveal(`p:${p.id}`)} />
            ) : (
              <li
                key={p.id}
                className={save.checked.includes(`goal:p:${p.id}`) ? 'goal-row done' : 'goal-row'}
              >
                <span className="goal-pic">{perfIcon(p)}</span>
                <div>
                  <Done id={`goal:p:${p.id}`} name={p.name} /> <span className="tag">{p.count}</span>{' '}
                  <span className="when">{p.weight}% of Perfection</span>
                  <p className="row-detail">{p.description}</p>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
      <section className="card" aria-label="Achievements">
        <h2>Achievements</h2>
        <ul className="goal-list" aria-label="All achievements">
          {sortGoals(
            achievements.map((a, i) => ({ a, i })),
            ({ a }) => !!extras[a.name].spoiler,
            ({ a }) => save.checked.includes(`goal:a:${a.name}`),
          ).map(({ a, i }) => {
            const e = extras[a.name]
            if (e.spoiler && !revealed.has(`a:${a.name}`)) {
              return (
                <Hidden
                  key={a.name}
                  label={`Hidden achievement ${i + 1}`}
                  onReveal={() => reveal(`a:${a.name}`)}
                />
              )
            }
            return (
              <li
                key={a.name}
                className={save.checked.includes(`goal:a:${a.name}`) ? 'goal-row done' : 'goal-row'}
              >
                <span className="goal-pic">
                  <AchievementIcon name={a.name} />
                </span>
                <div>
                  <Done id={`goal:a:${a.name}`} name={a.name} /> <span className="when">{a.requirement}</span>
                  {e.unlocks && <p className="row-detail">Unlocks: {e.unlocks}</p>}
                  {e.note && <Notes keyName={e.note} />}
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </section>
  )
}
