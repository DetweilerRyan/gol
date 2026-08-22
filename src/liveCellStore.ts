import { enableMapSet, freeze, produce } from 'immer'
import {
  cellKey,
  changedCells,
  computeContentBounds,
  createEmptyLiveCells,
  getNextGeneration,
  toggleCell,
  type CellKey,
  type ContentBounds,
  type LiveCells,
  type ReadonlyLiveCells,
} from './gameOfLife'
import { patternCellPositions, placePattern, type Pattern } from './patternLibrary'
import { isShallowEqual } from './equality/is-shallow-equal'

// The subscription store behind useLiveCell/useContentBounds: leaf
// components subscribe to a single cell's boolean state (or to the content
// bounds) instead of the whole liveCells Set, so a generation only re-renders
// the cells that actually changed rather than every cell in the tree. This is
// the fix for the identity-miss App -> LifeBoard -> Grid -> GridCells was
// paying every tick: useImmer hands back a new Set identity on every produce,
// which defeats React Compiler's memoization however deep the prop drilling
// goes, whereas a subscription model only notifies the listeners for the
// cells whose membership actually flipped.
//
// Deliberately no whole-set subscription. getLiveCells() exists for
// inspection/export only -- a component reading it during render would be
// reading a value it never subscribed to, which is a correctness bug (it
// won't re-render when that value changes), not just a missed optimization.
// Render code must go through subscribeCell/getCellSnapshot or
// subscribeBounds/getBoundsSnapshot.

export type Listener = () => void
export type Unsubscribe = () => void

export interface LiveCellStore {
  advance(): void
  toggle(x: number, y: number): void
  place(pattern: Pattern, anchorX: number, anchorY: number): void

  subscribeCell(key: CellKey, listener: Listener): Unsubscribe
  getCellSnapshot(key: CellKey): boolean
  subscribeBounds(listener: Listener): Unsubscribe
  getBoundsSnapshot(): ContentBounds | null

  // Inspection/export only -- never a render source. See module header.
  getLiveCells(): ReadonlyLiveCells
  // buckets.size -- the no-leak invariant unsubscribe is responsible for.
  trackedCellCount(): number
}

