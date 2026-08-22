import { useSyncExternalStore } from 'react'
import type { CellKey } from '../gameOfLife'
import type { LiveCellStore } from '../liveCellStore'

// Thin useSyncExternalStore adapter over a single cell's boolean membership.
// This is the leaf subscription that lets a per-cell component re-render
// only when its own cell flips, instead of the whole grid re-rendering on
// every generation because liveCells is a prop-drilled Set with a new
// identity each tick -- see liveCellStore.ts's module header.
//
// WHY PER CELL, NOT PER TILE: this question was raised and re-litigated
// during the tile-virtualized-cells design, and the answer is a React fact,
// not a store fact -- a component boundary is the only cheap bailout unit,
// so the subscription's placement *is* the re-render granularity. Hoisting
// this subscription up to CellTile (one useSyncExternalStore per 16 cells
// instead of per cell) looks like a win but isn't: React Compiler memoizes a
// *loop's result array* on the loop's dependencies, not each iteration's
// element, so one flipped cell changes the array's dependencies and rebuilds
// all TILE_SPAN_CELLS**2 <Cell> elements -- the O(visible) walk in miniature,
// bounded at 16x rather than unbounded. It also saves nothing store-side (a
// tile subscribing to its own 16 cells still makes 16 subscribeCell calls,
// same Map/Set churn) and would need liveCellStore.ts to know the view's
// tile span to do better, coupling the domain module to a rendering
// strategy. CellTile.test.tsx's "a store mutation re-renders only the
// flipped cell, not its tile-mates" test pins this at the component level so
// a future hoist is caught in `npm test`, not rediscovered by argument.
//
// WHY useSyncExternalStore, NOT useReducer+useEffect: this app renders
// synchronously throughout (verified whole-tree: no Suspense, no lazy(), no
// setInterval/setTimeout, and the only requestAnimationFrame --
// useRafCoalescedPan's -- never touches the store), so the tearing guarantee
// useSyncExternalStore is best known for is unreachable here rather than
// load-bearing. What it buys instead, for free, is closing the
// render-then-effect subscribe window: an effect-based subscription
// registers *after* commit, so a store mutation landing in that window would
// be missed entirely (stale forever, not transiently) -- useSyncExternalStore
// re-checks the snapshot at subscribe time and closes that gap.
//
// WHY THE BOARD NEVER SHOWS A MIXED GENERATION: not enforced by this hook.
// liveCellStore.ts's single publish() funnel notifies every flipped listener
// synchronously, and React batches those into one render pass and one
// commit, so every flipped Cell commits together. This hook only does
// subscription routing.
//
// WHAT WOULD CHANGE THIS: all three of (a) a playback timer returning (Wave
// B, dropped rather than deleted -- store.advance currently has exactly one
// caller, GenerationHud's button click), (b) a transition being wanted, and
// (c) the store being able to mutate mid-gesture. Absent any one of the
// three the analysis above holds. If all three ever hold at once, the
// primitive swaps behind this file's (store, key) -> boolean interface
// without touching any caller.
//
// Measured, for scale: generation-advance-50k @ 5042ab3 (2026-08-22) is 94%
// model computation (Script 28.48ms / Style 1.72ms), and
// generation-advance-1k-inview -- the case where flips actually render -- is
// 4.67ms total, comfortably inside budget. Rendering is not the bottleneck in
// either measured case, so a subscription-granularity change here would not
// be chasing a measured cost.
export function useLiveCell(store: LiveCellStore, key: CellKey): boolean {
  return useSyncExternalStore(
    (listener) => store.subscribeCell(key, listener),
    () => store.getCellSnapshot(key),
  )
}
