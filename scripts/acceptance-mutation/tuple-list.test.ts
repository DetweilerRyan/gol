import { describe, expect, it } from 'vitest'
import { isTupleList, mutateTupleList } from './tuple-list.ts'
// mutateValue, not tuple-list.ts's own exports: these fixtures moved here
// from mutation-rules.test.ts and are meant to prove the WIRING (VALUE_RULES
// routing a paren-delimited numeric-tuple value to this rule ahead of the
// plain comma-list rule), not just the rule's own logic in isolation --
// mutateTupleList is exercised directly by every describe block above this
// one.
import { mutateValue } from './mutation-rules.ts'

// Byte-identical mirror of features/steps/pattern-library.ts:58's own
// parseCellList regex, not tuple-list.ts's own parser -- see
// tuple-list.property.test.ts's identical constant for why the oracle has to
// stay independent of the thing under test. Keep this in sync by hand.
const PAIR = /\((-?\d+),\s*(-?\d+)\)/g

function pairsOf(value: string): string[] {
  return [...value.matchAll(PAIR)].map((m) => `${m[1]},${m[2]}`)
}

// Every individual numeric component across the whole list, flattened and in
// document order -- arity-agnostic, unlike pairsOf above, so it also covers
// 3-tuples. Used to tell a transposition (two components change at once)
// apart from a component-change (exactly one does).
function componentsOf(value: string): string[] {
  return [...value.matchAll(/-?\d+/g)].map((m) => m[0])
}

// mutateTupleList draws from `rand` exactly twice, in either branch: a class
// draw, then either a swap-candidate-index draw or a component-index draw.
// The component-change branch delegates to the INJECTED ValueMutator
// (mutateValue in production), which seeds its own generator from
// `${derivedSeedKey}::${componentText}` and never touches the `rand` passed
// in here -- see tuple-list.ts's mutateComponent for that contract. So a two-element
// draw queue is exactly enough for any call.
function queuedRand(draws: number[]): () => number {
  let i = 0
  return () => draws[i++]
}

describe('isTupleList', () => {
  it('accepts a single pair', () => {
    expect(isTupleList('(0, 0)')).toBe(true)
  })

  it('accepts a multi-pair list', () => {
    expect(isTupleList('(0, 0), (1, 0), (0, 1), (1, 1)')).toBe(true)
  })

  it('accepts negative coordinates', () => {
    expect(isTupleList('(-3, -7)')).toBe(true)
  })

  it('accepts a fixed-arity list of tuples wider than a pair', () => {
    expect(isTupleList('(1, 2, 3), (4, 5, 6)')).toBe(true)
  })

  it('rejects a doubly-parenthesised pair', () => {
    expect(isTupleList('((0, 0))')).toBe(false)
  })

  it('rejects a list whose tuples have inconsistent arity', () => {
    expect(isTupleList('(1, 2), (3, 4, 5)')).toBe(false)
  })

  it('rejects a paren-list whose items are not numeric tuples', () => {
    expect(isTupleList('(2026-05-13, P3D), (1, 2)')).toBe(false)
  })

  it('rejects a plain comma list with no parens', () => {
    expect(isTupleList('alive,dead,alive')).toBe(false)
  })

  it('rejects a value with trailing text after the last tuple', () => {
    expect(isTupleList('(0, 0), (1, 0) extra')).toBe(false)
  })

  it('rejects a value with a bracket instead of parens', () => {
    expect(isTupleList('[0, 0], [1, 0]')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isTupleList('')).toBe(false)
  })

  // Every fixture above this point uses exactly one canonical spacing
  // ("(0, 0)": no space after '(', none before a comma, one space after a
  // comma, none before ')') -- the shape prettier-plugin-gherkin actually
  // produces. TUPLE_LIST_SHAPE's `\s*` is more permissive than that single
  // shape at every one of its ten occurrences, and nothing above exercises
  // the permissiveness itself: a canonical fixture matches a `\s*` position
  // with either zero characters (untested against a mutant that instead
  // requires NON-whitespace there) or exactly one (untested against a mutant
  // that instead requires EXACTLY one whitespace character, since one space
  // satisfies both). These two pin the actual, current tolerance at both
  // ends -- liberal extra whitespace, and none at all -- rather than
  // asserting a stricter contract nothing here has decided on.
  it('tolerates extra whitespace around parens, commas and the top-level separator', () => {
    expect(isTupleList('( 0 , 0 ) , ( 1 , 0 )')).toBe(true)
  })

  it('tolerates no whitespace at all around a comma', () => {
    expect(isTupleList('(0,0),(1,0)')).toBe(true)
  })

  it('rejects a value with leading text before the first tuple', () => {
    // The mirror image of "rejects a value with trailing text after the
    // last tuple" above -- both ends of the anchored match matter, and nothing
    // above tests the leading one.
    expect(isTupleList('xyz(0, 0)')).toBe(false)
  })
})

