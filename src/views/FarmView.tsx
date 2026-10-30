import Masonry from '../components/Masonry'
import CropsCard from '../components/farm/CropsCard'

export default function FarmView() {
  return (
    <div className="farm">
      <h1>Farm</h1>
      <Masonry>{[<CropsCard key="crops" />]}</Masonry>
    </div>
  )
}
