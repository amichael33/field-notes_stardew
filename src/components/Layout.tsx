import { useRef, useState, type ChangeEvent } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useSave } from '../state/SaveContext'
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

function readFile(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export default function Layout() {
  const { exportSave, importSave, saveError } = useSave()
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  function handleExport() {
    const blob = new Blob([exportSave()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'field-notes-save.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setMessage('Exported field-notes-save.json')
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    try {
      const result = importSave(await readFile(file))
      setMessage(result.ok ? 'Imported your saved progress.' : `Import failed. ${result.error}`)
    } catch {
      setMessage('Import failed. The file could not be read.')
    }
    input.value = ''
  }

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
            <button type="button" className="btn" onClick={handleExport}>
              Export
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              Import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              aria-label="Import save file"
              className="visually-hidden"
              tabIndex={-1}
              onChange={handleImport}
            />
          </div>
        </div>
        <div className="header-status">
          {saveError && <span role="alert">Couldn't save. Your progress may be lost when you close this tab.</span>}
          <span role="status">{message}</span>
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
