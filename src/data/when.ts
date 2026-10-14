import type { PathStep } from './types'

/** Formats a step's season and day as "Spring 2", the season alone, or an empty string. */
export function stepWhen(step: PathStep): string {
  if (!step.season) return ''
  const season = step.season[0].toUpperCase() + step.season.slice(1)
  return step.day ? `${season} ${step.day}` : season
}
