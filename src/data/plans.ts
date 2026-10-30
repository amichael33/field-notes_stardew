import { dayIndex } from './calendar'
import communityCenterJson from './plans/community-center.json'
import moneyJson from './plans/money.json'
import type { Clock, Plan, PlanDay, PlanGoal, PlanTask, Route, Season, Weather } from './types'

export const PLAN_GOALS: { id: PlanGoal; label: string; description: string }[] = [
  {
    id: 'community-center',
    label: 'Community Center in year 1',
    description: 'Day-by-day tasks aimed at finishing the Community Center bundles in your first year.',
  },
  {
    id: 'money',
    label: 'Max money and farm growth',
    description: 'Day-by-day tasks aimed at earning as much as possible and growing the farm fast.',
  },
]

export const DEFAULT_PLAN_GOAL: PlanGoal = 'community-center'

export function isPlanGoal(v: unknown): v is PlanGoal {
  return v === 'community-center' || v === 'money'
}

export const PLANS: Record<PlanGoal, Plan> = {
  'community-center': communityCenterJson as Plan,
  money: moneyJson as Plan,
}

export function planTaskId(goal: PlanGoal, task: PlanTask): string {
  return `plan:${goal}:${task.id}`
}

function forRoute(tasks: PlanTask[], route: Route): PlanTask[] {
  return tasks.filter((t) => t.route === undefined || t.route === route)
}

function sortedDays(plan: Plan): PlanDay[] {
  return [...plan].sort((a, b) => dayIndex(a.season, a.day) - dayIndex(b.season, b.day))
}

export function planForDay(
  goal: PlanGoal,
  route: Route,
  season: Season,
  day: number,
  weather: Weather,
  plans: Record<PlanGoal, Plan> = PLANS,
): { day: PlanDay; tasks: PlanTask[]; raining: boolean } | undefined {
  const entry = plans[goal].find((d) => d.season === season && d.day === day)
  if (!entry) return undefined
  const raining = weather === 'rain' && entry.rainTasks !== undefined
  return { day: entry, tasks: forRoute(raining ? entry.rainTasks! : entry.tasks, route), raining }
}

export function missedTasks(
  goal: PlanGoal,
  route: Route,
  clock: Clock | null,
  checked: string[],
  plans: Record<PlanGoal, Plan> = PLANS,
): { season: Season; day: number; tasks: PlanTask[] }[] {
  const now = clock ? dayIndex(clock.season, clock.day) : dayIndex('spring', 1)
  const result: { season: Season; day: number; tasks: PlanTask[] }[] = []
  for (const d of sortedDays(plans[goal])) {
    if (dayIndex(d.season, d.day) >= now) continue
    const tasks = forRoute(d.tasks, route).filter((t) => !checked.includes(planTaskId(goal, t)))
    if (tasks.length > 0) result.push({ season: d.season, day: d.day, tasks })
  }
  return result
}

export function nextPlanTask(
  goal: PlanGoal,
  route: Route,
  clock: Clock | null,
  checked: string[],
  plans: Record<PlanGoal, Plan> = PLANS,
): { day: PlanDay; task: PlanTask } | undefined {
  const season = clock?.season ?? 'spring'
  const dayNum = clock?.day ?? 1
  const weather = clock?.weather ?? 'sunny'
  const unchecked = (t: PlanTask) => !checked.includes(planTaskId(goal, t))
  const today = planForDay(goal, route, season, dayNum, weather, plans)
  const first = today?.tasks.find(unchecked)
  if (today && first) return { day: today.day, task: first }
  const now = dayIndex(season, dayNum)
  for (const d of sortedDays(plans[goal])) {
    if (dayIndex(d.season, d.day) <= now) continue
    const task = forRoute(d.tasks, route).find(unchecked)
    if (task) return { day: d, task }
  }
  return undefined
}

export function yearComplete(clock: Clock | null): boolean {
  return clock !== null && clock.season === 'winter' && clock.day === 28 && clock.status === 'ended'
}
