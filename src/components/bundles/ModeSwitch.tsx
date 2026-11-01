import { useSave } from '../../state/SaveContext'

export default function ModeSwitch() {
  const { save, setRemixed } = useSave()
  const remixed = save.profile.remixed
  return (
    <div className="mode-switch no-print" role="group" aria-label="Bundle mode">
      <button type="button" aria-pressed={!remixed} onClick={() => setRemixed(false)}>
        Standard
      </button>
      <button type="button" aria-pressed={remixed} onClick={() => setRemixed(true)}>
        Remixed
      </button>
    </div>
  )
}
