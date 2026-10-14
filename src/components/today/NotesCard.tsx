import { useSave } from '../../state/SaveContext'

export default function NotesCard() {
  const { save, setNotes } = useSave()
  return (
    <section className="card aside-card">
      <h2 id="notes-heading">Notes for tomorrow</h2>
      <label className="visually-hidden" htmlFor="notes-input">
        Notes for tomorrow
      </label>
      <textarea
        id="notes-input"
        className="notes-input"
        rows={5}
        value={save.notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </section>
  )
}
