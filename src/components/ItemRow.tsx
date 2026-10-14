import { useEffect, useRef, useState } from 'react'
import type { Bundle, BundleItem } from '../data/types'
import { useSave } from '../state/SaveContext'
import { bundleItemId } from '../data/selectors'
import ItemIcon from './ItemIcon'
import ItemDetail from './ItemDetail'

interface Props {
  bundle: Bundle
  item: BundleItem
  showSource?: boolean
  index?: number
}

export default function ItemRow({ bundle, item, showSource, index }: Props) {
  const { save, toggle } = useSave()
  const [open, setOpen] = useState(false)
  const iconButton = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const id = bundleItemId(bundle, item, index)
  const obtained = save.checked.includes(id)

  useEffect(() => {
    if (wasOpen.current && !open) iconButton.current?.focus()
    wasOpen.current = open
  }, [open])

  return (
    <div className={obtained ? 'item-row obtained' : 'item-row'}>
      <button
        type="button"
        ref={iconButton}
        className="item-icon-btn"
        aria-label={`Details for ${item.name}`}
        onClick={() => setOpen(true)}
      >
        <ItemIcon name={item.name} />
      </button>
      <button type="button" className="item-name-btn" aria-pressed={obtained} onClick={() => toggle(id)}>
        <span className="item-name">
          {item.name}
          {item.quantity > 1 && <span className="item-qty"> x{item.quantity}</span>}
        </span>
        {showSource && <span className="item-source">{item.source}</span>}
      </button>
      {open && <ItemDetail bundle={bundle} item={item} open onClose={() => setOpen(false)} />}
    </div>
  )
}
