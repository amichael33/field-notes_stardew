import { birthdaysBySeason } from '../data/selectors'
import { useAppState } from '../state/AppState'
import type { Season, Villager } from '../data/types'
import villagersJson from '../data/villagers.json'
import portraitsJson from '../data/portraits.json'

const portraits = portraitsJson as Record<string, string>

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

function Portrait({ name }: { name: string }) {
  const src = portraits[name]
  return src ? (
    <img className="avatar avatar-game" src={src} alt="" width={64} height={64} />
  ) : (
    <span className="avatar avatar-empty" aria-hidden="true">
      {name[0]}
    </span>
  )
}

// The game's calendar sheet (cropped by `npm run portraits`): a 7 by 4 grid of 32px cells.
const SHEET = { w: 302, h: 198, x0: 37, y0: 47, cell: 32 }
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

function SeasonCalendar({ season, villagers }: { season: Season; villagers: Villager[] }) {
  return (
    <figure className="cal-season">
      <figcaption>{season}</figcaption>
      <div
        className="cal"
        role="group"
        aria-label={`${season} birthdays`}
        style={{ backgroundImage: 'url(calendar/billboard.png)' }}
      >
        {villagers.map((v) => {
          const i = v.birthday.day - 1
          const col = i % 7
          const row = Math.floor(i / 7)
          return (
            <div
              key={v.name}
              className="cal-bday"
              title={`${v.name}, ${season} ${v.birthday.day}`}
              style={{
                left: `${((SHEET.x0 + col * SHEET.cell) / SHEET.w) * 100}%`,
                top: `${((SHEET.y0 + row * SHEET.cell) / SHEET.h) * 100}%`,
                width: `${(SHEET.cell / SHEET.w) * 100}%`,
                height: `${(SHEET.cell / SHEET.h) * 100}%`,
              }}
            >
              <Portrait name={v.name} />
              <span className="cal-name">{v.name}</span>
            </div>
          )
        })}
      </div>
    </figure>
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
        <div className="cal-grid">
          {SEASONS.filter((s) => birthdays.some((v) => v.birthday.season === s)).map((s) => (
            <SeasonCalendar key={s} season={s} villagers={birthdays.filter((v) => v.birthday.season === s)} />
          ))}
        </div>
      )}
      {birthdays.length > 0 && (
        <ul aria-label="Birthday calendar" className="visually-hidden">
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
          <div className="villager-head">
            <Portrait name={v.name} />
            <h3>{v.name}</h3>
          </div>
          <TasteList title="Loves" items={v.loves} />
          <TasteList title="Likes" items={v.likes} />
        </article>
      ))}
      </div>
    </section>
  )
}
