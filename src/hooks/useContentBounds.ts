import { useSyncExternalStore } from 'react'
import type { ContentBounds } from '../gameOfLife'
import type { LiveCellStore } from '../liveCellStore'

// Thin useSyncExternalStore adapter over the store's lazily-recomputed,
// identity-stable content bounds -- see liveCellStore.ts's getBoundsSnapshot
// for why re-renders don't happen on every generation/pan that leaves the
// bounding box unchanged.
export function useContentBounds(store: LiveCellStore): ContentBounds | null {
  return useSyncExternalStore(
    (listener) => store.subscribeBounds(listener),
    () => store.getBoundsSnapshot(),
  )
}
