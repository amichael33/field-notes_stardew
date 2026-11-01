import { describe, it, expect } from 'vitest'
import { tvId, tvTaskFor } from './queen-of-sauce'

describe('tvTaskFor', () => {
  it('shows the new recipe on its Sunday', () => {
    const t = tvTaskFor('spring', 7, [])
    expect(t).toMatchObject({ id: 'tv:Stir Fry', recipe: 'Stir Fry', rerun: false })
    expect(tvTaskFor('winter', 28, [])?.recipe).toBe('Cranberry Candy')
  })

  it('shows a rerun the Thursday after, until the recipe is ticked', () => {
    expect(tvTaskFor('spring', 11, [])).toMatchObject({ recipe: 'Stir Fry', rerun: true })
    expect(tvTaskFor('spring', 11, [tvId('Stir Fry')])).toBeUndefined()
  })

  it('still shows the Sunday task when it is ticked, so it can be unticked', () => {
    expect(tvTaskFor('spring', 7, [tvId('Stir Fry')])?.id).toBe('tv:Stir Fry')
  })

  it('reruns a season-end episode on day 4 of the next season', () => {
    expect(tvTaskFor('summer', 4, [])).toMatchObject({ recipe: 'Omelet', rerun: true })
  })

  it('shows nothing on other days, or before the first episode', () => {
    expect(tvTaskFor('spring', 8, [])).toBeUndefined()
    expect(tvTaskFor('spring', 4, [])).toBeUndefined()
    expect(tvTaskFor('spring', 1, [])).toBeUndefined()
  })

  it('has a task on exactly 16 Sundays and 15 Thursdays in year 1', () => {
    const seasons = ['spring', 'summer', 'fall', 'winter'] as const
    let fresh = 0
    let reruns = 0
    for (const s of seasons)
      for (let d = 1; d <= 28; d++) {
        const t = tvTaskFor(s, d, [])
        if (t?.rerun) reruns++
        else if (t) fresh++
      }
    expect(fresh).toBe(16)
    expect(reruns).toBe(15)
  })
})
