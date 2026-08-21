import { structurallyEqual } from './container-equality'

/**
 * Performs a deep, structural equality check on two values: containers
 * (Date, Set, Map, Array, plain object) are equal when their corresponding
 * members are deeply equal, recursing into nested containers rather than
 * stopping at the top level the way isShallowEqual does.
 *
 * `isDeepEqual` is its own leaf comparator here -- structurallyEqual's own
 * initial short-circuit is always isStrictEqual (see the comment there), so
 * passing isDeepEqual as `compare` only recurses into a container's
 * members, never back into the same (a, b) pair.
 *
 * Scope contract -- read before reusing this for a new call site: this is
 * for small, known-shallow structures only, and its cost bound is strictly
 * worse than isShallowEqual's rather than equal to it. Every level of
 * nesting re-runs the whole container walk, and a Set of non-primitives
 * degrades to an O(n*m) scan at each level -- `Set.has`/`delete` can only
 * match members by SameValueZero, so structurally-equal-but-distinct
 * references (the case this comparator exists for) always fall through to
 * a linear scan over the remaining members, each step of which is itself a
 * recursive isDeepEqual. Never reach for this to compare two `liveCells`
 * Sets (~10k members) -- write a dedicated comparison instead.
 */
export function isDeepEqual<T>(a: T, b: T): boolean {
  return structurallyEqual(a, b, isDeepEqual as (x: unknown, y: unknown) => boolean)
}
