import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { cellKey, createEmptyLiveCells, type CellKey, type ContentBounds, type LiveCells } from './gameOfLife'
import { createLiveCellStore, type LiveCellStore } from './liveCellStore'
import { PATTERNS, patternCellPositions, type Pattern } from './patternLibrary'
import { referenceChangedCells, referenceNextGeneration } from './test-support/lifeReference'

// What this file exists to pin down, and what nothing else can:
//
// The whole point of the store is that a mutation notifies *only* the cells
// whose aliveness actually flipped. A store that notified every subscriber on
// every mutation would render exactly the same pixels -- every rendering
// test, every Gherkin scenario and every e2e spec would still pass -- and the
// slice would have bought nothing. "Notifies too many" is a performance bug
// wearing a correct-behavior disguise, so it has to be asserted directly, as
// a per-listener call count rather than as set equality (a set cannot see a
// double-notify) and against subscribers that are *guaranteed* to exist on
// unchanged cells rather than ones the generator might happen to draw.

// Same bounded coordinate space as gameOfLife.property.test.ts, for the same
// reason: it keeps the brute-force oracle in test-support cheap while still
// covering negative coordinates.
const coordinate = fc.integer({ min: -8, max: 8 })
const point = fc.tuple(coordinate, coordinate)
const pattern = fc.uniqueArray(point, { maxLength: 25 })
const anyPattern = fc.constantFrom(...PATTERNS)

// Fixed cells no generated board and no stamped pattern can reach: the
// coordinate space above is bounded to [-8, 8], patterns are stamped at
// anchors in the same range and are at most a few cells across, and one
// generation grows a board by at most one cell in each direction. Subscribing
// here is how "and no other listener at all" gets witnesses in every single
// run instead of only in the runs where the draw happened to leave a cell
// untouched -- the exact gap that let a defect survive three roles a slice ago.
const SENTINELS: readonly CellKey[] = [cellKey(500, 500), cellKey(-500, -500), cellKey(0, 400), cellKey(-400, 0)]

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

// Plain closure counters rather than vi.fn(): this file's properties run
// hundreds of subscriptions per case and are covering tests for a large
// mutant set, so the spy bookkeeping would be paid back thousands of times
// over in hardener's mutation run for no extra information.
function subscribeCounters(store: LiveCellStore, keys: Iterable<CellKey>): Map<CellKey, number> {
  const calls = new Map<CellKey, number>()
  for (const key of new Set(keys)) {
    calls.set(key, 0)
    store.subscribeCell(key, () => calls.set(key, (calls.get(key) ?? 0) + 1))
  }
  return calls
}

// Asserts the headline invariant in one place: every watched cell that
// changed was notified exactly once, and every watched cell that didn't was
// not notified at all. Compared as objects so a failure names the offending
// cell instead of just reporting 1 !== 0.
function expectNotifiedExactlyOnce(calls: Map<CellKey, number>, expectedChanged: ReadonlySet<CellKey>): void {
  for (const [key, count] of calls) {
    expect({ key, count }).toEqual({ key, count: expectedChanged.has(key) ? 1 : 0 })
  }
}

function footprintKeys(pattern: Pattern, anchorX: number, anchorY: number): CellKey[] {
  return patternCellPositions(pattern, anchorX, anchorY).map(([x, y]) => cellKey(x, y))
}

