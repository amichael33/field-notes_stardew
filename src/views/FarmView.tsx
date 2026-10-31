import ReadyToday from '../components/farm/ReadyToday'
import NextGoal from '../components/farm/NextGoal'
import CropsBox from '../components/farm/CropsBox'

export default function FarmView() {
  return (
    <div className="farm">
      <h1>Farm</h1>
      <div className="farm-grid">
        <div className="farm-main">
          <ReadyToday />
          <NextGoal />
        </div>
        <aside className="farm-side">
          <CropsBox />
        </aside>
      </div>
    </div>
  )
}
