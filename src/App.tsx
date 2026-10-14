import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import { SaveProvider } from './state/SaveContext'
import Layout from './components/Layout'
import PathView from './views/PathView'
import BundlesView from './views/BundlesView'
import VillagersView from './views/VillagersView'
import AchievementsView from './views/AchievementsView'
import NotesView from './views/NotesView'
import ComingSoonView from './views/ComingSoonView'

export default function App() {
  return (
    <SaveProvider>
      <AppStateProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/today" element={<PathView />} />
              <Route path="/community-center" element={<BundlesView />} />
              <Route path="/goals" element={<AchievementsView />} />
              <Route path="/people" element={<VillagersView />} />
              <Route
                path="/farm"
                element={<ComingSoonView title="Farm" note="Upload your planned farm layout here." />}
              />
              <Route path="/notes" element={<NotesView />} />
              <Route path="*" element={<Navigate to="/today" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppStateProvider>
    </SaveProvider>
  )
}
