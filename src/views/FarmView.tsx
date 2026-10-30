import Masonry from '../components/Masonry'
import BuildingsCard from '../components/farm/BuildingsCard'
import CropsCard from '../components/farm/CropsCard'

export default function FarmView() {
  return (
    <div className="farm">
      <h1>Farm</h1>
      <Masonry>{[<BuildingsCard key="buildings" />, <CropsCard key="crops" />]}</Masonry>
    </div>
  )
}
