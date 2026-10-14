import { bundleItemsBySeason } from '../data/selectors'
import { useAppState } from '../state/AppState'
import { useSave } from '../state/SaveContext'
import type { Bundle, BundleItem } from '../data/types'
import bundlesJson from '../data/bundles.json'

export default function BundlesView({ bundles = bundlesJson as Bundle[] }: { bundles?: Bundle[] }) {
  const { season } = useAppState()
  const route = useSave().save.profile.route

  if (route === 'joja') {
    return (
      <section>
        <h1>Community Center</h1>
        <p>Bundles are not used on the Joja route.</p>
      </section>
    )
  }

  const rows = bundleItemsBySeason(bundles, season)
  const grouped = new Map<Bundle, BundleItem[]>()
  for (const { bundle, item } of rows) {
    grouped.set(bundle, [...(grouped.get(bundle) ?? []), item])
  }

  return (
    <section>
      <h1>Community Center</h1>
      {grouped.size === 0 ? (
        <p>No bundle items available this season.</p>
      ) : (
        <div className="cols">
          {[...grouped.entries()].map(([bundle, items]) => (
          <article key={bundle.id} className="card">
            <h2>
              {bundle.name} <span className="when">{bundle.room}, reward: {bundle.reward}</span>
            </h2>
            <p className="when">
              Fill {bundle.slotsRequired} of {bundle.items.length} slots
            </p>
            <ul>
              {items.map((item, i) => (
                <li key={`${item.name}-${i}`}>
                  <span>{item.name}</span>
                  {item.quantity > 1 && <span> ×{item.quantity}</span>}
                  <span className="when"> {item.source}</span>
                </li>
              ))}
            </ul>
          </article>
          ))}
        </div>
      )}
    </section>
  )
}
