// Shared spec run against both isShallowEqual and isDeepEqual: everything
// here is behavior the two comparators agree on -- the parts of
// structurallyEqual that don't depend on how a leaf comparison is made
// (mismatch symmetry, size/length/key-count guards, container-kind
// dispatch). Collapsing it into one parameterised describe.each instead of
// two near-identical suites is what keeps is-shallow-equal.test.ts and
// is-deep-equal.test.ts from re-diverging into the score-1.00 duplicate the
// ported source implementations had.
//
// Behavior where the two comparators genuinely differ -- shallow's
// no-descent vs. deep's recursion into nested containers -- stays in each
// comparator's own test file instead.
import { describe, expect, it } from 'vitest'
import { isDeepEqual } from './is-deep-equal'
import { isShallowEqual } from './is-shallow-equal'

type Comparator = (a: unknown, b: unknown) => boolean

const comparators: [string, Comparator][] = [
  ['isShallowEqual', isShallowEqual],
  ['isDeepEqual', isDeepEqual],
]

describe.each(comparators)('%s - shared structural-equality contract', (_name, compare) => {
  it('returns true for equal primitive values', () => {
    expect(compare(1, 1)).toBe(true)
    expect(compare('hello', 'hello')).toBe(true)
    expect(compare(true, true)).toBe(true)
  })

  it('returns false for unequal primitive values', () => {
    expect(compare(1, 2)).toBe(false)
    expect(compare('hello', 'world')).toBe(false)
    expect(compare(true, false)).toBe(false)
  })

  it('handles null values', () => {
    expect(compare(null, null)).toBe(true)
    expect(compare(null, {})).toBe(false)
    expect(compare({}, null)).toBe(false)
  })

  it('handles NaN values', () => {
    expect(compare(NaN, NaN)).toBe(true)
    expect(compare(NaN, 1)).toBe(false)
    expect(compare(1, NaN)).toBe(false)
  })

  it('handles +0 and -0 correctly', () => {
    expect(compare(0, 0)).toBe(true)
    expect(compare(0, -0)).toBe(false)
    expect(compare(-0, 0)).toBe(false)
    expect(compare(1, -1)).toBe(false)
  })

  it('handles undefined values', () => {
    expect(compare(undefined, undefined)).toBe(true)
    expect(compare(undefined, null)).toBe(false)
  })

  it('handles functions correctly', () => {
    const func1 = () => {}
    const func2 = () => {}
    expect(compare(func1, func2)).toBe(false)
    expect(compare(func1, func1)).toBe(true)
  })

  it('returns true for Date objects representing the same instant', () => {
    const date1 = new Date(2020, 1, 1)
    const date2 = new Date(2020, 1, 1)
    expect(compare(date1, date1)).toBe(true)
    expect(compare(date1, date2)).toBe(true)
  })

  it('returns false for Date objects representing different instants', () => {
    expect(compare(new Date(2020, 1, 1), new Date(2021, 1, 1))).toBe(false)
  })

  it('returns true for equal plain objects with primitive values', () => {
    expect(compare({ a: 1, b: 'test', c: true }, { a: 1, b: 'test', c: true })).toBe(true)
  })

  it('returns false for objects with different values', () => {
    expect(compare({ a: 1, b: 'test' }, { a: 1, b: 'different' })).toBe(false)
  })

  it('returns false for objects with the same key count but different key names', () => {
    expect(compare({ a: 1, b: 'test' }, { a: 1, c: 'test' })).toBe(false)
  })

  it('returns false when a key is own on a but only inherited (not own) on b', () => {
    // Distinguishes the hasOwnProperty guard from a bare value comparison:
    // b's own keys don't include 'shared' at all, but `b.shared` still
    // resolves to a matching value via the prototype chain. If the guard
    // were removed, comparing a.shared to b.shared would (wrongly) see two
    // equal values and report true.
    const proto = { shared: 'x' }
    const a = { shared: 'x' }
    const b = Object.create(proto) as { somethingElse: number }
    b.somethingElse = 1
    expect(compare(a, b)).toBe(false)
  })

  it('returns true for equal arrays of primitives', () => {
    expect(compare([1, 2, 3], [1, 2, 3])).toBe(true)
  })

  it('returns false for arrays with different elements', () => {
    expect(compare([1, 2, 3], [1, 2, 4])).toBe(false)
  })

  it('returns true for Sets with equal primitive elements', () => {
    expect(compare(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true)
  })

  it('treats Set([-0]) and Set([0]) as equal (unchanged: a Set cannot hold -0 at all)', () => {
    // Not a behavior change from the ported original: Set.prototype.add
    // normalizes -0 to +0 at insertion (ECMAScript spec, verified in
    // node), so `new Set([-0])` already contains +0 the moment it's
    // constructed. Both Sets here are indistinguishable from `Set([0])`
    // before this function ever runs -- there's no +0/-0 divergence for
    // this comparison to observe either way.
    expect(compare(new Set([-0]), new Set([0]))).toBe(true)
    expect(compare(new Set([0]), new Set([-0]))).toBe(true)
  })

  it('returns false for Sets with different elements', () => {
    expect(compare(new Set([1, 2, 3]), new Set([1, 2, 4]))).toBe(false)
  })

  it('returns true for Maps with equal primitive key-value pairs', () => {
    const entries: [string, string][] = [
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]
    expect(compare(new Map(entries), new Map(entries))).toBe(true)
  })

  it.each<[string, [string, string][], [string, string][]]>([
    [
      'different values, same keys',
      [
        ['key1', 'value1'],
        ['key2', 'value2'],
      ],
      [
        ['key1', 'value1'],
        ['key2', 'differentValue'],
      ],
    ],
    [
      // Exercises mapsEqual's `!b.has(key)` guard specifically: same size,
      // so only the key mismatch -- not a size check -- can reject this.
      'same size, different keys',
      [
        ['key1', 'value1'],
        ['key2', 'value2'],
      ],
      [
        ['key1', 'value1'],
        ['key3', 'value2'],
      ],
    ],
  ])('returns false for Maps with %s', (_label, entriesA, entriesB) => {
    expect(compare(new Map(entriesA), new Map(entriesB))).toBe(false)
  })

  describe('container size/length mismatches (both directions)', () => {
    // Every one-directional (larger-vs-smaller only) comparison leaves the
    // opposite direction's size/length guard uncovered, so a mutant that
    // negates it (`!==` -> `===`) survives: e.g. Set([1,2,3]) vs Set([1,2])
    // is still false under the mutant because items of a are missing from
    // b. Only the subset-vs-superset direction is distinguishing.
    it.each<[string, unknown, unknown]>([
      ['Set: subset vs superset', new Set([1, 2]), new Set([1, 2, 3])],
      ['Set: superset vs subset', new Set([1, 2, 3]), new Set([1, 2])],
      [
        'Map: subset vs superset',
        new Map([['key1', 'value1']]),
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
      ],
      [
        'Map: superset vs subset',
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
        new Map([['key1', 'value1']]),
      ],
      ['Array: shorter vs longer', [1, 2], [1, 2, 3]],
      ['Array: longer vs shorter', [1, 2, 3], [1, 2]],
      ['Object: fewer keys vs more keys', { a: 1 }, { a: 1, b: 2 }],
      ['Object: more keys vs fewer keys', { a: 1, b: 2 }, { a: 1 }],
    ])('%s -> false', (_label, a, b) => {
      expect(compare(a, b)).toBe(false)
    })
  })

  describe('empty-container cross-comparisons', () => {
    // Distinguishes the container-kind guards from a size/key-count check
    // alone: two *empty* containers of different kinds have equal size (0)
    // and equal key count (0), so only the kind check itself rejects them.
    it.each<[string, unknown, unknown]>([
      ['empty Set vs empty object', new Set(), {}],
      ['empty object vs empty Set', {}, new Set()],
      ['empty Map vs empty array', new Map(), []],
      ['empty array vs empty Map', [], new Map()],
      ['empty Set vs empty Map', new Set(), new Map()],
      ['empty array vs empty object', [], {}],
    ])('%s -> false', (_label, a, b) => {
      expect(compare(a, b)).toBe(false)
    })
  })

  describe('Date mismatches (both directions)', () => {
    // The original implementations had no mismatch guard for Date, so
    // `Date vs {}` fell through to key comparison: Object.keys(date) is
    // [], two empty key sets compared equal, and the result was (wrongly)
    // true. The container-kind table used by structurallyEqual makes
    // symmetric mismatch handling the default, so both directions are now
    // false.
    it.each<[string, unknown, unknown]>([
      ['Date vs plain object', new Date(2020, 1, 1), {}],
      ['plain object vs Date', {}, new Date(2020, 1, 1)],
      ['Date vs Date-shaped plain object', new Date(2020, 1, 1), { getTime: () => 0 }],
      ['Date-shaped plain object vs Date', { getTime: () => 0 }, new Date(2020, 1, 1)],
    ])('%s -> false', (_label, a, b) => {
      expect(compare(a, b)).toBe(false)
    })

    it('still returns false for a Date compared with an array (already correct)', () => {
      expect(compare(new Date(2020, 1, 1), [])).toBe(false)
    })
  })

  it('returns false for an array compared with a plain object', () => {
    // The array-vs-non-array mismatch branch had zero coverage in the
    // ported source: the Set/Map guards above it in the chain always
    // returned first for every ported test case. Neither operand here is a
    // Set or Map.
    expect(compare([1, 2], { a: 1, b: 2 })).toBe(false)
    expect(compare({ a: 1, b: 2 }, [1, 2])).toBe(false)
  })

  it('returns false for a primitive compared with an object', () => {
    expect(compare(1, {})).toBe(false)
    expect(compare({}, 1)).toBe(false)
  })

  it('returns false for a Set compared with an array or a plain object', () => {
    const set1 = new Set([1, 2, 3])
    expect(compare(set1, [1, 2, 3])).toBe(false)
    expect(compare(set1, { a: 1, b: 2, c: 3 })).toBe(false)
  })

  it('returns false for a Map compared with a plain object or an array of entries', () => {
    const map1 = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
    expect(compare(map1, { key1: 'value1', key2: 'value2' })).toBe(false)
    expect(
      compare(map1, [
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]),
    ).toBe(false)
  })
})