describe('advance (property)', () => {
  it.prop([pattern])('notifies exactly the cells whose aliveness changed, each exactly once', (coords) => {
    const initial = makeLiveCells(coords)
    const store = createLiveCellStore(initial)

    // Oracle: an independent brute-force generation, diffed as two finished
    // sets. Deliberately not advanceGeneration's own single-pass delta, which
    // is the thing under test.
    const expectedNext = referenceNextGeneration(initial)
    const expectedChanged = referenceChangedCells(initial, expectedNext)

    // Watch the previous generation, the next one, and the sentinels. That
    // union always contains every cell that could change, every cell that
    // survives unchanged (previous n next), and cells that are dead before
    // and after -- so both halves of "exactly" have witnesses.
    const calls = subscribeCounters(store, [...initial, ...expectedNext, ...SENTINELS])

    store.advance()

    expectNotifiedExactlyOnce(calls, expectedChanged)
  })

  it.prop([pattern])('leaves the published set equal to an independent brute-force generation', (coords) => {
    const initial = makeLiveCells(coords)
    const store = createLiveCellStore(initial)

    store.advance()

    expect(new Set(store.getLiveCells())).toEqual(referenceNextGeneration(initial))
  })

  // Degenerate boards pinned deterministically rather than left to the draw.
  it('notifies nobody on an empty board', () => {
    const store = createLiveCellStore(createEmptyLiveCells())
    const calls = subscribeCounters(store, [...SENTINELS, cellKey(0, 0)])

    store.advance()

    expectNotifiedExactlyOnce(calls, new Set())
  })

  it('notifies nobody for a still life whose every cell survives unchanged', () => {
    // The case the generator cannot be relied on to produce: subscribers that
    // sit *inside* the live board and stay alive across the tick. A store
    // that notified "everything currently alive" instead of "everything that
    // changed" would pass every rendering test and fail only here.
    const block = makeLiveCells([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
    const store = createLiveCellStore(block)
    const calls = subscribeCounters(store, [...block, ...SENTINELS])

    store.advance()

    expectNotifiedExactlyOnce(calls, new Set())
  })

  it('notifies the lone cell that dies with zero live neighbors', () => {
    const store = createLiveCellStore(makeLiveCells([[0, 0]]))
    const calls = subscribeCounters(store, [cellKey(0, 0), ...SENTINELS])

    store.advance()

    expectNotifiedExactlyOnce(calls, new Set([cellKey(0, 0)]))
  })

  it.prop([pattern, fc.integer({ min: 1, max: 4 })])(
    'notifies exactly the changed cells on every tick of a repeated advance, not just the first',
    (coords, ticks) => {
      const store = createLiveCellStore(makeLiveCells(coords))

      for (let tick = 0; tick < ticks; tick++) {
        const before = new Set(store.getLiveCells())
        const expectedNext = referenceNextGeneration(before)
        const calls = subscribeCounters(store, [...before, ...expectedNext, ...SENTINELS])

        store.advance()

        expectNotifiedExactlyOnce(calls, referenceChangedCells(before, expectedNext))
      }
    },
  )
})

describe('toggle (property)', () => {
  it.prop([pattern, point])('notifies exactly the toggled cell, once, whichever way it flips', (coords, [x, y]) => {
    const initial = makeLiveCells(coords)
    const store = createLiveCellStore(initial)
    const toggled = cellKey(x, y)
    const calls = subscribeCounters(store, [...initial, toggled, ...SENTINELS])

    store.toggle(x, y)

    expectNotifiedExactlyOnce(calls, new Set([toggled]))
  })

  it.prop([pattern, point])(
    'flips exactly that cell in the published set and leaves every other alone',
    (coords, [x, y]) => {
      const initial = makeLiveCells(coords)
      const store = createLiveCellStore(initial)
      const toggled = cellKey(x, y)

      store.toggle(x, y)

      const after = store.getLiveCells()
      expect(after.has(toggled)).toBe(!initial.has(toggled))
      expect(referenceChangedCells(initial, after)).toEqual(new Set([toggled]))
    },
  )
})

describe('place (property)', () => {
  it.prop([pattern, anyPattern, point])(
    'notifies exactly the footprint cells that were not already alive, each once',
    (coords, stamped, [anchorX, anchorY]) => {
      const initial = makeLiveCells(coords)
      const store = createLiveCellStore(initial)
      const footprint = footprintKeys(stamped, anchorX, anchorY)
      const expectedChanged = new Set(footprint.filter((key) => !initial.has(key)))

      // Watching the whole footprint (not just the newly-live part) is what
      // makes the already-alive overlap a guaranteed witness whenever the
      // draw produces one.
      const calls = subscribeCounters(store, [...initial, ...footprint, ...SENTINELS])

      store.place(stamped, anchorX, anchorY)

      expectNotifiedExactlyOnce(calls, expectedChanged)
    },
  )

  it.prop([anyPattern, point])(
    'notifies nobody when the entire footprint is already alive',
    (stamped, [anchorX, anchorY]) => {
      // The overlap case pinned deterministically for every catalog pattern
      // rather than left to a lucky draw: seed the board with exactly the
      // footprint, so the correct notify set is empty.
      const footprint = footprintKeys(stamped, anchorX, anchorY)
      const store = createLiveCellStore(new Set(footprint))
      const calls = subscribeCounters(store, [...footprint, ...SENTINELS])

      store.place(stamped, anchorX, anchorY)

      expectNotifiedExactlyOnce(calls, new Set())
    },
  )

  it.prop([pattern, anyPattern, point])(
    'leaves the whole footprint alive and adds nothing outside it',
    (coords, stamped, [anchorX, anchorY]) => {
      const initial = makeLiveCells(coords)
      const store = createLiveCellStore(initial)
      const footprint = footprintKeys(stamped, anchorX, anchorY)

      store.place(stamped, anchorX, anchorY)

      const after = store.getLiveCells()
      for (const key of footprint) expect(after.has(key)).toBe(true)
      expect(referenceChangedCells(initial, after)).toEqual(new Set(footprint.filter((key) => !initial.has(key))))
    },
  )
})

// An arbitrary sequence of mutators, for the invariants that must hold no
// matter what order things happened in.
type Mutation =
  | { kind: 'advance' }
  | { kind: 'toggle'; x: number; y: number }
  | { kind: 'place'; pattern: Pattern; anchorX: number; anchorY: number }

const mutation: fc.Arbitrary<Mutation> = fc.oneof(
  fc.constant<Mutation>({ kind: 'advance' }),
  fc.record({ kind: fc.constant<'toggle'>('toggle'), x: coordinate, y: coordinate }),
  fc.record({
    kind: fc.constant<'place'>('place'),
    pattern: anyPattern,
    anchorX: coordinate,
    anchorY: coordinate,
  }),
)

function applyMutation(store: LiveCellStore, step: Mutation): void {
  if (step.kind === 'advance') store.advance()
  else if (step.kind === 'toggle') store.toggle(step.x, step.y)
  else store.place(step.pattern, step.anchorX, step.anchorY)
}

describe('published state (property)', () => {
  it.prop([pattern, fc.array(mutation, { maxLength: 8 })])(
    'getLiveCells is frozen after any sequence of mutations',
    (coords, mutations) => {
      const store = createLiveCellStore(makeLiveCells(coords))
      for (const step of mutations) applyMutation(store, step)

      // The store promises published state is always immutable. Every mutator
      // funnels through publish(), so one escaping path would break the
      // promise everywhere -- assert it after arbitrary interleavings rather
      // than after each mutator in isolation.
      expect(() => (store.getLiveCells() as Set<CellKey>).add(cellKey(7, 7))).toThrow()
      expect(() => (store.getLiveCells() as Set<CellKey>).clear()).toThrow()
    },
  )

  it('is frozen before any mutation at all', () => {
    const store = createLiveCellStore()
    expect(() => (store.getLiveCells() as Set<CellKey>).add(cellKey(7, 7))).toThrow()
  })
})

// A fixed pool, so a generated subscription list really can name the same
// (key, listener) pair twice -- a fresh closure per subscription never would.
const LISTENER_POOL: readonly (() => void)[] = [() => {}, () => {}, () => {}, () => {}]

function boundsValueEqual(a: ContentBounds | null, b: ContentBounds | null): boolean {
  if (a === null || b === null) return a === b
  return a.minX === b.minX && a.maxX === b.maxX && a.minY === b.minY && a.maxY === b.maxY
}

describe('bounds snapshot (property)', () => {
  it.prop([pattern, mutation])('keeps its object identity exactly when the box has not moved', (coords, step) => {
    // useSyncExternalStore compares snapshots by identity, so this is the
    // difference between GridScrollbars re-rendering on every tick and only
    // when the bounding box actually changes. Both directions matter: a
    // store that always returned a fresh object would pass a "value is
    // right" check and still re-render constantly.
    const store = createLiveCellStore(makeLiveCells(coords))
    const before = store.getBoundsSnapshot()

    applyMutation(store, step)

    const after = store.getBoundsSnapshot()
    expect(after === before).toBe(boundsValueEqual(before, after))
  })

  it.prop([pattern])('is stable across repeated reads with no mutation in between', (coords) => {
    const store = createLiveCellStore(makeLiveCells(coords))
    const first = store.getBoundsSnapshot()
    expect(store.getBoundsSnapshot()).toBe(first)
    expect(store.getBoundsSnapshot()).toBe(first)
  })

  it('is null on an empty store and null again after a mutation that leaves it empty', () => {
    const store = createLiveCellStore()
    expect(store.getBoundsSnapshot()).toBeNull()
    store.advance()
    expect(store.getBoundsSnapshot()).toBeNull()
  })
})

describe('subscription bookkeeping (property)', () => {
  it.prop([fc.array(fc.tuple(point, fc.integer({ min: 0, max: 3 })), { maxLength: 12 })])(
    'trackedCellCount returns to zero once every subscription is released, in any order',
    (subscriptions) => {
      // The leak invariant: buckets are created on demand, so the only thing
      // stopping the map from growing without bound as cells scroll in and
      // out of view is unsubscribe deleting an emptied bucket. Listeners are
      // drawn from a fixed pool rather than created per subscription, so the
      // draw genuinely produces multi-listener buckets *and* repeated
      // (key, listener) pairs -- the case where subscribeCell's Set.add is a
      // no-op and two independent Unsubscribe closures share one entry.
      const store = createLiveCellStore()
      const unsubscribes = subscriptions.map(([[x, y], listenerIndex]) =>
        store.subscribeCell(cellKey(x, y), LISTENER_POOL[listenerIndex]),
      )
      expect(store.trackedCellCount()).toBe(new Set(subscriptions.map(([[x, y]]) => cellKey(x, y))).size)

      for (const unsubscribe of [...unsubscribes].reverse()) unsubscribe()

      expect(store.trackedCellCount()).toBe(0)
    },
  )

  it('trackedCellCount is zero on a fresh store', () => {
    expect(createLiveCellStore().trackedCellCount()).toBe(0)
  })

  it.prop([point, fc.integer({ min: 1, max: 4 })])(
    'a released subscription is never notified again, however many times it is released',
    ([x, y], releaseCount) => {
      const store = createLiveCellStore()
      let calls = 0
      const unsubscribe = store.subscribeCell(cellKey(x, y), () => calls++)

      store.toggle(x, y)
      for (let i = 0; i < releaseCount; i++) unsubscribe()
      store.toggle(x, y)

      expect(calls).toBe(1)
      expect(store.trackedCellCount()).toBe(0)
    },
  )
})
