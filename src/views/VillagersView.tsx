import { useRef, useState } from 'react'
import { birthdaysBySeason } from '../data/selectors'
import { useSave } from '../state/SaveContext'
import { resizeImage } from '../state/photo'
import { useAppState } from '../state/AppState'
import type { Villager } from '../data/types'
import villagersJson from '../data/villagers.json'

function TasteList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>None listed</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const { save, setPhoto } = useSave()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const photo = save.photos[name]
  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setPhoto(name, await resizeImage(file))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not use that photo.')
    }
  }
  return (
    <div className="avatar-row">
      {photo ? (
        <img className="avatar" src={photo} alt={`Photo of ${name}`} />
      ) : (
        <span className="avatar avatar-empty" aria-hidden="true">
          {name[0]}
        </span>
      )}
      <div className="avatar-actions">
        <button type="button" className="btn-small" onClick={() => input.current?.click()}>
          {photo ? 'Change photo' : 'Upload photo'}
          <span className="visually-hidden"> for {name}</span>
        </button>
        {photo && (
          <button type="button" className="btn-small" onClick={() => setPhoto(name, null)}>
            Remove photo<span className="visually-hidden"> for {name}</span>
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="visually-hidden"
          aria-label={`Photo file for ${name}`}
          tabIndex={-1}
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {error && <span className="when" role="alert">{error}</span>}
      </div>
    </div>
  )
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export default function VillagersView({ villagers = villagersJson as Villager[] }: { villagers?: Villager[] }) {
  const { season } = useAppState()
  const birthdays = birthdaysBySeason(villagers, season)

  return (
    <section>
      <h1>People</h1>
      <h2>Birthday calendar</h2>
      {birthdays.length === 0 ? (
        <p>No birthdays this season.</p>
      ) : (
        <ul aria-label="Birthday calendar">
          {birthdays.map((v) => (
            <li key={v.name}>
              {cap(v.birthday.season)} {v.birthday.day}: {v.name}
            </li>
          ))}
        </ul>
      )}
      <h2>Gift tastes</h2>
      <p className="when">
        Universal Loves and Likes apply to most villagers even when they are not listed below; lists show
        villager-specific items and the wiki's exceptions.
      </p>
      <div className="cols">
      {villagers.map((v) => (
        <article key={v.name} aria-label={v.name} className="card">
          <h3>{v.name}</h3>
          <Avatar name={v.name} />
          <TasteList title="Loves" items={v.loves} />
          <TasteList title="Likes" items={v.likes} />
        </article>
      ))}
      </div>
    </section>
  )
}
