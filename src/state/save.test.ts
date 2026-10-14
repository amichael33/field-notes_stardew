import { describe, it, expect } from 'vitest'
import { defaultSave, parseSave, serializeSave, toggleChecked } from './save'

describe('save', () => {
  it('defaultSave has the community-center route and no progress', () => {
    const s = defaultSave()
    expect(s.version).toBe(1)
    expect(s.profile).toEqual({ route: 'community-center', farmType: 'standard' })
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
