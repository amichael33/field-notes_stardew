import { useEffect, useState, type ReactNode } from 'react'

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

/** Deals cards out row by row into columns, so each card starts where the one above it ends. */
export default function Masonry({ children }: { children: ReactNode[] }) {
  const count = useColumnCount()
  const columns: ReactNode[][] = Array.from({ length: Math.min(count, Math.max(1, children.length)) }, () => [])
  children.forEach((card, i) => columns[i % columns.length].push(card))
  return (
    <div className="cols masonry">
      {columns.map((col, i) => (
        <div key={i} className="masonry-col">
          {col}
        </div>
      ))}
    </div>
  )
}
