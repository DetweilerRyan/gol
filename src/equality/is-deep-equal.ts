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
 */
export function isDeepEqual<T>(a: T, b: T): boolean {
  return structurallyEqual(a, b, isDeepEqual as (x: unknown, y: unknown) => boolean)
}
