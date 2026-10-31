import { BUILDINGS, UPGRADES } from '../../data/farm-lookup'
import { targetById, type BuildTarget } from '../../data/farm-build'
import { useSave } from '../../state/SaveContext'

export const gold = (n: number) => `${n.toLocaleString('en-US')}g`

export function useGoalTarget(): BuildTarget | undefined {
  const { save } = useSave()
  return save.farm.goal === null ? undefined : targetById(save.farm.goal, BUILDINGS, UPGRADES)
}
