import { NavLink, Outlet } from 'react-router-dom'
import SeasonFilter from './SeasonFilter'
import RouteToggle from './RouteToggle'

const LINKS = [
  { to: '/path', label: 'Path' },
  { to: '/bundles', label: 'Bundles' },
  { to: '/villagers', label: 'Villagers' },
  { to: '/achievements', label: 'Achievements' },
]

export default function Layout() {
  return (
    <div className="app">
      <header>
        <div className="site-title">Stardew Field Notes</div>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="controls">
          <SeasonFilter />
          <RouteToggle />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
