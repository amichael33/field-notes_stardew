import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { AppStateProvider } from './state/AppState'
import SeasonFilter from './components/SeasonFilter'
import RouteToggle from './components/RouteToggle'

/** Renders a view inside AppStateProvider with the season filter and route toggle alongside. */
export function renderWithState(ui: ReactElement) {
  return render(
    <AppStateProvider>
      <SeasonFilter />
      <RouteToggle />
      {ui}
    </AppStateProvider>,
  )
}
