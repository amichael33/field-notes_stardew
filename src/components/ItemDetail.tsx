import { useEffect, useRef } from 'react'
import type { Bundle, BundleItem } from '../data/types'

interface Props {
  bundle: Bundle
  item: BundleItem
  open: boolean
  onClose: () => void
}

export default function ItemDetail({ bundle, item, open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const seasons = item.seasons === 'any' ? 'any season' : item.seasons.join(', ')

  return (
    <dialog
      ref={ref}
      className="item-detail"
      aria-labelledby={`item-detail-${bundle.id}-${item.name}`}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }}
    >
      <h3 id={`item-detail-${bundle.id}-${item.name}`}>{item.name}</h3>
      <dl>
        <dt>Quantity</dt>
        <dd>{item.quantity}</dd>
        <dt>Source</dt>
        <dd>{item.source}</dd>
        <dt>Seasons</dt>
        <dd>{seasons}</dd>
        <dt>Bundle</dt>
        <dd>{bundle.name}</dd>
      </dl>
      <button type="button" className="item-detail-close" onClick={onClose}>
        Close
      </button>
    </dialog>
  )
}
