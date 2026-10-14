import type { Bundle, BundleItem } from '../../data/types'
import { bundleItemId, bundleItemsBySeason, bundleProgress } from '../../data/selectors'
import { useAppState } from '../../state/AppState'
import { useSave } from '../../state/SaveContext'
import ItemRow from '../ItemRow'
import bundlesJson from '../../data/bundles.json'

const bundles = bundlesJson as Bundle[]

export default function NeededCard() {
  const { season } = useAppState()
  const { save } = useSave()
  const route = save.profile.route
  const grouped = new Map<Bundle, { item: BundleItem; index: number }[]>()
  for (const { bundle, item, index } of bundleItemsBySeason(bundles, season)) {
    grouped.set(bundle, [...(grouped.get(bundle) ?? []), { item, index }])
  }
  return (
    <section className="card aside-card">
      <h2>Needed this season</h2>
      {route === 'joja' ? (
        <p>Bundles are not used on the Joja route.</p>
      ) : grouped.size === 0 ? (
        <p>No bundle items available this season.</p>
      ) : (
        [...grouped.entries()].map(([bundle, items]) => {
          const { obtained, required, complete } = bundleProgress(bundle, save.checked)
          const remaining = items.filter(({ item, index }) => !save.checked.includes(bundleItemId(bundle, item, index)))
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
                  <ul className="item-list" aria-label={`Still needed for ${bundle.name}`}>
                    {remaining.map(({ item, index }) => (
                      <li key={bundleItemId(bundle, item, index)}>
                        <ItemRow bundle={bundle} item={item} index={index} />
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
