import type { Season } from './types'

export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

const DAYS_PER_SEASON = 28
const DAYS_PER_YEAR = SEASONS.length * DAYS_PER_SEASON

export type SeasonDay = { season: Season; day: number }

export function dayIndex(season: Season, day: number): number {
  return SEASONS.indexOf(season) * DAYS_PER_SEASON + day
}

export function fromIndex(index: number): SeasonDay {
  const offset = (((index - 1) % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR
  return {
    season: SEASONS[Math.floor(offset / DAYS_PER_SEASON)],
    day: (offset % DAYS_PER_SEASON) + 1,
  }
}

export function daysUntil(target: SeasonDay, now: SeasonDay): number {
  return dayIndex(target.season, target.day) - dayIndex(now.season, now.day)
}
