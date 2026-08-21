// container-equality.ts is exercised almost entirely through its two
// callers (is-shallow-equal.test.ts, is-deep-equal.test.ts, and the shared
// structural-equality-contract.test.ts). This file exists only for a
// contract that neither caller's comparator can observe: setsEqual's fast
// path (Set.has/delete, SameValueZero) is checked independently of the
// `compare` argument, before falling back to a `compare`-based scan. Both
// production comparators (isStrictEqual, isDeepEqual) are reflexive --
// structurallyEqual's own unconditional isStrictEqual short-circuit
// guarantees it -- so the fallback scan would always rediscover a
// SameValueZero match anyway, making the fast path unobservable through
// them. Proving the fast path does something requires a deliberately
// non-reflexive LeafComparator, which is only meaningful against the
// exported structurallyEqual directly.
import { describe, expect, it } from 'vitest'
import { structurallyEqual, type LeafComparator } from './container-equality'

describe('structurallyEqual - Set fast path', () => {
  it('matches a Set member via SameValueZero even when `compare` says it is not equal to itself', () => {
    // Deliberately non-reflexive for 'x': compare('x', 'x') is false. A
    // compare-only scan could never find 'x' equal to anything, so this
    // only passes if the fast path (Set.delete, independent of `compare`)
    // is what actually finds the match.
    const nonReflexiveForX: LeafComparator = (a, b) => a !== 'x' && Object.is(a, b)
    expect(structurallyEqual(new Set(['x']), new Set(['x']), nonReflexiveForX)).toBe(true)
  })
})
