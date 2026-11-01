import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithState } from '../../test-utils'
import NeededCard from './NeededCard'
import { defaultSave, serializeSave } from '../../state/save'

vi.mock('../../data/remixed-bundles.json', () => ({
  default: [
    {
      room: 'Crafts Room',
      slots: [
        {
          id: 'fixed-1',
          kind: 'fixed',
          pick: 1,
          bundles: [
            {
              id: 'remix-fixed-spring',
              room: 'Crafts Room',
              name: 'Fixed Spring',
              reward: 'Seeds',
              slotsRequired: 1,
              items: [{ name: 'Leek', quantity: 1, seasons: ['spring'], source: 'Forage' }],
            },
          ],
        },
        {
          id: 'pool-1',
          kind: 'pool',
          pick: 1,
          bundles: [
            {
              id: 'remix-pool-spring',
              room: 'Crafts Room',
              name: 'Pool Spring',
              reward: 'Seeds',
              slotsRequired: 1,
              items: [{ name: 'Daffodil', quantity: 1, seasons: ['spring'], source: 'Forage' }],
            },
          ],
        },
      ],
    },
  ],
}))

const PICK_LINE = 'Pick your remixed bundles on the Community Center tab.'

function seed(remixed: boolean, picks: Record<string, string[]> = {}) {
  const d = defaultSave()
  localStorage.setItem(
    'field-notes-save',
    serializeSave({ ...d, profile: { ...d.profile, remixed }, remix: { picks } }),
  )
}

describe('NeededCard remixed', () => {
  beforeEach(() => localStorage.clear())

  it('lists a fixed remixed bundle, not the standard ones, and prompts for unpicked slots', () => {
    seed(true)
    renderWithState(<NeededCard />)
    expect(screen.getByText('Fixed Spring')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Leek' })).toBeInTheDocument()
    expect(screen.queryByText('Spring Crops')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Wild Horseradish' })).not.toBeInTheDocument()
    expect(screen.getByText(PICK_LINE)).toBeInTheDocument()
    expect(screen.queryByText('Pool Spring')).not.toBeInTheDocument()
  })

  it('drops the prompt and lists the pick once every slot is picked', () => {
    seed(true, { 'pool-1': ['remix-pool-spring'] })
    renderWithState(<NeededCard />)
    expect(screen.queryByText(PICK_LINE)).not.toBeInTheDocument()
    expect(screen.getByText('Pool Spring')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Daffodil' })).toBeInTheDocument()
  })

  it('is unchanged in standard mode', () => {
    seed(false)
    renderWithState(<NeededCard />)
    expect(screen.getByRole('button', { name: 'Wild Horseradish' })).toBeInTheDocument()
    expect(screen.queryByText('Fixed Spring')).not.toBeInTheDocument()
    expect(screen.queryByText(PICK_LINE)).not.toBeInTheDocument()
  })
})
