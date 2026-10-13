import type { Achievement } from '../data/types'
import achievementsJson from '../data/achievements.json'

const achievements = achievementsJson as Achievement[]

export default function AchievementsView() {
  return (
    <section className="card">
      <h1>Goals</h1>
      <ul>
        {achievements.map((a) => (
          <li key={a.name}>
            <strong>{a.name}</strong> <span className="when">{a.requirement}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
