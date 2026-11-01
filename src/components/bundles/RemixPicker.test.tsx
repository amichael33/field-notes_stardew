import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import { defaultSave, serializeSave } from '../../state/save'
import RemixPicker from './RemixPicker'
import type { Bundle, RemixSlot } from '../../data/types'

const b = (id: string): Bundle => ({
  id,
  room: 'Pantry',
  name: 'Name ' + id,
  reward: 'Reward ' + id,
  slotsRequired: 1,
  items: [{ name: 'Thing ' + id, quantity: 1, seasons: 'any', source: 'Here' }],
})
const alts: RemixSlot = {
  id: 'a',
  kind: 'alternatives',
  pick: 1,
  bundles: ['remix-1', 'remix-2', 'remix-3'].map(b),
}
const pool: RemixSlot = { id: 'p', kind: 'pool', pick: 2, bundles: ['remix-1', 'remix-2', 'remix-3'].map(b) }
const picks = () => JSON.parse(localStorage.getItem('field-notes-save')!).remix.picks

describe('RemixPicker', () => {
  beforeEach(() => localStorage.clear())

  it('titles the card and lists the candidates with their rewards', () => {
    renderWithState(<RemixPicker slot={alts} roomName="Pantry" />)
    expect(screen.getByRole('heading', { name: 'Pantry: Name remix-1 or Name remix-2 or Name remix-3' })).toBeInTheDocument()
    expect(screen.getByText(/Pick 1/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Name remix-/ })).toHaveLength(3)
    expect(screen.getByText('Reward: Reward remix-2')).toBeInTheDocument()
  })

  it('titles a pool with its pick count and a collapsed slot names what was picked', async () => {
    renderWithState(<RemixPicker slot={pool} roomName="Boiler Room" />)
    expect(screen.getByRole('heading', { name: 'Boiler Room: pick 2 of 3 bundles' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-1/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-3/ }))
    expect(screen.getByText(/Picked: Name remix-1, Name remix-3/)).toBeInTheDocument()
    expect(screen.queryByText(/of 2 picked/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Boiler Room/ }).closest('article')).toHaveClass('no-print')
  })

  it('the button name includes the bundle name and reward', () => {
    renderWithState(<RemixPicker slot={alts} roomName="Pantry" />)
    expect(screen.getByRole('button', { name: /Name remix-2.*Reward: Reward remix-2/ })).toBeInTheDocument()
  })

  it('marks unpicked candidates aria-disabled once a pool is full', async () => {
    renderWithState(<RemixPicker slot={pool} roomName="Boiler Room" />)
    const third = () => screen.getByRole('button', { name: /^Name remix-3/ })
    expect(third()).not.toHaveAttribute('aria-disabled')
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-1/ }))
    expect(third()).not.toHaveAttribute('aria-disabled')
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-2/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(third()).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /^Name remix-1/ })).not.toHaveAttribute('aria-disabled')
  })

  it('picking an alternative saves it and collapses; Change reopens', async () => {
    renderWithState(<RemixPicker slot={alts} roomName="Pantry" />)
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-2/ }))
    expect(picks()).toEqual({ a: ['remix-2'] })
    expect(screen.queryByRole('button', { name: /^Name remix-1/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(screen.getByRole('button', { name: /^Name remix-2/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^Name remix-1/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('a pool counts picks and refuses one past pick', async () => {
    localStorage.setItem(
      'field-notes-save',
      serializeSave({ ...defaultSave(), remix: { picks: { p: ['remix-1'] } } }),
    )
    renderWithState(<RemixPicker slot={pool} roomName="Boiler Room" />)
    expect(screen.getByText(/1 of 2 picked/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-2/ }))
    expect(screen.getByText(/Picked: Name remix-1, Name remix-2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Change' }))
    await userEvent.click(screen.getByRole('button', { name: /^Name remix-3/ }))
    expect(picks()).toEqual({ p: ['remix-1', 'remix-2'] })
    expect(screen.getByText(/2 of 2 picked/)).toBeInTheDocument()
  })
})
