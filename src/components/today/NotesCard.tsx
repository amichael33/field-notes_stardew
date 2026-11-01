import BulletNotes from '../BulletNotes'

export default function NotesCard() {
  return (
    <section className="card aside-card">
      <h2 id="notes-heading">Notes</h2>
      <BulletNotes id="notes-input" label="Notes" className="notes-input" />
    </section>
  )
}
