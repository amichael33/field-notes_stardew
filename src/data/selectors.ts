import type { Bundle, BundleItem, PathStep, Season, Villager } from './types'

const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter']

export function bundleItemsBySeason(
  bundles: Bundle[],
  season: Season | 'all',
): { bundle: Bundle; item: BundleItem }[] {
  return bundles.flatMap((bundle) =>
    bundle.items
      .filter(
        (item) =>
          season === 'all' || item.seasons === 'any' || item.seasons.includes(season),
      )
      .map((item) => ({ bundle, item })),
  )
}

export function birthdaysBySeason(villagers: Villager[], season: Season | 'all'): Villager[] {
  return villagers
    .filter((v) => season === 'all' || v.birthday.season === season)
    .sort(
      (a, b) =>
        SEASON_ORDER.indexOf(a.birthday.season) - SEASON_ORDER.indexOf(b.birthday.season) ||
        a.birthday.day - b.birthday.day,
    )
}

export function sortedPathSteps(steps: PathStep[]): PathStep[] {
  return [...steps].sort((a, b) => a.order - b.order)
}

export function pathId(step: PathStep): string {
  return `path:${step.order}`
}

export function firstUnchecked(steps: PathStep[], checked: string[]): PathStep | undefined {
  return sortedPathSteps(steps).find((step) => !checked.includes(pathId(step)))
}
