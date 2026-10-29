import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { useSave } from '../state/SaveContext'
import { autoBullet, bulletEnter, bulletIndent, type Edit } from './bullets'

type Props = { id: string; label: string; className?: string }

/** Plain-text notes. A typed "- " becomes a bullet, Enter continues it and Tab nests it. */
export default function BulletNotes({ id, label, className }: Props) {
  const { save, setNotes } = useSave()
  const ref = useRef<HTMLTextAreaElement>(null)
  const pending = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (pending.current !== null && ref.current) {
      ref.current.setSelectionRange(pending.current, pending.current)
      pending.current = null
    }
  })

  const apply = (edit: Edit) => {
    pending.current = edit.cursor
    setNotes(edit.value)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const box = e.currentTarget
    if (box.selectionStart !== box.selectionEnd) return
    let edit: Edit | null = null
    if (e.key === 'Enter' && !e.shiftKey) edit = bulletEnter(box.value, box.selectionStart)
    else if (e.key === 'Tab') edit = bulletIndent(box.value, box.selectionStart, e.shiftKey)
    if (edit) {
      e.preventDefault()
      apply(edit)
    }
  }

  const addBullet = () => {
    const box = ref.current
    const value = save.notes
    const pos = box ? box.selectionStart : value.length
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1
    const text = pos > lineStart ? '\n• ' : '• '
    apply({ value: value.slice(0, pos) + text + value.slice(pos), cursor: pos + text.length })
    box?.focus()
  }

  return (
    <div className="bullet-notes">
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        ref={ref}
        className={className}
        value={save.notes}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          const auto = autoBullet(e.target.value, e.target.selectionStart)
          if (auto) apply(auto)
          else setNotes(e.target.value)
        }}
      />
      <div className="notes-hint">
        <button type="button" className="btn-small" onClick={addBullet}>
          Add bullet
        </button>
        <span className="when">Type a dash and a space for a bullet. Enter continues it, Tab nests it.</span>
      </div>
    </div>
  )
}
