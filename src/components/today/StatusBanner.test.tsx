import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithState } from '../../test-utils'
import StatusBanner from './StatusBanner'
import type { Clock, PathStep } from '../../data/types'
import { defaultSave, serializeSave } from '../../state/save'
import steps from '../../data/path-steps.json'

const nextStep = [...steps].sort((a, b) => a.order - b.order)[0] as PathStep

const banner = () => within(screen.getByRole('region', { name: 'Today status' }))
const editor = () => within(screen.getByRole('form', { name: 'Clock editor' }))
const start = () => userEvent.click(screen.getByRole('button', { name: 'Start day' }))

function seed(clock: Clock) {
  localStorage.setItem('field-notes-save', serializeSave({ ...defaultSave(), clock }))
}

describe('StatusBanner', () => {
  it('with no clock shows Start day and the stand-in label only', () => {
    renderWithState(<StatusBanner nextStep={nextStep} />)
    expect(banner().getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(banner().getByRole('button', { name: 'Start day' })).toBeInTheDocument()
    expect(banner().getByText('Spring 1', { selector: '.banner-when' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+10' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '-10' })).not.toBeInTheDocument()
  })

  it('Start day shows the date, time and Pause', async () => {
    renderWithState(<StatusBanner nextStep={nextStep} />)
    await start()
    expect(banner().getByText('Spring 1 · Mon')).toBeInTheDocument()
    expect(banner().getByText('6:00 AM')).toBeInTheDocument()
    expect(banner().getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('Pause toggles to Resume and back', async () => {
    renderWithState(<StatusBanner nextStep={nextStep} />)
    await start()
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('+10 advances and -10 stops at 6:00 AM', async () => {
    renderWithState(<StatusBanner nextStep={nextStep} />)
    await start()
    await userEvent.click(screen.getByRole('button', { name: '-10' }))
    expect(banner().getByText('6:00 AM')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '+10' }))
    expect(banner().getByText('6:10 AM')).toBeInTheDocument()
  })

  it('weather buttons use aria-pressed', async () => {
    renderWithState(<StatusBanner nextStep={nextStep} />)
    await start()
    const rain = screen.getByRole('button', { name: 'Rain' })
    const sunny = screen.getByRole('button', { name: 'Sunny' })
    expect(sunny).toHaveAttribute('aria-pressed', 'true')
    expect(rain).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(rain)
    expect(rain).toHaveAttribute('aria-pressed', 'true')
    expect(sunny).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(sunny)
    expect(rain).toHaveAttribute('aria-pressed', 'false')
    expect(sunny).toHaveAttribute('aria-pressed', 'true')
  })

  it('an ended clock shows Day over and Start day moves to the next date', async () => {
    seed({ season: 'spring', day: 1, minutes: 1560, weather: 'sunny', status: 'ended' })
    renderWithState(<StatusBanner nextStep={nextStep} />)
    expect(banner().getByText('Day over')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
    await start()
    expect(banner().getByText('Spring 2 · Tue')).toBeInTheDocument()
    expect(banner().getByText('6:00 AM')).toBeInTheDocument()
  })

  async function openEditor() {
    renderWithState(<StatusBanner nextStep={nextStep} />)
    await start()
    await userEvent.click(screen.getByRole('button', { name: 'Set time and date' }))
  }

  it('the editor applies season, day and time', async () => {
    await openEditor()
    await userEvent.selectOptions(editor().getByLabelText('Season'), 'fall')
    await userEvent.clear(editor().getByLabelText('Day'))
    await userEvent.type(editor().getByLabelText('Day'), '3')
    await userEvent.selectOptions(editor().getByLabelText('Time'), '1:00 PM')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(banner().getByText('Fall 3 · Wed')).toBeInTheDocument()
    expect(banner().getByText('1:00 PM')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Clock editor' })).not.toBeInTheDocument()
  })

  it('Cancel closes the editor with no change', async () => {
    await openEditor()
    await userEvent.selectOptions(editor().getByLabelText('Season'), 'fall')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('form', { name: 'Clock editor' })).not.toBeInTheDocument()
    expect(banner().getByText('Spring 1 · Mon')).toBeInTheDocument()
  })

  it.each(['', '0', '29', '2.5'])('an invalid day %j cannot be applied', async (bad) => {
    await openEditor()
    const day = editor().getByLabelText('Day')
    await userEvent.clear(day)
    if (bad) await userEvent.type(day, bad)
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
    expect(banner().getByText('Spring 1 · Mon')).toBeInTheDocument()
  })
})
