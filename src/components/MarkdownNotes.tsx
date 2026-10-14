import { useState } from 'react'
import Markdown from 'react-markdown'
import { useSave } from '../state/SaveContext'

type Props = { id: string; label: string; className?: string }

export default function MarkdownNotes({ id, label, className }: Props) {
  const { save, setNotes } = useSave()
  const [preview, setPreview] = useState(false)
  return (
    <div className="markdown-notes">
      <div className="notes-toggle">
        <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>
          Edit
        </button>
        <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>
          Preview
        </button>
      </div>
      {preview ? (
        <div className="notes-preview" aria-label={`${label} preview`} role="region">
          <Markdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {save.notes}
          </Markdown>
        </div>
      ) : (
        <>
          <label className="visually-hidden" htmlFor={id}>
            {label}
          </label>
          <textarea
            id={id}
            className={className}
            value={save.notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </>
      )}
    </div>
  )
}
