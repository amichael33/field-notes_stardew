import { formatTime } from '../../state/clock'
import type { Location } from '../../data/types'

/** "Place since 9:00 AM, then Next at 5:00 PM", or "At home until 7:00 AM, then Place". */
export function describeLocation(loc: Location): string {
  if (loc.since === null) {
    return loc.next
      ? `At home until ${formatTime(loc.next.time)}, then ${loc.next.place}`
      : 'At home'
  }
  const now = `${loc.place} since ${formatTime(loc.since)}`
  return loc.next ? `${now}, then ${loc.next.place} at ${formatTime(loc.next.time)}` : now
}