describe('mutateTupleList', () => {
  const CELLS = '(0, 0), (1, 0), (0, 1), (1, 1)'

  it('is deterministic for a fixed draw sequence', () => {
    const first = mutateTupleList(CELLS, queuedRand([0.6, 0.1]), 'k', mutateValue)
    const second = mutateTupleList(CELLS, queuedRand([0.6, 0.1]), 'k', mutateValue)
    expect(first).toBe(second)
  })

  it('stays a same-length list of tuples across many draw sequences', () => {
    for (let a = 0; a < 10; a++) {
      for (let b = 0; b < 10; b++) {
        const mutated = mutateTupleList(CELLS, queuedRand([a / 10, b / 10]), `k-${a}-${b}`, mutateValue)
        expect(pairsOf(mutated)).toHaveLength(4)
      }
    }
  })

  it('changes exactly one pair when component-change is selected (first draw >= 0.5)', () => {
    const before = pairsOf(CELLS)
    const after = pairsOf(mutateTupleList(CELLS, queuedRand([0.6, 0.1]), 'k', mutateValue))
    expect(after).toHaveLength(before.length)
    expect(after.filter((p, idx) => p !== before[idx])).toHaveLength(1)
  })

  it('swaps a pair transposition when swap is selected and a swappable candidate exists (first draw < 0.5)', () => {
    const mutated = mutateTupleList(CELLS, queuedRand([0.1, 0.1]), 'k', mutateValue)
    // (0, 0) and (1, 1), the first and last pairs, each have equal
    // components so neither is swappable; the swap candidate pool is
    // (1, 0), (0, 1) -- with the second draw (0.1) selecting the first
    // candidate, (1, 0), swapped to (0, 1).
    expect(mutated).toBe('(0, 0), (0, 1), (0, 1), (1, 1)')
  })

  it('selects a different swap candidate for a different second draw when more than one exists', () => {
    // Same pool as the previous test -- (1, 0) and (0, 1), 2 candidates.
    // floor(draw * 2) must actually vary with draw, not collapse to the same
    // index regardless of it (a mutant dividing by the candidate count
    // instead of multiplying by it would always floor to 0 here, since
    // draw / 2 < 1 for every draw in [0, 1)).
    const first = mutateTupleList(CELLS, queuedRand([0.1, 0.1]), 'k', mutateValue) // floor(0.1 * 2) = 0 -> (1, 0)
    const second = mutateTupleList(CELLS, queuedRand([0.1, 0.9]), 'k', mutateValue) // floor(0.9 * 2) = 1 -> (0, 1)
    expect(first).not.toBe(second)
  })

  it('treats a draw of exactly 0.5 as component-change, not swap', () => {
    // The class draw's boundary, pinned deterministically rather than hunted
    // for in a seed. `rand` is an injected parameter and 0.5 is in-domain for
    // a [0, 1) RandomFn, so the exact boundary is reachable by construction:
    // `< 0.5` sends 0.5 down the component-change branch, and the `<= 0.5`
    // mutant sends it to swap instead. The two are told apart by how many
    // components move -- a transposition changes two at once, a
    // component-change exactly one -- which is a structural difference, not a
    // value coincidence that a different draw queue could wash out.
    const mutated = mutateTupleList(CELLS, queuedRand([0.5, 0.1]), 'k', mutateValue)
    const before = componentsOf(CELLS)
    const after = componentsOf(mutated)
    expect(after.filter((c, i) => c !== before[i])).toHaveLength(1)
  })

  it('is a single transposition -- the swapped pair is a permutation of its own original components', () => {
    const before = pairsOf(CELLS)
    const after = pairsOf(mutateTupleList(CELLS, queuedRand([0.1, 0.1]), 'k', mutateValue))
    const changedIndex = after.findIndex((p, idx) => p !== before[idx])
    const [bx, by] = before[changedIndex].split(',')
    const [ax, ay] = after[changedIndex].split(',')
    expect([ax, ay].sort()).toEqual([bx, by].sort())
  })

  it('falls back to component-change when every pair has equal components (no swap candidate)', () => {
    const value = '(2, 2), (3, 3)'
    const before = pairsOf(value)
    const mutated = mutateTupleList(value, queuedRand([0.1, 0.1]), 'k', mutateValue) // wants swap, but nothing is swappable
    const after = pairsOf(mutated)
    expect(after).toHaveLength(before.length)
    // A no-op swap would leave the value unchanged; component-change must
    // actually change a numeric component.
    expect(mutated).not.toBe(value)
    expect(after.filter((p, idx) => p !== before[idx])).toHaveLength(1)
  })

  it('falls back to component-change for a non-2-arity tuple list even when the first draw wants swap', () => {
    // Both 3-tuples here have differing first-two components (1 !== 2, 4 !==
    // 5), so a mutant that dropped the arity === 2 restriction would still
    // find a "swap candidate" and transpose two components at once -- which
    // a same-digit-run-count check alone can't tell apart from a genuine
    // single-component change, since a transposition also leaves the group
    // count at 2 and the value different from the original.
    const value = '(1, 2, 3), (4, 5, 6)'
    const before = componentsOf(value)
    const mutated = mutateTupleList(value, queuedRand([0.1, 0.1]), 'k', mutateValue)
    const after = componentsOf(mutated)
    expect(mutated).not.toBe(value)
    // Still a well-formed pair of 3-tuples...
    expect([...mutated.matchAll(/\(([^()]*)\)/g)]).toHaveLength(2)
    // ...with exactly one component changed, never two -- a transposition
    // would change both of a pair's components simultaneously.
    expect(after.filter((c, i) => c !== before[i])).toHaveLength(1)
  })

  it('mutates a single-pair list', () => {
    const mutated = mutateTupleList('(0, 0)', queuedRand([0.6, 0.1]), 'k', mutateValue)
    expect(pairsOf(mutated)).toHaveLength(1)
    expect(mutated).not.toBe('(0, 0)')
  })

  it('produces different mutants for different seedKeys under component-change with the same draws', () => {
    const results = new Set(
      Array.from({ length: 20 }, (_, i) => mutateTupleList(CELLS, queuedRand([0.6, 0.1]), `k${i}`, mutateValue)),
    )
    expect(results.size).toBeGreaterThan(1)
  })

  it('throws on a value that is not a tuple list', () => {
    expect(() => mutateTupleList('alive,dead,alive', queuedRand([0.1, 0.1]), 'k', mutateValue)).toThrow(
      /not a tuple-list/,
    )
  })
})

