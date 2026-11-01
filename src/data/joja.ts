import jojaJson from './joja.json'

export interface JojaStep {
  id: string
  name: string
  price: number
}

export const JOJA = jojaJson
export const MEMBERSHIP: JojaStep = JOJA.store.membership
export const PROJECTS: (JojaStep & { description: string })[] = JOJA.projects
export const JOJA_TOTAL = PROJECTS.reduce((n, p) => n + p.price, 0)

/** Checked ids for the Joja route live in the save's checklist as `joja:<id>`. */
export const jojaId = (id: string) => `joja:${id}`

/** The next thing to buy on the Joja route: the membership, then the projects in order. */
export function nextJojaStep(checked: string[]): JojaStep | undefined {
  return [MEMBERSHIP, ...PROJECTS].find((s) => !checked.includes(jojaId(s.id)))
}

export const gold = (n: number) => `${n.toLocaleString('en-US')}g`