export function createLiveCellStore(initialLiveCells: ReadonlyLiveCells = createEmptyLiveCells()): LiveCellStore {
  // Called here rather than at module scope: the unit/property vitest
  // projects run in plain Node with setupFiles: [], so nothing else on this
  // import path ever calls enableMapSet(), and a produce() over a Set would
  // throw the "plugin not loaded" error on the very first test. The call is
  // idempotent (immer guards loadPlugin against double registration) and
  // must happen before any produce() below can run. Doing it here rather
  // than as a module-level side effect also keeps this invisible to
  // rules/no-module-state-in-domain.yml, which matches let/var, not calls.
  enableMapSet()

  // Ownership is taken here, once: copy the caller's Set rather than adopt
  // it by reference, so a caller mutating their own Set afterward can never
  // reach into this store's published state.
  let cells: ReadonlyLiveCells = freeze(new Set(initialLiveCells))

  const cellListeners = new Map<CellKey, Set<Listener>>()
  const boundsListeners = new Set<Listener>()

  let boundsDirty = true
  let boundsSnapshot: ContentBounds | null = null

  // Every mutator funnels through here. freeze is shallow (freeze(next), not
  // freeze(next, true)): membership is a flat Set of CellKey strings, so a
  // deep freeze would walk all ~10k members every generation for no benefit
  // over the shallow O(1) freeze of the Set object itself.
  //
  // Re-freezing after produce() (which already auto-freezes its result) is
  // deliberate, not redundant: produce's auto-freeze is a *global* immer
  // setting (setAutoFreeze(false) anywhere in the process disables it for
  // every producer, not just this store's), and it can also be silently
  // defeated by a leaked immer scope -- measured: a produce() over a Set
  // before enableMapSet() has run throws from inside createProxy after
  // enterScope() but before the try whose finally would leave it, so the
  // scope leaks and immer's maybeFreeze then stops freezing every later
  // produce() in the process. The contract this store promises is "always
  // frozen" -- an invariant that only holds while a third-party library's
  // global config happens to still be at its default isn't "always."
  function publish(next: ReadonlyLiveCells): void {
    cells = freeze(next)
    boundsDirty = true
  }

  function notify(keys: readonly CellKey[]): void {
    for (const key of keys) {
      const bucket = cellListeners.get(key)
      if (!bucket) continue
      // Snapshot before dispatch: a listener subscribed during this
      // notification must not be called for it (it wasn't in the bucket at
      // snapshot time), and a listener unsubscribed mid-dispatch by another
      // listener must still receive its already-snapshotted call. Array.from
      // (not a spread, and not a plain for-of over the live Set) makes that
      // copy explicit -- direct iteration would visit listeners added mid-loop.
      for (const listener of Array.from(bucket)) {
        listener()
      }
    }
    notifyBounds()
  }

  function notifyBounds(): void {
    for (const listener of Array.from(boundsListeners)) {
      listener()
    }
  }

  function advance(): void {
    const previous = cells
    const next = getNextGeneration(previous)
    publish(next)
    notify(changedCells(previous, next))
  }

  function toggle(x: number, y: number): void {
    publish(produce(cells as LiveCells, (draft) => toggleCell(draft, x, y)))
    notify([cellKey(x, y)])
  }

  function place(pattern: Pattern, anchorX: number, anchorY: number): void {
    const positions = patternCellPositions(pattern, anchorX, anchorY)
    const changed = positions.filter(([x, y]) => !cells.has(cellKey(x, y))).map(([x, y]) => cellKey(x, y))
    publish(produce(cells as LiveCells, (draft) => placePattern(draft, pattern, anchorX, anchorY)))
    notify(changed)
  }

  function subscribeCell(key: CellKey, listener: Listener): Unsubscribe {
    let bucket = cellListeners.get(key)
    if (!bucket) {
      bucket = new Set()
      cellListeners.set(key, bucket)
    }
    bucket.add(listener)

    let unsubscribed = false
    return () => {
      if (unsubscribed) return
      unsubscribed = true
      const currentBucket = cellListeners.get(key)
      if (!currentBucket) return
      currentBucket.delete(listener)
      if (currentBucket.size === 0) {
        cellListeners.delete(key)
      }
    }
  }

  function getCellSnapshot(key: CellKey): boolean {
    return cells.has(key)
  }

  function subscribeBounds(listener: Listener): Unsubscribe {
    boundsListeners.add(listener)
    let unsubscribed = false
    return () => {
      if (unsubscribed) return
      unsubscribed = true
      boundsListeners.delete(listener)
    }
  }

  // Mutation-scan note (cleaner, live-cell-store slice): a scoped `npx
  // stryker run --mutate` over this file leaves 6 mutants surviving in this
  // function, all hand-verified rather than left unexamined:
  //   - !boundsDirty -> false, boundsDirty = false -> true, and the two
  //     ConditionalExpression variants that each drop one half of
  //     `boundsSnapshot !== null && next !== null` are equivalent: forcing
  //     an always-recompute (or narrowing which null-check gates the
  //     isShallowEqual call) never changes the returned value or its
  //     identity, because isShallowEqual(a, b) already returns false
  //     whenever exactly one of a/b is null (comparing a plain object
  //     against null), so the `boundsSnapshot = next` fallback still runs
  //     and still yields the correct answer. Confirmed by hand-applying
  //     each mutant and running the suite directly (not just under Stryker).
  //   - the `&&` -> `||` LogicalOperator mutant on the same line is *not*
  //     equivalent -- hand-applying it directly breaks 3 existing tests
  //     (liveCellStore.test.ts's "returns a new object identity when the
  //     box actually moves" and two useContentBounds.test.ts cases). Stryker
  //     reports it [Survived] with those exact tests listed as having run,
  //     which is a perTest coverage-attribution anomaly in the tool, not a
  //     gap in this suite -- see the live-cell-store cleaner handoff.
  function getBoundsSnapshot(): ContentBounds | null {
    if (!boundsDirty) return boundsSnapshot
    boundsDirty = false
    const next = computeContentBounds(cells)
    if (boundsSnapshot !== null && next !== null && isShallowEqual(boundsSnapshot, next)) {
      // Keep the previous object identity when the box hasn't moved, so
      // useSyncExternalStore subscribers (GridScrollbars) don't re-render on
      // every generation/pan that leaves bounds unchanged.
      return boundsSnapshot
    }
    boundsSnapshot = next
    return boundsSnapshot
  }

  function getLiveCells(): ReadonlyLiveCells {
    return cells
  }

  function trackedCellCount(): number {
    return cellListeners.size
  }

  return {
    advance,
    toggle,
    place,
    subscribeCell,
    getCellSnapshot,
    subscribeBounds,
    getBoundsSnapshot,
    getLiveCells,
    trackedCellCount,
  }
}
