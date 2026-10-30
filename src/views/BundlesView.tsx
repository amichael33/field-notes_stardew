import { useEffect, useState, type ReactNode } from 'react'
import {
  bundleItemId,
  bundleItemsBySeason,
  bundleProgress,
  roomRank,
  roomStatus,
} from '../data/selectors'
import { useAppState } from '../state/AppState'
import { useSave } from '../state/SaveContext'
import ItemRow from '../components/ItemRow'
import type { Bundle, BundleItem } from '../data/types'
import bundlesJson from '../data/bundles.json'

const columnsFor = (w: number) => (w < 560 ? 1 : w < 860 ? 2 : w < 1120 ? 3 : 4)

/** Columns that fit the window, so cards can be dealt out left to right and still stagger. */
function useColumnCount(): number {
  const [n, setN] = useState(() => columnsFor(typeof window === 'undefined' ? 1200 : window.innerWidth))
  useEffect(() => {
    const onResize = () => setN(columnsFor(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return n
}

export default function BundlesView({ bundles = bundlesJson as Bundle[] }: { bundles?: Bundle[] }) {
  const { season } = useAppState()
  const { save } = useSave()
  const route = save.profile.route
  const columnCount = useColumnCount()

  if (route === 'joja') {
    return (
      <section>
        <h1>Community Center</h1>
        <p>Bundles are not used on the Joja route.</p>
      </section>
    )
  }

  const rows = bundleItemsBySeason(bundles, season)
  const grouped = new Map<Bundle, { item: BundleItem; index: number }[]>()
  for (const { bundle, item, index } of rows) {
    grouped.set(bundle, [...(grouped.get(bundle) ?? []), { item, index }])
  }

  // Open bundles first, then locked ones, then finished ones last.
  const rank = (b: Bundle) =>
    bundleProgress(b, save.checked).complete ? 2 : roomStatus(b.room, bundles, save.checked).unlocked ? 0 : 1
  const ordered = [...grouped.entries()].sort(
    ([a], [b]) => rank(a) - rank(b) || roomRank(a.room) - roomRank(b.room),
  )

  const cards = ordered.map(([bundle, items]) => {
    const status = roomStatus(bundle.room, bundles, save.checked)
    const done = bundleProgress(bundle, save.checked).complete
    const state = done ? 'Complete' : status.unlocked ? 'Unlocked' : 'Locked'
    return (
      <article
        key={bundle.id}
        className={`card bundle-card${status.unlocked ? '' : ' locked'}${done ? ' done' : ''}`}
      >
        <p className={status.unlocked ? 'room-status open' : 'room-status'}>
          {state}: {bundle.room}
          {!status.unlocked && (
            <span className="when">
              {' '}
              {status.hint} You have {status.have} of {status.need}.
            </span>
          )}
        </p>
        <h2>
          {bundle.name}{' '}
          <span className="when">
            {bundle.room}, reward: {bundle.reward}
          </span>
        </h2>
        <p className="when">
          Fill {bundle.slotsRequired} of {bundle.items.length} slots
        </p>
        <ul className="item-list">
          {items.map(({ item, index }) => (
            <li key={bundleItemId(bundle, item, index)}>
              <ItemRow bundle={bundle} item={item} index={index} showSource />
            </li>
          ))}
        </ul>
      </article>
    )
  })

  // Deal the cards out row by row so the first row holds the first cards.
  const columns: ReactNode[][] = Array.from({ length: Math.min(columnCount, Math.max(1, cards.length)) }, () => [])
  cards.forEach((card, i) => columns[i % columns.length].push(card))

  return (
    <section>
      <h1>Community Center</h1>
      {grouped.size === 0 ? (
        <p>No bundle items available this season.</p>
      ) : (
        <div className="cols masonry">
          {columns.map((col, i) => (
            <div key={i} className="masonry-col">
              {col}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
