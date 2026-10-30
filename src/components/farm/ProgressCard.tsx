import { BUILDINGS, UPGRADES } from '../../data/farm-lookup'
import { savingOptions, savingProgress } from '../../data/farm'
import { SKILLS, TOOLS } from '../../state/farm-save'
import { useSave } from '../../state/SaveContext'
import ItemIcon from '../ItemIcon'

const LEVELS = ['Basic', 'Copper', 'Steel', 'Gold', 'Iridium']
const MAX_SKILL = 10

const gold = (n: number) => `${n.toLocaleString('en-US')}g`

const wholeNumber = (raw: string) => {
  const n = Math.floor(Number(raw))
  return Number.isFinite(n) ? n : 0
}

export default function ProgressCard() {
  const { save, updateFarm } = useSave()
  const farm = save.farm
  const options = savingOptions(BUILDINGS, UPGRADES)
  const progress = savingProgress(farm, options)
  const selected = options.some((o) => o.id === farm.saving) ? (farm.saving as string) : ''
  const percent = progress ? Math.round(Math.min(1, progress.fraction) * 100) : 0

  return (
    <section className="card" aria-label="Progress">
      <h2>Progress</h2>
      <ul className="path-list">
        {TOOLS.map((tool) => {
          const level = Math.min(Math.max(farm.tools[tool] ?? 0, 0), 4)
          const next = UPGRADES.find((u) => u.id === `tool:${tool}:${level + 1}`)
          return (
            <li key={tool} className="path-row plan-row">
              <div className="row-body">
                <label>
                  <strong>{tool}</strong>{' '}
                  <select
                    aria-label={`${tool} level`}
                    value={level}
                    onChange={(e) =>
                      updateFarm((f) => ({ ...f, tools: { ...f.tools, [tool]: Number(e.target.value) } }))
                    }
                  >
                    {LEVELS.map((name, i) => (
                      <option key={name} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                {level >= 4 ? (
                  <p className="row-detail">Fully upgraded</p>
                ) : (
                  next && (
                    <>
                      <p className="row-detail">{`Next: ${next.label}, ${gold(next.cost)}`}</p>
                      <span className="icon-grid" role="list">
                        {next.materials.map((m) => (
                          <span
                            key={m.item}
                            className="item-icon-only"
                            role="listitem"
                            title={`${m.amount} ${m.item}`}
                          >
                            <ItemIcon name={m.item} />
                            <span className="item-stack">{m.amount}</span>
                          </span>
                        ))}
                      </span>
                    </>
                  )
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <ul className="path-list">
        {SKILLS.map((skill) => (
          <li key={skill} className="path-row plan-row">
            <label className="row-body">
              <strong>{skill}</strong>{' '}
              <input
                type="number"
                aria-label={`${skill} level`}
                min={0}
                max={MAX_SKILL}
                step={1}
                value={farm.skills[skill] ?? 0}
                onChange={(e) => {
                  const value = Math.min(MAX_SKILL, Math.max(0, wholeNumber(e.target.value)))
                  updateFarm((f) => ({ ...f, skills: { ...f.skills, [skill]: value } }))
                }}
              />
            </label>
          </li>
        ))}
      </ul>
      <p>
        <label>
          <strong>Gold</strong>{' '}
          <input
            type="number"
            aria-label="Gold"
            min={0}
            step={1}
            value={farm.gold}
            onChange={(e) => {
              const value = Math.max(0, wholeNumber(e.target.value))
              updateFarm((f) => ({ ...f, gold: value }))
            }}
          />
        </label>
      </p>
      <p>
        <label>
          <strong>Saving for</strong>{' '}
          <select
            aria-label="Saving for"
            value={selected}
            onChange={(e) => updateFarm((f) => ({ ...f, saving: e.target.value || null }))}
          >
            <option value="">Nothing</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </p>
      {progress && (
        <div>
          <div
            role="progressbar"
            aria-label="Saving progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="progress"
          >
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="row-detail">{`${gold(farm.gold)} of ${gold(progress.cost)}`}</p>
        </div>
      )}
    </section>
  )
}
