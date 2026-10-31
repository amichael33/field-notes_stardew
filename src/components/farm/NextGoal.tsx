import { useSave } from '../../state/SaveContext'
import FarmSprite from './FarmSprite'
import GoalMaterials from './GoalMaterials'
import { gold, useGoalTarget } from './goal'

export default function NextGoal() {
  const { save, updateFarm } = useSave()
  const target = useGoalTarget()
  const clear = (
    <button type="button" className="btn-small no-print" onClick={() => updateFarm((f) => ({ ...f, goal: null }))}>
      Clear goal
    </button>
  )

  return (
    <section className="card">
      <h2>Next goal</h2>
      {save.farm.goal === null ? (
        <p>Pick a goal with ★ in Buildings.</p>
      ) : !target ? (
        <>
          <p>Unknown goal</p>
          {clear}
        </>
      ) : (
        <>
          <p className="goal-title">
            <FarmSprite kind="building" id={target.id} />
            <strong>{target.name}</strong>
          </p>
          {target.builder && target.buildDays !== null && (
            <p className="row-detail">{`from ${target.builder}, ${target.buildDays} ${target.buildDays === 1 ? 'day' : 'days'}`}</p>
          )}
          <p>{gold(target.cost)}</p>
          <GoalMaterials target={target} />
          {clear}
        </>
      )}
    </section>
  )
}
