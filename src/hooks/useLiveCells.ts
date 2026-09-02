import { useSyncExternalStore } from 'react'
import type { ReadonlyLiveCells } from '../gameOfLife'
import type { LiveCellStore } from '../liveCellStore'

// Thin useSyncExternalStore adapter over the store's WHOLE live-cell set --
// mirrors useContentBounds.ts's shape exactly (subscribeCells/getLiveCells
// is the same pair, added alongside subscribeBounds/getBoundsSnapshot at
// this slice's step 1; see liveCellStore.ts's module header for why a
// whole-set subscriber is a legitimate render source now, not the
// during-render-with-no-subscription bug that comment used to warn against).
//
// collapse-dead-cell-layer step 4's one new render source: liveCellsInRange
// (liveCellWindow.ts) has to see every live cell to decide which ones fall
// inside the current mounted window, so Grid now needs the whole set, not
// just its own cell's membership the way Cell.tsx's retired useLiveCell call
// did. This is the accepted, named regression -- a generation tick
// re-renders every mounted cell now, not just the ones that flipped -- see
// this slice's step-4 handoff for the two perf scenarios that show it and
// why it isn't fixed here.
export function useLiveCells(store: LiveCellStore): ReadonlyLiveCells {
  return useSyncExternalStore(
    (listener) => store.subscribeCells(listener),
    () => store.getLiveCells(),
  )
}
