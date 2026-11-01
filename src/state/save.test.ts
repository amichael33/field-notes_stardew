import { describe, it, expect } from 'vitest'
import { defaultFarm } from './farm-save'
import { defaultSave, parseSave, serializeSave, toggleChecked } from './save'

describe('save', () => {
  it('defaultSave has the community-center route and no progress', () => {
    const s = defaultSave()
    expect(s.version).toBe(1)
    expect(s.profile).toEqual({
      route: 'community-center',
      farmType: 'standard',
      planGoal: 'community-center',
      remixed: false,
    })
    expect(s.checked).toEqual([])
    expect(s.notes).toBe('')
  })

  it('toggleChecked adds then removes an id without mutating the input', () => {
    const a = defaultSave()
    const b = toggleChecked(a, 'path:1')
    expect(b.checked).toEqual(['path:1'])
    expect(a.checked).toEqual([])
    const c = toggleChecked(b, 'path:1')
    expect(c.checked).toEqual([])
    expect(b.checked).toEqual(['path:1'])
  })

  it('serializeSave then parseSave round-trips', () => {
    const s = { ...toggleChecked(defaultSave(), 'path:3'), notes: 'water crops' }
    const r = parseSave(serializeSave(s))
    expect(r).toEqual({ ok: true, data: s })
  })

  it('parseSave rejects text that is not JSON', () => {
    const r = parseSave('not json {')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0)
  })

  it('parseSave rejects a newer version', () => {
    const r = parseSave(JSON.stringify({ ...defaultSave(), version: 2 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/newer/)
  })

  it('parseSave rejects wrong field types', () => {
    const base = defaultSave()
    const bad = [
      { ...base, checked: 'path:1' },
      { ...base, checked: [1] },
      { ...base, profile: { ...base.profile, route: 'moon' } },
      { ...base, profile: { ...base.profile, farmType: 3 } },
      { ...base, profile: null },
      { ...base, notes: 5 },
      null,
      [],
    ]
    for (const b of bad) {
      expect(parseSave(JSON.stringify(b)).ok).toBe(false)
    }
  })
})

describe('save plan goal', () => {
  it('defaults a missing planGoal to community-center', () => {
    const base = defaultSave()
    const profile: Record<string, unknown> = { ...base.profile }
    delete profile.planGoal
    const r = parseSave(JSON.stringify({ ...base, profile }))
    expect(r.ok && r.data.profile.planGoal).toBe('community-center')
  })

  it('keeps a valid planGoal', () => {
    const base = defaultSave()
    const r = parseSave(JSON.stringify({ ...base, profile: { ...base.profile, planGoal: 'money' } }))
    expect(r.ok && r.data.profile.planGoal).toBe('money')
  })

  it('rejects an invalid planGoal', () => {
    const base = defaultSave()
    const r = parseSave(JSON.stringify({ ...base, profile: { ...base.profile, planGoal: 'bogus' } }))
    expect(r).toEqual({ ok: false, error: 'The save plan goal is invalid.' })
  })

  it('round trips planGoal and drops unknown profile keys', () => {
    const base = defaultSave()
    const s = { ...base, profile: { ...base.profile, planGoal: 'money' as const } }
    expect(parseSave(serializeSave(s))).toEqual({ ok: true, data: s })
    const r = parseSave(JSON.stringify({ ...s, profile: { ...s.profile, extra: 1 } }))
    expect(r.ok && Object.keys(r.data.profile).sort()).toEqual(['farmType', 'planGoal', 'remixed', 'route'])
  })
})

describe('save clock', () => {
  const clock = { season: 'fall', day: 12, minutes: 600, weather: 'rain', status: 'paused' } as const

  it('defaultSave has a null clock', () => {
    expect(defaultSave().clock).toBeNull()
  })

  it('round trips a valid clock', () => {
    const r = parseSave(serializeSave({ ...defaultSave(), clock: { ...clock } }))
    expect(r.ok && r.data.clock).toEqual(clock)
  })

  it('a v1 save with no clock key parses to null', () => {
    const rest: Record<string, unknown> = { ...defaultSave() }
    delete rest.clock
    const r = parseSave(JSON.stringify(rest))
    expect(r.ok && r.data.clock).toBeNull()
  })

  it('keeps only the five clock fields from an imported file', () => {
    const r = parseSave(JSON.stringify({ ...defaultSave(), clock: { ...clock, extra: 'x', more: { a: 1 } } }))
    expect(r.ok && r.data.clock).toEqual(clock)
    expect(r.ok && Object.keys(r.data.clock!).sort()).toEqual([
      'day',
      'minutes',
      'season',
      'status',
      'weather',
    ])
  })

  it('rejects an invalid clock', () => {
    const r = parseSave(JSON.stringify({ ...defaultSave(), clock: { ...clock, day: 40 } }))
    expect(r).toEqual({ ok: false, error: 'The save clock is invalid.' })
  })

  it('defaults the farm when absent and rejects an invalid one', () => {
    const old: Partial<ReturnType<typeof defaultSave>> = defaultSave()
    delete old.farm
    const r = parseSave(JSON.stringify(old))
    expect(r.ok && r.data.farm).toEqual(defaultFarm())
    const bad = parseSave(JSON.stringify({ ...old, farm: { ...defaultFarm(), goal: 3 } }))
    expect(bad).toEqual({ ok: false, error: 'The save farm is invalid.' })
  })

  it('serializeSave includes the farm', () => {
    const s = { ...defaultSave(), farm: { ...defaultFarm(), goal: 'house:1' } }
    expect(JSON.parse(serializeSave(s)).farm.goal).toBe('house:1')
    expect(parseSave(serializeSave(s))).toEqual({ ok: true, data: s })
  })
})

describe('save remix', () => {
  it('defaults remixed to false and picks to empty for old saves', () => {
    const old = defaultSave() as unknown as Record<string, unknown>
    const profile = { ...(old.profile as Record<string, unknown>) }
    delete profile.remixed
    delete old.remix
    const r = parseSave(JSON.stringify({ ...old, profile }))
    expect(r.ok && r.data.profile.remixed).toBe(false)
    expect(r.ok && r.data.remix).toEqual({ picks: {} })
    expect(defaultSave().profile.remixed).toBe(false)
    expect(defaultSave().remix).toEqual({ picks: {} })
  })

  it('round trips remixed and picks, keeping unknown ids', () => {
    const base = defaultSave()
    const s = {
      ...base,
      profile: { ...base.profile, remixed: true },
      remix: { picks: { 'unknown-slot': ['remix-x', 'remix-unknown'] } },
    }
    expect(parseSave(serializeSave(s))).toEqual({ ok: true, data: s })
    expect(JSON.parse(serializeSave(s)).profile.remixed).toBe(true)
    expect(JSON.parse(serializeSave(s)).remix.picks['unknown-slot']).toEqual(['remix-x', 'remix-unknown'])
  })

  it('rejects a non-boolean remixed', () => {
    const base = defaultSave()
    const r = parseSave(JSON.stringify({ ...base, profile: { ...base.profile, remixed: 'yes' } }))
    expect(r).toEqual({ ok: false, error: 'The save remix setting is invalid.' })
  })

  it('rejects invalid picks', () => {
    const base = defaultSave()
    const msg = { ok: false, error: 'The save remix picks are invalid.' }
    expect(parseSave(JSON.stringify({ ...base, remix: { picks: { s: 'remix-x' } } }))).toEqual(msg)
    expect(parseSave(JSON.stringify({ ...base, remix: { picks: { s: ['a', 3] } } }))).toEqual(msg)
    expect(parseSave(JSON.stringify({ ...base, remix: { picks: [] } }))).toEqual(msg)
    expect(parseSave(JSON.stringify({ ...base, remix: 'x' }))).toEqual(msg)
  })
})
