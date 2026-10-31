import { BUILDINGS, UPGRADES } from '../../data/farm-lookup'
import { goalReached, targetById, type BuildTarget } from '../../data/farm-build'
import { useSave } from '../../state/SaveContext'

export const gold = (n: number) => `${n.toLocaleString('en-US')}g`

/** True when a goal is set but the building is already built. */
export function useGoalReached(): boolean {
  const { save } = useSave()
  return save.farm.goal !== null && goalReached(save.farm, save.farm.goal, BUILDINGS, UPGRADES)
}

/** The building goal still to build, if there is one. */
export function useGoalTarget(): BuildTarget | undefined {
  const { save } = useSave()
  const reached = useGoalReached()
  return save.farm.goal === null || reached ? undefined : targetById(save.farm.goal, BUILDINGS, UPGRADES)
}
