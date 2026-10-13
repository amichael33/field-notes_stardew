import { birthdaysBySeason } from '../data/selectors'
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

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export default function VillagersView({ villagers = villagersJson as Villager[] }: { villagers?: Villager[] }) {
  const { season } = useAppState()
  const birthdays = birthdaysBySeason(villagers, season)

  return (
    <section>
      <h1>Villagers</h1>
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
      {villagers.map((v) => (
        <article key={v.name} aria-label={v.name}>
          <h3>{v.name}</h3>
          <TasteList title="Loves" items={v.loves} />
          <TasteList title="Likes" items={v.likes} />
        </article>
      ))}
    </section>
  )
}
