import { NavLink, Outlet } from 'react-router-dom'
import SeasonFilter from './SeasonFilter'
import RouteToggle from './RouteToggle'

const TABS = [
  { to: '/today', label: 'Today' },
  { to: '/community-center', label: 'Community Center' },
  { to: '/goals', label: 'Goals' },
  { to: '/people', label: 'People' },
  { to: '/farm', label: 'Farm' },
  { to: '/notes', label: 'Notes' },
]

export default function Layout() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div className="site-title">Field Notes</div>
          <nav aria-label="Pages">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} className="tab">
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button type="button" className="btn" onClick={() => window.print()}>
              Print page
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="controls">
          <SeasonFilter />
          <RouteToggle />
        </div>
        <Outlet />
      </main>
      <footer className="site-footer">
        Unofficial fan project. Not affiliated with ConcernedApe. Game data from the community wiki.
      </footer>
    </div>
  )
}
