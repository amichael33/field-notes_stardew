import { useState } from 'react'
import ItemIcon from '../ItemIcon'
import { chosenBundles, slotNeedsPick, togglePick } from '../../data/remix'
import type { RemixSlot } from '../../data/types'
import { useSave } from '../../state/SaveContext'

export default function RemixPicker({ slot, roomName }: { slot: RemixSlot; roomName: string }) {
  const { save, setRemixPicks } = useSave()
  const [open, setOpen] = useState(false)
  const picks = save.remix.picks
  const picked = new Set(chosenBundles(slot, picks).map((bundle) => bundle.id))
  const complete = !slotNeedsPick(slot, picks)
  const collapsed = complete && !open
  const count = slot.pick === 1 ? 'Pick 1' : `${picked.size} of ${slot.pick} picked`

  return (
    <article className="card bundle-card remix-picker">
      <h2>{roomName}: pick your bundles</h2>
      <p className="when">
        {count}
        {complete && (
          <>
            {' '}
            <button type="button" className="btn-small no-print" onClick={() => setOpen(!open)}>
              {open ? 'Done' : 'Change'}
            </button>
          </>
        )}
      </p>
      {!collapsed && (
        <ul className="remix-candidates">
          {slot.bundles.map((bundle) => (
            <li key={bundle.id}>
              <button
                type="button"
                className="remix-candidate"
                aria-label={bundle.name}
                aria-pressed={picked.has(bundle.id)}
                onClick={() => setRemixPicks(togglePick(slot, picks, bundle.id))}
              >
                <strong>{bundle.name}</strong>
                <span className="when">Reward: {bundle.reward}</span>
                <span className="remix-pictures">
                  {[...new Set(bundle.items.map((item) => item.name))].map((name) => (
                    <ItemIcon key={name} name={name} />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
