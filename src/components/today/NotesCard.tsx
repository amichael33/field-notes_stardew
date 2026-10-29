import BulletNotes from '../BulletNotes'

export default function NotesCard() {
  return (
    <section className="card aside-card">
      <h2 id="notes-heading">Notes for tomorrow</h2>
      <BulletNotes id="notes-input" label="Notes for tomorrow" className="notes-input" />
    </section>
  )
}
