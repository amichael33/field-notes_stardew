import Masonry from '../components/Masonry'
import AnimalsCard from '../components/farm/AnimalsCard'
import BuildingsCard from '../components/farm/BuildingsCard'
import CropsCard from '../components/farm/CropsCard'
import ProgressCard from '../components/farm/ProgressCard'

export default function FarmView() {
  return (
    <div className="farm">
      <h1>Farm</h1>
      <Masonry>
        {[
          <BuildingsCard key="buildings" />,
          <AnimalsCard key="animals" />,
          <CropsCard key="crops" />,
          <ProgressCard key="progress" />,
        ]}
      </Masonry>
    </div>
  )
}
