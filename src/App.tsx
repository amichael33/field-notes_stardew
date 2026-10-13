import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import Layout from './components/Layout'
import PathView from './views/PathView'
import BundlesView from './views/BundlesView'
import VillagersView from './views/VillagersView'
import AchievementsView from './views/AchievementsView'

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/path" element={<PathView />} />
            <Route path="/bundles" element={<BundlesView />} />
            <Route path="/villagers" element={<VillagersView />} />
            <Route path="/achievements" element={<AchievementsView />} />
            <Route path="*" element={<Navigate to="/path" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
