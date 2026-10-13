export default function ComingSoonView({ title, note }: { title: string; note: string }) {
  return (
    <section className="card">
      <h1>{title}</h1>
      <p>Coming soon. {note}</p>
    </section>
  )
}
