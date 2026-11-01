import type { Bundle, BundleItem, RemixRoom } from '../../data/types'
import { bundleItemId, bundleItemsBySeason, bundleProgress } from '../../data/selectors'
import { useAppState } from '../../state/AppState'
import { useSave } from '../../state/SaveContext'
import ItemRow from '../ItemRow'
import { gold, nextJojaStep } from '../../data/joja'
import { activeBundles, slotNeedsPick } from '../../data/remix'
import bundlesJson from '../../data/bundles.json'
import remixedJson from '../../data/remixed-bundles.json'

const standard = bundlesJson as Bundle[]
const remixRooms = remixedJson as RemixRoom[]

export default function NeededCard() {
  const { season: filter } = useAppState()
  const { save } = useSave()
  // Only what can be done now: the season filter if one is picked, otherwise the clock's season.
  const season = filter !== 'all' ? filter : (save.clock?.season ?? 'spring')
  const route = save.profile.route
  const nextJoja = nextJojaStep(save.checked)
  const remixed = save.profile.remixed
  const bundles = activeBundles(remixed ? 'remixed' : 'standard', standard, remixRooms, save.remix.picks)
  const needsPick =
    remixed && remixRooms.some((room) => room.slots.some((slot) => slotNeedsPick(slot, save.remix.picks)))
  const grouped = new Map<Bundle, { item: BundleItem; index: number }[]>()
  // Only season-specific items: year-round ones (bars, minerals, gold) can be done any time.
  for (const { bundle, item, index } of bundleItemsBySeason(bundles, season)) {
    if (item.seasons === 'any') continue
    grouped.set(bundle, [...(grouped.get(bundle) ?? []), { item, index }])
  }
  return (
    <section className="card aside-card">
      <h2>Needed this season</h2>
      <p className="when cap">For {season}</p>
      {route !== 'joja' && needsPick && <p>Pick your remixed bundles on the Community Center tab.</p>}
      {route === 'joja' ? (
        <>
          <p>Bundles are not used on the Joja route.</p>
          {nextJoja ? (
            <p>
              <strong>Next at JojaMart:</strong> {nextJoja.name}, {gold(nextJoja.price)}
            </p>
          ) : (
            <p>Every JojaMart project is bought.</p>
          )}
        </>
      ) : grouped.size === 0 ? (
        <p>No bundle items available this season.</p>
      ) : (
        [...grouped.entries()].map(([bundle, items]) => {
          const { obtained, required, complete } = bundleProgress(bundle, save.checked)
          const remaining = items.filter(
            ({ item, index }) => !save.checked.includes(bundleItemId(bundle, item, index)),
          )
          // Nothing seasonal left to get now (the rest is year-round): leave the bundle out.
          if (!complete && remaining.length === 0) return null
          return (
            <div key={bundle.id} className="needed-bundle">
              <div className="needed-head">
                <strong>{bundle.name}</strong>
                <span className="when">
                  {obtained} of {required}
                </span>
              </div>
              <div className="progress" aria-hidden="true">
                <div
                  className="progress-fill"
                  style={{ width: `${required > 0 ? Math.min(100, (obtained / required) * 100) : 0}%` }}
                />
              </div>
              {complete ? (
                <p className="when needed-label">Complete</p>
              ) : (
                <>
                  <p className="when needed-label">Still needed</p>
                  <ul className="item-list icon-grid" aria-label={`Still needed for ${bundle.name}`}>
                    {remaining.map(({ item, index }) => (
                      <li key={bundleItemId(bundle, item, index)}>
                        <ItemRow bundle={bundle} item={item} index={index} iconOnly />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )
        })
      )}
    </section>
  )
}
