import { dayIndex } from './calendar'
import recipesJson from './recipes.json'
import type { Season } from './types'

interface Recipe {
  name: string
  season: string
  year: number
  day: number
}

export interface TvTask {
  id: string
  recipe: string
  text: string
  rerun: boolean
  /** The channel starts the show at 6am. */
  time: number
}

const YEAR_ONE = (recipesJson as Recipe[]).filter((r) => r.year === 1)

export const tvId = (recipe: string) => `tv:${recipe}`

/**
 * The Queen of Sauce todo for a day of year 1. A new recipe airs on the Sunday it is listed; the
 * Thursday after is a rerun of that episode, and is left out once the recipe is ticked.
 */
export function tvTaskFor(season: Season, day: number, checked: string[]): TvTask | undefined {
  const today = dayIndex(season, day)
  const fresh = YEAR_ONE.find((r) => dayIndex(r.season as Season, r.day) === today)
  if (fresh) {
    return {
      id: tvId(fresh.name),
      recipe: fresh.name,
      text: `Watch The Queen of Sauce to learn ${fresh.name}`,
      rerun: false,
      time: 360,
    }
  }
  const aired = YEAR_ONE.find((r) => dayIndex(r.season as Season, r.day) === today - 4)
  if (!aired) return undefined
  if (checked.includes(tvId(aired.name))) return undefined
  return {
    id: tvId(aired.name),
    recipe: aired.name,
    text: `Watch the rerun of The Queen of Sauce to learn ${aired.name}`,
    rerun: true,
    time: 360,
  }
}
