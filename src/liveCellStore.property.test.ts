import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { cellKey, createEmptyLiveCells, type CellKey, type ContentBounds, type LiveCells } from './gameOfLife'
import { createLiveCellStore, type LiveCellStore } from './liveCellStore'
import { PATTERNS, patternCellPositions, type Pattern } from './patternLibrary'
import { referenceChangedCells, referenceNextGeneration } from './test-support/lifeReference'

// What this file exists to pin down, and what nothing else can.
//
// THIS IS A REPLACEMENT CONTRACT, NOT A RELAXED ONE. Until
// collapse-dead-cell-layer the store's headline invariant was per-cell -- "a
// mutation notifies exactly the cells whose aliveness changed, each exactly
// once, and nobody else" -- observed through subscribeCell, which every
// mounted Cell held one of. That render path is gone: only live cells (plus
// the keyboard cursor) mount at all now, and the one thing that has to see
// the whole set to decide which those are is Grid, through subscribeCells.
// subscribeCell/getCellSnapshot/trackedCellCount were retired with it, and
// this file was rewritten in the same pass rather than merely losing three
// imports -- a deleted invariant with no successor is how a module quietly
// stops promising anything. The three clauses below are that successor:
//
//   1. DISPATCH COUNT. Every subscribeCells listener is called exactly once
//      per mutator call -- advance, toggle or place -- and never at all for
//      a read. "Exactly once" is the half a set-equality check cannot see: a
//      store that notified twice would render identical pixels and pass
//      every rendering, Gherkin and e2e test in the repo, while doubling
//      React's work on the one subscription the whole cell layer hangs off.
//      Shown failing against a deliberately double-notifying store before
//      being kept (architect, REVIEW pass) -- a property nobody has seen
//      fail is documentation.
//   2. IDENTITY DISCIPLINE. getLiveCells() is stable across reads with no
//      mutation between them, and a mutation that really changed membership
//      always hands back a new identity. useSyncExternalStore compares by
//      identity, so a stale identity after a real change is a missed render.
//   3. PUBLISHED STATE. What the set actually contains after each mutator,
//      against an independent brute-force oracle, plus frozen-always.
//
// THE CONVERSE OF (2) IS DELIBERATELY NOT ASSERTED, and the measurement is
// the reason. advanceGeneration builds its next Set unconditionally, so
// advance() hands back a fresh identity even for a still life or an empty
// board (measured: identity differs in both cases), where place() onto an
// already-live footprint keeps its identity because immer's Set draft treats
// a redundant add as no mutation (measured: identity preserved). So a still
// life re-renders every mounted cell each tick -- a real cost, named here
// rather than pinned, because asserting today's wasteful branch as a
// contract is how an optimisation later reads as a regression. Contrast
// getBoundsSnapshot, which preserves identity across a no-move mutation on
// purpose and IS asserted to.

// Same bounded coordinate space as gameOfLife.property.test.ts, for the same
// reason: it keeps the brute-force oracle in test-support cheap while still
// covering negative coordinates.
const coordinate = fc.integer({ min: -8, max: 8 })
const point = fc.tuple(coordinate, coordinate)
const pattern = fc.uniqueArray(point, { maxLength: 25 })
const anyPattern = fc.constantFrom(...PATTERNS)

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

// Plain closure counters rather than vi.fn(): this file's properties run
// hundreds of cases and are covering tests for a large mutant set, so the spy
// bookkeeping would be paid back thousands of times over in hardener's
// mutation run for no extra information.
//
// SEVERAL listeners, not one, and they are distinct closures on purpose:
// cellsListeners is a Set, so subscribing one shared function twice would
// dedupe to a single entry and the count could not tell "notified each
// subscriber once" from "notified one subscriber twice".
function subscribeCounters(store: LiveCellStore, howMany = 3): () => number[] {
  const counts: number[] = Array.from({ length: howMany }, () => 0)
  for (let i = 0; i < howMany; i++) store.subscribeCells(() => (counts[i] += 1))
  return () => [...counts]
}

// Asserts clause 1 in one place. Compared as a whole array so a failure names
// which subscriber saw the wrong number rather than reporting 2 !== 1.
function expectEachNotified(read: () => number[], times: number): void {
  expect(read()).toEqual(read().map(() => times))
}

