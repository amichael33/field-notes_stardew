import { useSave } from '../state/SaveContext'

export default function NotesView() {
  const { save, setNotes } = useSave()
  return (
    <section className="card">
      <h1>Notes</h1>
      <label className="visually-hidden" htmlFor="notes-page-input">
        Notes
      </label>
      <textarea
        id="notes-page-input"
        className="notes-input notes-page-input"
        rows={16}
        value={save.notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </section>
  )
}
