import { describe, it, expect } from 'vitest'
import { PLANS, PLAN_GOALS, planTaskId } from './plans'
import itemIcons from './item-icons.json'
import schedules from './schedules.json'
import type { PlanTask } from './types'

// Places that no villager schedule visits.
const EXTRA_PLACES = new Set([
  'Farm',
])

const SEASONS = ['spring', 'summer', 'fall', 'winter']

function schedulePlaces(): Set<string> {
  const places = new Set<string>()
  const walk = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') {
      const rec = o as Record<string, unknown>
      if (typeof rec.place === 'string') places.add(rec.place)
      Object.values(rec).forEach(walk)
    }
  }
  walk(schedules)
  return places
}

const places = schedulePlaces()

describe.each(PLAN_GOALS.map((g) => g.id))('plan data for %s', (goal) => {
  const plan = PLANS[goal]
  const tasksOf = () =>
    plan.flatMap((d) => [...d.tasks, ...(d.rainTasks ?? [])].map((t) => ({ d, t })))

  it('has a valid season and day on every entry', () => {
    for (const d of plan) {
      expect(SEASONS).toContain(d.season)
      expect(d.day).toBeGreaterThanOrEqual(1)
      expect(d.day).toBeLessThanOrEqual(28)
    }
  })

  it('has a why line and at least one task on every day', () => {
    for (const d of plan) {
      expect(d.why.trim().length).toBeGreaterThan(0)
      expect(d.tasks.length).toBeGreaterThan(0)
    }
  })

  it('has unique (season, day) pairs', () => {
    const keys = plan.map((d) => `${d.season}-${d.day}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has unique task ids without colons, namespaced under plan:', () => {
    const ids = tasksOf().map(({ t }) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).not.toContain(':')
    for (const { t } of tasksOf()) expect(planTaskId(goal, t as PlanTask)).toMatch(/^plan:/)
  })

  it('only references known items', () => {
    for (const { t } of tasksOf()) {
      if (t.item !== undefined) expect(itemIcons, `item ${t.item}`).toHaveProperty([t.item])
    }
  })

  it('only references known places', () => {
    for (const { t } of tasksOf()) {
      if (t.place !== undefined) {
        expect(places.has(t.place) || EXTRA_PLACES.has(t.place), `place ${t.place}`).toBe(true)
      }
    }
  })

  it('keeps times between 6am and 2am', () => {
    for (const { t } of tasksOf()) {
      if (t.time !== undefined) {
        expect(t.time).toBeGreaterThanOrEqual(360)
        expect(t.time).toBeLessThanOrEqual(1560)
      }
    }
  })

  it('has a rain variant and a route-tagged task somewhere', () => {
    if (plan.length === 0) return
    expect(plan.some((d) => d.rainTasks !== undefined)).toBe(true)
    expect(plan.some((d) => d.tasks.some((t) => t.route !== undefined))).toBe(true)
  })
})
