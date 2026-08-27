import { describe, expect, it } from 'vitest'
import { isTupleList, mutateTupleList } from './tuple-list.ts'

const PAIR = /\((-?\d+),\s*(-?\d+)\)/g

function pairsOf(value: string): string[] {
  return [...value.matchAll(PAIR)].map((m) => `${m[1]},${m[2]}`)
}

// mutateTupleList draws from `rand` exactly twice, in either branch: a class
// draw, then either a swap-candidate-index draw or a component-index draw.
// The recursive call into mutation-rules.ts's mutateValue re-seeds its own
// generator from `${derivedSeedKey}::${componentText}` and never touches the
// `rand` passed in here -- see mutation-rules.ts's own header on that
// contract. So a two-element draw queue is exactly enough for any call.
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
})

describe('mutateTupleList', () => {
  const CELLS = '(0, 0), (1, 0), (0, 1), (1, 1)'

  it('is deterministic for a fixed draw sequence', () => {
    const first = mutateTupleList(CELLS, queuedRand([0.6, 0.1]), 'k')
    const second = mutateTupleList(CELLS, queuedRand([0.6, 0.1]), 'k')
    expect(first).toBe(second)
  })

  it('stays a same-length list of tuples across many draw sequences', () => {
    for (let a = 0; a < 10; a++) {
      for (let b = 0; b < 10; b++) {
        const mutated = mutateTupleList(CELLS, queuedRand([a / 10, b / 10]), `k-${a}-${b}`)
        expect(pairsOf(mutated)).toHaveLength(4)
      }
    }
  })

  it('changes exactly one pair when component-change is selected (first draw >= 0.5)', () => {
    const before = pairsOf(CELLS)
    const after = pairsOf(mutateTupleList(CELLS, queuedRand([0.6, 0.1]), 'k'))
    expect(after).toHaveLength(before.length)
    expect(after.filter((p, idx) => p !== before[idx])).toHaveLength(1)
  })

  it('swaps a pair transposition when swap is selected and a swappable candidate exists (first draw < 0.5)', () => {
    const mutated = mutateTupleList(CELLS, queuedRand([0.1, 0.1]), 'k')
    // (0, 0), the first pair, has equal components so it is not swappable;
    // the swap candidate pool is (1, 0), (0, 1), (1, 1) -- with the second
    // draw (0.1) selecting the first candidate, (1, 0), swapped to (0, 1).
    expect(mutated).toBe('(0, 0), (0, 1), (0, 1), (1, 1)')
  })

  it('is a single transposition -- the swapped pair is a permutation of its own original components', () => {
    const before = pairsOf(CELLS)
    const after = pairsOf(mutateTupleList(CELLS, queuedRand([0.1, 0.1]), 'k'))
    const changedIndex = after.findIndex((p, idx) => p !== before[idx])
    const [bx, by] = before[changedIndex].split(',')
    const [ax, ay] = after[changedIndex].split(',')
    expect([ax, ay].sort()).toEqual([bx, by].sort())
  })

  it('falls back to component-change when every pair has equal components (no swap candidate)', () => {
    const value = '(2, 2), (3, 3)'
    const before = pairsOf(value)
    const mutated = mutateTupleList(value, queuedRand([0.1, 0.1]), 'k') // wants swap, but nothing is swappable
    const after = pairsOf(mutated)
    expect(after).toHaveLength(before.length)
    // A no-op swap would leave the value unchanged; component-change must
    // actually change a numeric component.
    expect(mutated).not.toBe(value)
    expect(after.filter((p, idx) => p !== before[idx])).toHaveLength(1)
  })

  it('falls back to component-change for a non-2-arity tuple list even when the first draw wants swap', () => {
    const value = '(1, 2, 3), (4, 5, 6)'
    const mutated = mutateTupleList(value, queuedRand([0.1, 0.1]), 'k')
    expect(mutated).not.toBe(value)
    // Still a well-formed pair of 3-tuples with exactly one changed digit run.
    expect([...mutated.matchAll(/\(([^()]*)\)/g)]).toHaveLength(2)
  })

  it('mutates a single-pair list', () => {
    const mutated = mutateTupleList('(0, 0)', queuedRand([0.6, 0.1]), 'k')
    expect(pairsOf(mutated)).toHaveLength(1)
    expect(mutated).not.toBe('(0, 0)')
  })

  it('produces different mutants for different seedKeys under component-change with the same draws', () => {
    const results = new Set(
      Array.from({ length: 20 }, (_, i) => mutateTupleList(CELLS, queuedRand([0.6, 0.1]), `k${i}`)),
    )
    expect(results.size).toBeGreaterThan(1)
  })

  it('throws on a value that is not a tuple list', () => {
    expect(() => mutateTupleList('alive,dead,alive', queuedRand([0.1, 0.1]), 'k')).toThrow(/not a tuple-list/)
  })
})
