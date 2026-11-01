import type { Bundle, RemixRoom, RemixSlot } from './types'

type Picks = Record<string, string[]>

/** The bundles the player has in this slot: a fixed slot's own, else the picked ones in slot order, capped at `pick`. */
export function chosenBundles(slot: RemixSlot, picks: Picks): Bundle[] {
  if (slot.kind === 'fixed') return slot.bundles
  const picked = new Set(picks[slot.id] ?? [])
  return slot.bundles.filter((bundle) => picked.has(bundle.id)).slice(0, slot.pick)
}

export function activeRemixBundles(rooms: RemixRoom[], picks: Picks): Bundle[] {
  return rooms.flatMap((room) => room.slots.flatMap((slot) => chosenBundles(slot, picks)))
}

export function slotNeedsPick(slot: RemixSlot, picks: Picks): boolean {
  return slot.kind !== 'fixed' && chosenBundles(slot, picks).length < slot.pick
}

/** Picks or unpicks a bundle; a pick-1 slot swaps its pick, a fuller pool refuses. Never mutates. */
export function togglePick(slot: RemixSlot, picks: Picks, bundleId: string): Picks {
  if (slot.kind === 'fixed' || !slot.bundles.some((bundle) => bundle.id === bundleId)) {
    return { ...picks }
  }
  const current = chosenBundles(slot, picks).map((bundle) => bundle.id)
  if (current.includes(bundleId)) {
    return { ...picks, [slot.id]: current.filter((id) => id !== bundleId) }
  }
  if (slot.pick === 1) return { ...picks, [slot.id]: [bundleId] }
  if (current.length >= slot.pick) return { ...picks }
  return { ...picks, [slot.id]: [...current, bundleId] }
}

export function activeBundles(
  mode: 'standard' | 'remixed',
  standard: Bundle[],
  rooms: RemixRoom[],
  picks: Picks,
): Bundle[] {
  return mode === 'remixed' ? activeRemixBundles(rooms, picks) : standard
}
