import MarkdownNotes from '../MarkdownNotes'

export default function NotesCard() {
  return (
    <section className="card aside-card">
      <h2 id="notes-heading">Notes for tomorrow</h2>
      <MarkdownNotes id="notes-input" label="Notes for tomorrow" className="notes-input" />
    </section>
  )
}
