import { useSyncExternalStore } from 'react'
import type { CellKey } from '../gameOfLife'
import type { LiveCellStore } from '../liveCellStore'

// Thin useSyncExternalStore adapter over a single cell's boolean membership.
// This is the leaf subscription that lets a per-cell component re-render
// only when its own cell flips, instead of the whole grid re-rendering on
// every generation because liveCells is a prop-drilled Set with a new
// identity each tick -- see liveCellStore.ts's module header.
export function useLiveCell(store: LiveCellStore, key: CellKey): boolean {
  return useSyncExternalStore(
    (listener) => store.subscribeCell(key, listener),
    () => store.getCellSnapshot(key),
  )
}
