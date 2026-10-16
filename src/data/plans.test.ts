import { describe, expect, it } from 'vitest'
import {
  isPlanGoal,
  missedTasks,
  nextPlanTask,
  planForDay,
  planTaskId,
  yearComplete,
} from './plans'
import type { Clock, Plan, PlanGoal, PlanTask } from './types'

const t1: PlanTask = { id: 't1', text: 'Task 1' }
const t2: PlanTask = { id: 't2', text: 'Task 2' }
const r1: PlanTask = { id: 'r1', text: 'Rain 1' }
const t3: PlanTask = { id: 't3', text: 'Task 3', route: 'joja' }
const t4: PlanTask = { id: 't4', text: 'Task 4' }
const t5: PlanTask = { id: 't5', text: 'Task 5' }

const plans: Record<PlanGoal, Plan> = {
  'community-center': [
    { season: 'spring', day: 1, why: 'w1', tasks: [t1, t2], rainTasks: [r1] },
    { season: 'spring', day: 2, why: 'w2', tasks: [t3, t4] },
    { season: 'summer', day: 1, why: 'w3', tasks: [t5] },
  ],
  money: [{ season: 'spring', day: 1, why: 'm', tasks: [t1] }],
}

const clock = (season: Clock['season'], day: number, over: Partial<Clock> = {}): Clock => ({
  season,
  day,
  minutes: 360,
  weather: 'sunny',
  status: 'running',
  ...over,
})

describe('planForDay', () => {
  it('returns normal tasks on sunny weather', () => {
    const r = planForDay('community-center', 'community-center', 'spring', 1, 'sunny', plans)
    expect(r?.tasks).toEqual([t1, t2])
    expect(r?.raining).toBe(false)
  })
  it('returns rainTasks on rain when defined', () => {
    const r = planForDay('community-center', 'community-center', 'spring', 1, 'rain', plans)
    expect(r?.tasks).toEqual([r1])
    expect(r?.raining).toBe(true)
  })
  it('falls back to normal tasks on rain without rainTasks', () => {
    const r = planForDay('community-center', 'community-center', 'spring', 2, 'rain', plans)
    expect(r?.tasks).toEqual([t4])
    expect(r?.raining).toBe(false)
  })
  it('filters by route', () => {
    const cc = planForDay('community-center', 'community-center', 'spring', 2, 'sunny', plans)
    const joja = planForDay('community-center', 'joja', 'spring', 2, 'sunny', plans)
    expect(cc?.tasks).toEqual([t4])
    expect(joja?.tasks).toEqual([t3, t4])
  })
  it('returns undefined for a day with no entry', () => {
    expect(planForDay('community-center', 'community-center', 'fall', 5, 'sunny', plans)).toBeUndefined()
  })
})

describe('planTaskId', () => {
  it('namespaces by goal', () => {
    expect(planTaskId('community-center', t1)).toBe('plan:community-center:t1')
  })
})

describe('missedTasks', () => {
  it('lists unchecked earlier tasks chronologically', () => {
    const r = missedTasks('community-center', 'community-center', clock('summer', 1), ['plan:community-center:t1'], plans)
    expect(r).toEqual([
      { season: 'spring', day: 1, tasks: [t2] },
      { season: 'spring', day: 2, tasks: [t4] },
    ])
  })
  it('returns [] for a null clock', () => {
    expect(missedTasks('community-center', 'community-center', null, [], plans)).toEqual([])
  })
  it('never includes rain tasks', () => {
    const r = missedTasks('community-center', 'community-center', clock('summer', 1, { weather: 'rain' }), [], plans)
    expect(r.flatMap((d) => d.tasks)).not.toContainEqual(r1)
  })
  it('ignores checked ids from the other goal', () => {
    const r = missedTasks('community-center', 'community-center', clock('summer', 1), ['plan:money:t1'], plans)
    expect(r[0].tasks).toEqual([t1, t2])
  })
})

describe('nextPlanTask', () => {
  it('starts at Spring 1 with a null clock', () => {
    expect(nextPlanTask('community-center', 'community-center', null, [], plans)?.task).toEqual(t1)
  })
  it('moves to the next day when the day is done', () => {
    const checked = ['plan:community-center:t1', 'plan:community-center:t2']
    const r = nextPlanTask('community-center', 'community-center', null, checked, plans)
    expect(r?.day.day).toBe(2)
    expect(r?.task).toEqual(t4)
  })
  it('returns undefined when everything is checked', () => {
    const checked = ['t1', 't2', 't4', 't5'].map((id) => `plan:community-center:${id}`)
    expect(nextPlanTask('community-center', 'community-center', null, checked, plans)).toBeUndefined()
  })
  it('starts with rain tasks on a rainy day', () => {
    const r = nextPlanTask('community-center', 'community-center', clock('spring', 1, { weather: 'rain' }), [], plans)
    expect(r?.task).toEqual(r1)
  })
})

describe('yearComplete', () => {
  it('is true only for winter 28 ended', () => {
    expect(yearComplete(clock('winter', 28, { status: 'ended' }))).toBe(true)
    expect(yearComplete(clock('winter', 28))).toBe(false)
    expect(yearComplete(null)).toBe(false)
    expect(yearComplete(clock('winter', 27, { status: 'ended' }))).toBe(false)
  })
})

describe('isPlanGoal', () => {
  it('validates', () => {
    expect(isPlanGoal('money')).toBe(true)
    expect(isPlanGoal('bogus')).toBe(false)
  })
})
