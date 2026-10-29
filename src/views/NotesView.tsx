import BulletNotes from '../components/BulletNotes'

export default function NotesView() {
  return (
    <section className="card">
      <h1>Notes</h1>
      <BulletNotes id="notes-page-input" label="Notes" className="notes-input notes-page-input" />
    </section>
  )
}
