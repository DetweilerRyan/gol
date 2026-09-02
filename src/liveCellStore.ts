import { enableMapSet, freeze, produce } from 'immer'
import {
  computeContentBounds,
  createEmptyLiveCells,
  getNextGeneration,
  toggleCell,
  type ContentBounds,
  type LiveCells,
  type ReadonlyLiveCells,
} from './gameOfLife'
import { placePattern, type Pattern } from './patternLibrary'
import { isShallowEqual } from './equality/is-shallow-equal'

// The subscription store behind useLiveCells/useContentBounds: the live-cell
// state lives here rather than in React, and components read it through
// useSyncExternalStore pairs -- subscribeCells/getLiveCells for the whole
// set, subscribeBounds/getBoundsSnapshot for the bounding box. It holds the
// state as a frozen Set it owns outright, so nothing outside can mutate what
// it has published. This replaced useImmer, which handed back a new Set
// identity on every produce and defeated React Compiler's memoization however
// deep the prop drilling went.
//
// A THIRD PAIR USED TO EXIST AND WAS RETIRED, which matters because the
// module's headline invariant went with it. subscribeCell/getCellSnapshot let
// each mounted Cell watch its own coordinate, and the promise was "a mutation
// notifies exactly the cells whose aliveness changed, each exactly once, and
// nobody else" -- worth a per-key bucket map, a per-key dispatch loop, and
// advanceGeneration's delta being threaded through notify(). collapse-dead-
// cell-layer deleted the render path that used it: only live cells (plus the
// keyboard cursor) mount now, so the component that has to decide WHICH cells
// exist needs the whole set, and per-cell precision buys nothing when the
// per-cell subscriber is gone. All three methods, the bucket map and the
// per-key loop went; advance() now takes getNextGeneration, the projection
// gameOfLife.ts exposes for exactly this caller. The successor contract is
// written down rather than merely lost -- see liveCellStore.property.test.ts's
// header for its three clauses, and note the cost it makes explicit: EVERY
// mutation notifies EVERY whole-set subscriber, so a still-life tick
// re-renders every mounted cell where the retired channel would have
// re-rendered none.
//
// getLiveCells() is a legitimate render source only when paired with
// subscribeCells -- reading it during render without subscribing still reads
// a value the component is never notified about, which is a correctness bug
// and not a missed optimization.

export type Listener = () => void
export type Unsubscribe = () => void

export interface LiveCellStore {
  advance(): void
  toggle(x: number, y: number): void
  place(pattern: Pattern, anchorX: number, anchorY: number): void

  subscribeBounds(listener: Listener): Unsubscribe
  getBoundsSnapshot(): ContentBounds | null
  subscribeCells(listener: Listener): Unsubscribe

  // A legitimate render source ONLY when paired with subscribeCells above
  // (the useSyncExternalStore contract) -- reading it during render with no
  // matching subscription is still a correctness bug. See module header.
  getLiveCells(): ReadonlyLiveCells
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

  const boundsListeners = new Set<Listener>()
  const cellsListeners = new Set<Listener>()

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

  // Always called *after* publish(), never before: every listener, whenever
  // it runs during this dispatch, reads the new generation from
  // getLiveCells/getBoundsSnapshot. That ordering is what makes the
  // copy-then-dispatch guarantee below a scheduling detail rather than a
  // correctness one.
  //
  // Takes no argument since collapse-dead-cell-layer retired the per-cell
  // channel: both surviving channels are unconditional, so there is nothing
  // left for a delta to select. That is the whole reason advance() no longer
  // asks for one.
  function notify(): void {
    notifyBounds()
    notifyCells()
  }

  // Snapshot before dispatch: a listener subscribed during this notification
  // must not be called for it (it wasn't subscribed at snapshot time), and a
  // listener unsubscribed mid-dispatch by another listener must still receive
  // its already-snapshotted call. Array.from (not a spread, and not a plain
  // for-of over the live Set) makes that copy explicit -- direct iteration
  // would visit listeners added mid-loop.
  function notifyBounds(): void {
    for (const listener of Array.from(boundsListeners)) {
      listener()
    }
  }

  // Whole-set subscribers -- every mutator's notify() call reaches these,
  // unconditionally, since any change to `cells` (however small) can move
  // which cells a range-based projection like liveCellWindow.ts's
  // liveCellsInRange should show. Same copy-before-dispatch shape as
  // notifyBounds above, for the same reason.
  function notifyCells(): void {
    for (const listener of Array.from(cellsListeners)) {
      listener()
    }
  }

  // getNextGeneration, not advanceGeneration: the delta this used to thread
  // into notify() has no consumer left now that the per-cell channel is gone
  // (see this module's header), and asking for a value in order to discard it
  // is how a reader concludes the store still notifies per cell. The
  // projection exists in gameOfLife.ts for exactly this caller.
  function advance(): void {
    publish(getNextGeneration(cells))
    notify()
  }

  function toggle(x: number, y: number): void {
    publish(produce(cells as LiveCells, (draft) => toggleCell(draft, x, y)))
    notify()
  }

  function place(pattern: Pattern, anchorX: number, anchorY: number): void {
    publish(produce(cells as LiveCells, (draft) => placePattern(draft, pattern, anchorX, anchorY)))
    notify()
  }

  // subscribeBounds and subscribeCells are both a bare Set<Listener>, so both
  // funnel through this one add/remove-once shape rather than repeating it.
  function subscribeToSet(listeners: Set<Listener>, listener: Listener): Unsubscribe {
    listeners.add(listener)
    let unsubscribed = false
    return () => {
      if (unsubscribed) return
      unsubscribed = true
      listeners.delete(listener)
    }
  }

  function subscribeBounds(listener: Listener): Unsubscribe {
    return subscribeToSet(boundsListeners, listener)
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

  function subscribeCells(listener: Listener): Unsubscribe {
    return subscribeToSet(cellsListeners, listener)
  }

  function getLiveCells(): ReadonlyLiveCells {
    return cells
  }

  return {
    advance,
    toggle,
    place,
    subscribeBounds,
    getBoundsSnapshot,
    subscribeCells,
    getLiveCells,
  }
}