// Moved from mutation-rules.test.ts's now-deleted "parenthesised coordinate
// pairs" block: these exercise the rule through mutateValue's own VALUE_RULES
// dispatch (mutation-rules.ts), the seeded-random plumbing this file's own
// tests above bypass with a hand-fed `rand`.
describe('through mutateValue (VALUE_RULES routing)', () => {
  const CELLS = '(0, 0), (1, 0), (0, 1), (1, 1)'

  it('stays parseable as the same number of coordinate pairs', () => {
    for (let i = 0; i < 30; i++) {
      const mutated = mutateValue(CELLS, `coords-${i}`)
      expect(pairsOf(mutated)).toHaveLength(4)
    }
  })

  it('changes exactly one coordinate value, numerically, and preserves the rest', () => {
    const originalPairs = pairsOf(CELLS)
    for (let i = 0; i < 30; i++) {
      const mutated = mutateValue(CELLS, `coords-${i}`)
      const mutatedPairs = pairsOf(mutated)
      expect(mutatedPairs).toHaveLength(originalPairs.length)
      const changed = mutatedPairs.filter((p, idx) => p !== originalPairs[idx])
      expect(changed).toHaveLength(1)
    }
  })

  it('never introduces a doubled paren -- each part has at most one leading/trailing paren', () => {
    for (let i = 0; i < 30; i++) {
      const mutated = mutateValue(CELLS, `coords-${i}`)
      for (const part of mutated.split(',').map((p) => p.trim())) {
        expect(part.match(/^\(*/)?.[0].length).toBeLessThanOrEqual(1)
        expect(part.match(/\)*$/)?.[0].length).toBeLessThanOrEqual(1)
      }
    }
  })

  it('is deterministic for the same seedKey and value', () => {
    expect(mutateValue(CELLS, 'k')).toBe(mutateValue(CELLS, 'k'))
  })

  it('mutates the digits inside a multi-digit coordinate, not just single-digit ones', () => {
    // Every fixture above uses single-digit coordinates. 'paren-1' is a seed
    // hunted against the current code to land on a multi-digit component.
    expect(mutateValue('(1, 23)', 'paren-1')).toBe('(1, 29)')
  })

  it('rejects a paren-list whose items are not numeric tuples, and mutates it as a plain comma list instead', () => {
    // "(2026-05-13, P3D), (1, 2)" is paren-delimited but its first item is a
    // date and a duration, not a pair of integers -- isTupleList's boundary.
    // It falls through to the plain comma-list rule, which has no notion of
    // a paren at all, so this mutant lands on punctuation.
    const mutated = mutateValue('(2026-05-13, P3D), (1, 2)', 'pinned')
    expect(mutated).toBe('(2026-05-13, P3D), (1, v)')
  })
})
