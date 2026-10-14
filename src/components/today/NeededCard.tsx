import type { Bundle, BundleItem } from '../../data/types'
import { bundleItemsBySeason } from '../../data/selectors'
import { useAppState } from '../../state/AppState'
import { useSave } from '../../state/SaveContext'
import bundlesJson from '../../data/bundles.json'

const bundles = bundlesJson as Bundle[]

export default function NeededCard() {
  const { season } = useAppState()
  const route = useSave().save.profile.route
  const grouped = new Map<Bundle, BundleItem[]>()
  for (const { bundle, item } of bundleItemsBySeason(bundles, season)) {
    grouped.set(bundle, [...(grouped.get(bundle) ?? []), item])
  }
  return (
    <section className="card aside-card">
      <h2>Needed this season</h2>
      {route === 'joja' ? (
        <p>Bundles are not used on the Joja route.</p>
      ) : grouped.size === 0 ? (
        <p>No bundle items available this season.</p>
      ) : (
        [...grouped.entries()].map(([bundle, items]) => (
          <div key={bundle.id} className="needed-bundle">
            <div className="needed-head">
              <strong>{bundle.name}</strong>
              <span className="when">0 of {bundle.slotsRequired}</span>
            </div>
            <div className="progress" aria-hidden="true">
              <div className="progress-fill" style={{ width: '0%' }} />
            </div>
            <p className="when needed-label">Still needed</p>
            <ul aria-label={`Still needed for ${bundle.name}`}>
              {items.map((item, i) => (
                <li key={`${item.name}-${i}`}>
                  {item.name}
                  {item.quantity > 1 && ` ×${item.quantity}`}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
