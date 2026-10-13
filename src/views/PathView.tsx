import { sortedPathSteps } from '../data/selectors'
import { useAppState } from '../state/AppState'
import type { PathStep, Recipe } from '../data/types'
import stepsJson from '../data/path-steps.json'
import recipesJson from '../data/recipes.json'

const steps = stepsJson as PathStep[]
const recipes = recipesJson as Recipe[]

function when(step: PathStep): string {
  if (!step.season) return ''
  const season = step.season[0].toUpperCase() + step.season.slice(1)
  return step.day ? `${season} ${step.day}` : season
}

export default function PathView() {
  const { season } = useAppState()
  const visibleRecipes = recipes
    .filter((r) => season === 'all' || r.season === 'any' || r.season === season)
    .sort((a, b) => a.order - b.order)

  return (
    <section className="card">
      <h1>Today</h1>
      <p className="when">Opening route for Spring, Year 1. Live day tracking comes later.</p>
      <ol aria-label="Path steps">
        {sortedPathSteps(steps).map((step) => (
          <li key={step.order}>
            <strong>{step.title}</strong>
            {when(step) && <span className="when"> ({when(step)})</span>}
            {step.rainy && <span className="badge">Rainy day</span>}
            <p>{step.detail}</p>
          </li>
        ))}
      </ol>
      <h2>Recipes</h2>
      {visibleRecipes.length === 0 ? (
        <p>No recipes this season.</p>
      ) : (
        <ul aria-label="Recipes">
          {visibleRecipes.map((r) => (
            <li key={r.order}>
              <strong>{r.name}</strong> <span className="when">{r.source}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