function footprintKeys(pattern: Pattern, anchorX: number, anchorY: number): CellKey[] {
  return patternCellPositions(pattern, anchorX, anchorY).map(([x, y]) => cellKey(x, y))
}

describe('advance (property)', () => {
  it.prop([pattern])('notifies every whole-set subscriber exactly once', (coords) => {
    const store = createLiveCellStore(makeLiveCells(coords))
    const read = subscribeCounters(store)

    store.advance()

    expectEachNotified(read, 1)
  })

  it.prop([pattern])('leaves the published set equal to an independent brute-force generation', (coords) => {
    const initial = makeLiveCells(coords)
    const store = createLiveCellStore(initial)

    store.advance()

    expect(new Set(store.getLiveCells())).toEqual(referenceNextGeneration(initial))
  })

  // Degenerate boards pinned deterministically rather than left to the draw.
  // Both are cases where the DELTA is empty and the notification is not: the
  // whole-set channel is unconditional, and a reader who expects it to fall
  // silent when nothing changed has the old per-cell contract in mind.
  it('notifies on an empty board, where nothing changed at all', () => {
    const store = createLiveCellStore(createEmptyLiveCells())
    const read = subscribeCounters(store)

    store.advance()

    expectEachNotified(read, 1)
    expect(new Set(store.getLiveCells())).toEqual(createEmptyLiveCells())
  })

  it('notifies exactly once for a still life whose every cell survives unchanged', () => {
    const block = makeLiveCells([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
    const store = createLiveCellStore(block)
    const read = subscribeCounters(store)

    store.advance()

    expectEachNotified(read, 1)
    expect(new Set(store.getLiveCells())).toEqual(block)
  })

  // THE SIZE-PRESERVING GENERATION, pinned because the generator does not
  // reach it and a fault injection proved that gap rather than my guessing at
  // it. A blinker flips three cells and keeps a population of three, which is
  // the only shape that separates "identity tracks membership" from "identity
  // tracks population" -- a getLiveCells memoised on set SIZE returns a stale
  // identity here and nowhere else. Injected exactly that fault while this
  // case was missing: all 21 properties stayed green, because 100 random
  // boards of up to 25 cells produced no size-preserving advance. With this
  // case the same fault fails exactly 1 of 22 -- this one, and nothing else,
  // which is also the measure of how much the rest of the file was NOT seeing.
  it('advances a blinker to its perpendicular twin -- same population, new membership and new identity', () => {
    const horizontal = makeLiveCells([
      [-1, 0],
      [0, 0],
      [1, 0],
    ])
    const store = createLiveCellStore(horizontal)
    const before = store.getLiveCells()

    store.advance()

    const after = store.getLiveCells()
    expect(after).not.toBe(before)
    expect(after.size).toBe(before.size)
    expect(new Set(after)).toEqual(
      makeLiveCells([
        [0, -1],
        [0, 0],
        [0, 1],
      ]),
    )
  })

  it('kills the lone cell that has zero live neighbors', () => {
    const store = createLiveCellStore(makeLiveCells([[0, 0]]))

    store.advance()

    expect(new Set(store.getLiveCells())).toEqual(createEmptyLiveCells())
  })

  it.prop([pattern, fc.integer({ min: 1, max: 4 })])(
    'notifies once per tick of a repeated advance, not just for the first',
    (coords, ticks) => {
      const store = createLiveCellStore(makeLiveCells(coords))
      const read = subscribeCounters(store)

      for (let tick = 0; tick < ticks; tick++) {
        const before = new Set(store.getLiveCells())
        store.advance()
        expect(new Set(store.getLiveCells())).toEqual(referenceNextGeneration(before))
      }

      expectEachNotified(read, ticks)
    },
  )
})

describe('toggle (property)', () => {
  it.prop([pattern, point])(
    'notifies every whole-set subscriber exactly once, whichever way it flips',
    (coords, [x, y]) => {
      const store = createLiveCellStore(makeLiveCells(coords))
      const read = subscribeCounters(store)

      store.toggle(x, y)

      expectEachNotified(read, 1)
    },
  )

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
    'notifies every whole-set subscriber exactly once',
    (coords, stamped, [anchorX, anchorY]) => {
      const store = createLiveCellStore(makeLiveCells(coords))
      const read = subscribeCounters(store)

      store.place(stamped, anchorX, anchorY)

      expectEachNotified(read, 1)
    },
  )

  it.prop([anyPattern, point])(
    'notifies even when the entire footprint is already alive and nothing changes',
    (stamped, [anchorX, anchorY]) => {
      // The no-op stamp, pinned for every catalog pattern rather than left to
      // a lucky draw. It is the one mutator path that keeps the SAME set
      // identity (immer treats a redundant Set add as no mutation), so it is
      // also the case that separates clause 1 from clause 2: notified once,
      // identity unchanged.
      const footprint = footprintKeys(stamped, anchorX, anchorY)
      const store = createLiveCellStore(new Set(footprint))
      const before = store.getLiveCells()
      const read = subscribeCounters(store)

      store.place(stamped, anchorX, anchorY)

      expectEachNotified(read, 1)
      expect(store.getLiveCells()).toBe(before)
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

describe('published-set identity (property)', () => {
  it.prop([pattern, fc.integer({ min: 1, max: 3 })])(
    'is stable across repeated reads with no mutation in between',
    (coords, reads) => {
      const store = createLiveCellStore(makeLiveCells(coords))
      const first = store.getLiveCells()
      for (let i = 0; i < reads; i++) expect(store.getLiveCells()).toBe(first)
      // A read is not a mutation: getBoundsSnapshot computes and caches, and
      // must not disturb the published set or notify anyone.
      const read = subscribeCounters(store)
      store.getBoundsSnapshot()
      expect(store.getLiveCells()).toBe(first)
      expectEachNotified(read, 0)
    },
  )

  it.prop([pattern, mutation])('hands back a new identity whenever the membership really changed', (coords, step) => {
    // One direction only -- see this file's header for why the converse is
    // deliberately not asserted. This is the direction useSyncExternalStore
    // depends on: a changed set behind an unchanged identity is a render
    // that never happens.
    const store = createLiveCellStore(makeLiveCells(coords))
    const before = store.getLiveCells()
    const beforeMembers = new Set(before)

    applyMutation(store, step)

    const after = store.getLiveCells()
    if (referenceChangedCells(beforeMembers, after).size > 0) expect(after).not.toBe(before)
  })
})

describe('whole-set subscription bookkeeping (property)', () => {
  it.prop([fc.array(mutation, { maxLength: 6 }), fc.integer({ min: 1, max: 4 })])(
    'a released subscriber is never notified again, however many times it is released',
    (mutations, releaseCount) => {
      const store = createLiveCellStore()
      let calls = 0
      const unsubscribe = store.subscribeCells(() => calls++)

      store.toggle(0, 0)
      for (let i = 0; i < releaseCount; i++) unsubscribe()
      for (const step of mutations) applyMutation(store, step)

      // Exactly the one mutation it was subscribed for. Releasing twice must
      // be a no-op rather than an error, and must not remove anyone else --
      // the sibling below is what pins that second half.
      expect(calls).toBe(1)
    },
  )

  it.prop([fc.integer({ min: 2, max: 4 })])('releasing one subscriber leaves every other subscribed', (howMany) => {
    const store = createLiveCellStore()
    const counts: number[] = Array.from({ length: howMany }, () => 0)
    const unsubscribes = counts.map((_, i) => store.subscribeCells(() => (counts[i] += 1)))

    unsubscribes[0]()
    store.toggle(0, 0)

    expect(counts).toEqual(counts.map((_, i) => (i === 0 ? 0 : 1)))
  })

  it('a subscriber that never releases keeps receiving every mutation', () => {
    // The no-leak invariant trackedCellCount used to observe has no successor
    // here and needs none: cellsListeners is one flat Set with no per-key
    // bucketing, so there is no map that can grow without bound as cells
    // scroll in and out of view -- the exact failure that made a bucket count
    // worth exposing on the retired per-cell channel.
    const store = createLiveCellStore()
    let calls = 0
    store.subscribeCells(() => calls++)

    store.toggle(0, 0)
    store.advance()
    store.place(PATTERNS[0], 0, 0)

    expect(calls).toBe(3)
  })
})
