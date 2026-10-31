import ReadyToday from '../components/farm/ReadyToday'

export default function FarmView() {
  return (
    <div className="farm">
      <h1>Farm</h1>
      <div className="farm-grid">
        <div className="farm-main">
          <ReadyToday />
        </div>
        <aside className="farm-side" />
      </div>
    </div>
  )
}
