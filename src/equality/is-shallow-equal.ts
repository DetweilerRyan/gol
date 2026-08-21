import { structurallyEqual } from './container-equality'
import { isStrictEqual } from './is-strict-equal'

/**
 * Checks two values for shallow equality: primitives compare with
 * Object.is, and containers (Date, Set, Map, Array, plain object) compare
 * member-by-member with Object.is, never descending into nested
 * containers.
 *
 * Scope contract -- read before reusing this for a new call site: this is
 * for small, known-shallow projected state only (e.g. a derived props
 * object with a handful of primitive/reference fields), not for comparing
 * arbitrary or large collections. The Set path is O(n) -- it matches
 * members via `Set.has`/`delete` (SameValueZero) first, falling back to a
 * linear scan only when that fails -- but it still allocates a same-size
 * copy of the second Set per comparison, and the object-key comparison
 * below allocates a key array per side, so this still isn't free at scale.
 * (SameValueZero and Object.is agree on everything except +0 vs -0, but
 * that divergence can't actually surface through a Set: Set.prototype.add
 * normalizes -0 to +0 at insertion, so a Set can never hold -0 as a member
 * in the first place -- see container-equality.test.ts for where that
 * fast-path-vs-scan distinction actually is observable.) Never reach for
 * this to compare two `liveCells` Sets (~10k members) -- write a dedicated
 * comparison instead.
 */
export function isShallowEqual<T>(a: T, b: T): boolean {
  return structurallyEqual(a, b, isStrictEqual)
}
