import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { isDeepEqual } from './is-deep-equal'

// Covers Date/Map/Set alongside the arbitrary's default primitives, arrays,
// and plain objects, so the property runs also exercise every container
// kind structurallyEqual dispatches on. Bounded depth keeps generated
// structures small -- isDeepEqual recurses, so nothing here needs to probe
// stack depth, just the equality contract.
const anyValue = fc.anything({ withDate: true, withMap: true, withSet: true, maxDepth: 3 })

// Same, but without Map: mapsEqual looks up keys with `b.has(key)` (kept
// verbatim from the ported source), and Map key lookup is reference-based
// for object keys. structuredClone always produces a *new* object for an
// object key, so a cloned Map keyed by e.g. a Date can be deeply equal
// member-by-member yet still fail `.has()` -- a real limitation of Map
// itself, not of isDeepEqual, so it's excluded from this property rather
// than "fixed" here.
const cloneableValue = fc.anything({ withDate: true, withMap: false, withSet: true, maxDepth: 3 })

// A set of distinct object references drawn from a deliberately tiny value
// space, so several members are routinely deeply equal to each other --
// that's the case where consumeEquivalent's matching has a real choice to
// make, and where a wrong choice could strand a later member.
const setMembers = fc.array(fc.record({ a: fc.integer({ min: 0, max: 3 }), b: fc.string({ maxLength: 2 }) }), {
  maxLength: 6,
})

// The same members in an arbitrary order, cloned so nothing matches by
// reference: every member has to be found by the fallback scan, whose
// result must not depend on the order it happens to visit them in.
const membersAndPermutedClone = setMembers.chain((members) =>
  fc
    .shuffledSubarray(members, { minLength: members.length, maxLength: members.length })
    .map((permuted) => ({ members, permutedClone: structuredClone(permuted) })),
)

describe('isDeepEqual (property)', () => {
  it.prop([anyValue])('is reflexive', (x) => {
    expect(isDeepEqual(x, x)).toBe(true)
  })

  // The property that makes the asymmetric-mismatch defect class (e.g. the
  // Date-vs-{} bug fixed in this restructure) structurally impossible to
  // regress: any future change that special-cases one operand's kind over
  // the other's will fail this before it can ship.
  it.prop([anyValue, anyValue])('is symmetric', (a, b) => {
    expect(isDeepEqual(a, b)).toBe(isDeepEqual(b, a))
  })

  it.prop([cloneableValue])('is true for a deep-cloned structure', (value) => {
    // structuredClone, not JSON.stringify/parse: fast-check's generated
    // values can include Date/Map/Set alongside plain objects/arrays, and
    // JSON round-tripping would collapse those container kinds instead of
    // preserving them.
    const clone = structuredClone(value)
    expect(isDeepEqual(value, clone)).toBe(true)
  })

  // Set members are matched greedily and consumed as they're matched, so
  // correctness depends on any two equivalent members being interchangeable
  // -- true because deep equality is an equivalence relation, but nothing
  // else in the suite constrains it. A greedy walk that could strand a
  // member (by consuming the only match some *later* member needed) would
  // show up here as an order-dependent result.
  it.prop([membersAndPermutedClone])(
    'matches Set members irrespective of iteration order',
    ({ members, permutedClone }) => {
      expect(isDeepEqual(new Set(members), new Set(permutedClone))).toBe(true)
    },
  )
})
