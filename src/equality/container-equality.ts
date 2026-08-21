// Shared walker behind isShallowEqual and isDeepEqual: the two comparators
// differ only in how they compare leaf values (isStrictEqual vs. the
// recursive isDeepEqual itself), so every branch below -- container-kind
// dispatch, mismatch handling, key comparison -- lives exactly once and is
// injected a `compare` function rather than duplicated per comparator.

import { isStrictEqual } from './is-strict-equal'

export type LeafComparator = (a: unknown, b: unknown) => boolean

function isPlainDate(value: unknown): value is Date {
  return value instanceof Date
}

function isPlainSet(value: unknown): value is Set<unknown> {
  return value instanceof Set
}

function isPlainMap(value: unknown): value is Map<unknown, unknown> {
  return value instanceof Map
}

// Object.is rather than ===, because two Invalid Dates both have a
// getTime() of NaN and `NaN === NaN` is false -- which would make a Date
// unequal to its own structuredClone, and make an Invalid Date the one
// container this walker reports as unequal to a member-by-member copy of
// itself. Node's util.isDeepStrictEqual treats two Invalid Dates as equal,
// and this now matches. There's no +0/-0 hazard in the swap: TimeClip
// normalizes -0 to +0, so getTime() never returns -0 and Object.is differs
// from === here only on the NaN case.
function datesEqual(a: Date, b: Date): boolean {
  return isStrictEqual(a.getTime(), b.getTime())
}

// Tries to find, and consume, a member of `remaining` equivalent to `item`.
// The fast path is a Set.has()/delete() lookup (SameValueZero), independent
// of `compare` -- it's a valid shortcut because both production comparators
// (isStrictEqual, isDeepEqual) are reflexive: structurallyEqual's own
// unconditional isStrictEqual short-circuit guarantees compare(x, x) is
// always true, so anything the fast path finds, the fallback scan below
// would also have found on its own, just slower. (There is no observable
// +0/-0 divergence to guard against here either: Set.prototype.add
// normalizes -0 to +0 at insertion, so a Set can never actually hold -0 as
// a member -- see container-equality.test.ts, which proves the fast path
// does something observable using a deliberately non-reflexive comparator,
// since neither real comparator can.) When `compare` is isDeepEqual's
// structural comparison, the fast path can still miss a
// structurally-equal-but-different-reference member (two distinct empty
// objects, say), so it falls back to a linear scan over what's left of
// `remaining`.
//
// Consuming (not just checking) a match is what keeps this correct multiset
// matching rather than a "does *a* match exist anywhere" scan: without
// removing the matched member, two distinct members of `a` that are each
// deeply equal to the *same single* member of `b` would both report a
// match, making e.g. isDeepEqual(Set([{}, {}]), Set([{}, {a:1}])) wrongly
// `true` in one direction while its reverse is `false` -- an asymmetry the
// symmetry property test below is specifically designed to catch.
function consumeEquivalent(remaining: Set<unknown>, item: unknown, compare: LeafComparator): boolean {
  if (remaining.delete(item)) {
    return true
  }
  for (const candidate of remaining) {
    if (compare(item, candidate)) {
      return remaining.delete(candidate)
    }
  }
  return false
}

function setsEqual(a: Set<unknown>, b: Set<unknown>, compare: LeafComparator): boolean {
  if (a.size !== b.size) {
    return false
  }
  const remaining = new Set(b)
  for (const item of a) {
    if (!consumeEquivalent(remaining, item, compare)) {
      return false
    }
  }
  return true
}

function mapsEqual(a: Map<unknown, unknown>, b: Map<unknown, unknown>, compare: LeafComparator): boolean {
  if (a.size !== b.size) {
    return false
  }
  for (const [key, value] of a) {
    if (!b.has(key) || !compare(value, b.get(key))) {
      return false
    }
  }
  return true
}

function arraysEqual(a: unknown[], b: unknown[], compare: LeafComparator): boolean {
  if (a.length !== b.length) {
    return false
  }
  return a.every((item, index) => compare(item, b[index]))
}

function plainObjectsEqual(a: object, b: object, compare: LeafComparator): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  return keysA.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false
    }
    return compare((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  })
}

// One entry per container kind, in the original's evaluation order (Date,
// Set, Map, Array). `matches` identifies membership in that kind; `equal`
// compares two values already known to both be that kind.
const CONTAINER_KINDS: {
  matches: (value: unknown) => boolean
  equal: (a: any, b: any, compare: LeafComparator) => boolean
}[] = [
  { matches: isPlainDate, equal: (a: Date, b: Date) => datesEqual(a, b) },
  { matches: isPlainSet, equal: setsEqual },
  { matches: isPlainMap, equal: mapsEqual },
  { matches: Array.isArray, equal: arraysEqual },
]

// Every container kind is checked against both operands, and a kind matched
// by only one side is an immediate mismatch (`return false`) rather than
// falling through to plain-object key comparison. This is what makes
// mismatch handling symmetric by construction -- e.g. a Date vs. `{}` can no
// longer slip through as "two objects with zero keys each" the way the
// original implementation allowed in one direction.
function compareAsContainer(a: object, b: object, compare: LeafComparator): boolean {
  for (const kind of CONTAINER_KINDS) {
    const inA = kind.matches(a)
    const inB = kind.matches(b)
    if (inA && inB) {
      return kind.equal(a, b, compare)
    }
    if (inA || inB) {
      return false
    }
  }
  return plainObjectsEqual(a, b, compare)
}

/**
 * Structural equality walker shared by isShallowEqual and isDeepEqual. Two
 * values are structurally equal if they are strictly equal (Object.is), or
 * if they are the same kind of container (Date, Set, Map, Array, or plain
 * object) whose corresponding members are equal under `compare`.
 *
 * The initial short-circuit is always isStrictEqual, never `compare` --
 * isDeepEqual's own `compare` argument is isDeepEqual itself, and using it
 * here would recurse on the exact same (a, b) pair forever instead of
 * descending into their members.
 */
export function structurallyEqual(a: unknown, b: unknown, compare: LeafComparator): boolean {
  if (isStrictEqual(a, b)) {
    return true
  }

  if (a === null || b === null) {
    return false
  }

  if (typeof a !== 'object' || typeof b !== 'object') {
    return false
  }

  return compareAsContainer(a, b, compare)
}
