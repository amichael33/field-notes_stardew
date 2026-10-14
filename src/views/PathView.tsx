import { firstUnchecked, sortedPathSteps } from '../data/selectors'
import { useAppState } from '../state/AppState'
import { useSave } from '../state/SaveContext'
import StatusBanner from '../components/today/StatusBanner'
import PathRibbon from '../components/today/PathRibbon'
import PathCard from '../components/today/PathCard'
import NotesCard from '../components/today/NotesCard'
import NextGoalCard from '../components/today/NextGoalCard'
import NeededCard from '../components/today/NeededCard'
import WhereCard from '../components/today/WhereCard'
import type { PathStep, Recipe } from '../data/types'
import stepsJson from '../data/path-steps.json'
import recipesJson from '../data/recipes.json'

const steps = sortedPathSteps(stepsJson as PathStep[])
const ribbonSteps = steps.filter((s) => s.order >= 1 && s.order <= 7)
const recipes = recipesJson as Recipe[]

export default function PathView() {
  const { season } = useAppState()
  const { save } = useSave()
  const visibleRecipes = recipes
    .filter((r) => season === 'all' || r.season === 'any' || r.season === season)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="today">
      <StatusBanner nextStep={firstUnchecked(steps, save.checked)} />
      <PathRibbon steps={ribbonSteps} />
      <div className="today-grid">
        <PathCard steps={steps} />
        <aside className="today-aside">
          <NotesCard />
          <NextGoalCard steps={steps} />
          <NeededCard />
          <WhereCard steps={steps} />
        </aside>
      </div>
      <section className="card">
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
    </div>
  )
}
