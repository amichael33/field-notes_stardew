import { bundleItemId, bundleItemsBySeason, bundleProgress, roomRank, roomStatus } from '../data/selectors'
import { useAppState } from '../state/AppState'
import { useSave } from '../state/SaveContext'
import ItemRow from '../components/ItemRow'
import Masonry from '../components/Masonry'
import ModeSwitch from '../components/bundles/ModeSwitch'
import RemixPicker from '../components/bundles/RemixPicker'
import { activeBundles } from '../data/remix'
import type { Bundle, BundleItem, RemixRoom } from '../data/types'
import bundlesJson from '../data/bundles.json'
import remixedJson from '../data/remixed-bundles.json'

const remixRooms = remixedJson as RemixRoom[]

export default function BundlesView({ bundles: standard = bundlesJson as Bundle[] }: { bundles?: Bundle[] }) {
  const { season } = useAppState()
  const { save } = useSave()
  const route = save.profile.route

  if (route === 'joja') {
    return (
      <section>
        <h1>Community Center</h1>
        <p>Bundles are not used on the Joja route.</p>
      </section>
    )
  }

  const remixed = save.profile.remixed
  const bundles = activeBundles(remixed ? 'remixed' : 'standard', standard, remixRooms, save.remix.picks)
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

  const pickers = remixed
    ? remixRooms.flatMap((room) =>
        room.slots
          .filter((slot) => slot.kind !== 'fixed')
          .map((slot) => <RemixPicker key={slot.id} slot={slot} roomName={room.room} />),
      )
    : []
  const allCards = [...pickers, ...cards]

  return (
    <section>
      <h1>Community Center</h1>
      <ModeSwitch />
      {allCards.length === 0 ? <p>No bundle items available this season.</p> : <Masonry>{allCards}</Masonry>}
    </section>
  )
}
