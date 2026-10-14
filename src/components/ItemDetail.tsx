import { useEffect, useId, useRef } from 'react'
import type { Bundle, BundleItem } from '../data/types'

interface Props {
  bundle: Bundle
  item: BundleItem
  open: boolean
  onClose: () => void
}

export default function ItemDetail({ bundle, item, open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const live = useRef(open)

  // Escape can fire keydown, cancel and close; report the close only once.
  const handleClose = () => {
    if (!live.current) return
    live.current = false
    onClose()
  }

  useEffect(() => {
    live.current = open
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
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={(e) => {
        e.preventDefault()
        handleClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          handleClose()
        }
      }}
    >
      <h3 id={titleId}>{item.name}</h3>
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
      <button type="button" className="item-detail-close" onClick={handleClose}>
        Close
      </button>
    </dialog>
  )
}
