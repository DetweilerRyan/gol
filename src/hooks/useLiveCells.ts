import { useSyncExternalStore } from 'react'
import type { ReadonlyLiveCells } from '../gameOfLife'
import type { LiveCellStore } from '../liveCellStore'

/**
 * Thin useSyncExternalStore adapter over the store's WHOLE live-cell set --
 * mirrors useContentBounds.ts's shape exactly. Needed because
 * liveCellsInRange (liveCellWindow.ts) has to see every live cell to decide
 * which fall inside the current mounted window; the accepted cost is that a
 * generation tick now re-renders every mounted cell, not just the ones that
 * flipped.
 */
// See liveCellStore.ts's module header for why a whole-set subscriber is a
// legitimate render source now, not the during-render-with-no-subscription
// bug that comment used to warn against, and this slice's step-4 handoff
// for the two perf scenarios that show the regression and why it isn't
// fixed here.
export function useLiveCells(store: LiveCellStore): ReadonlyLiveCells {
  return useSyncExternalStore(
    (listener) => store.subscribeCells(listener),
    () => store.getLiveCells(),
  )
}
