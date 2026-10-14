import type { PathStep } from '../../data/types'
import { stepWhen } from '../../data/when'

const SOON = 'coming with the clock'

export default function StatusBanner({ nextStep }: { nextStep?: PathStep }) {
  const label = (nextStep && stepWhen(nextStep)) || 'Opening route'
  return (
    <section className="banner" aria-label="Today status">
      <div className="banner-main">
        <h1>Today</h1>
        <p className="banner-when">{label}</p>
        <p className="banner-note">Live day tracking is coming with the clock.</p>
      </div>
      <div className="banner-controls">
        <div className="banner-clock">
          <span className="clock-face">--:--</span>
          <span className="banner-soon">{SOON}</span>
        </div>
        <div className="banner-buttons">
          {['Pause', '-10', '+10', 'Resync'].map((name) => (
            <button key={name} type="button" className="banner-btn" disabled>
              {name}
            </button>
          ))}
        </div>
        <div className="weather-toggle" role="group" aria-label="Weather">
          <button type="button" className="banner-btn" disabled>
            Sunny
          </button>
          <button type="button" className="banner-btn" disabled>
            Rain
          </button>
        </div>
      </div>
    </section>
  )
}
