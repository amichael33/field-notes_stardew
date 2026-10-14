import MarkdownNotes from '../components/MarkdownNotes'

export default function NotesView() {
  return (
    <section className="card">
      <h1>Notes</h1>
      <MarkdownNotes id="notes-page-input" label="Notes" className="notes-input notes-page-input" />
    </section>
  )
}
