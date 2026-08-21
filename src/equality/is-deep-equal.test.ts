// Deep-specific behavior only -- the contract isDeepEqual shares with
// isShallowEqual (mismatch handling, size/length/key-count guards,
// primitive leaves) lives once in structural-equality-contract.test.ts
// instead of being duplicated here.
import { describe, expect, it } from 'vitest'
import { isDeepEqual } from './is-deep-equal'

describe('isDeepEqual - descends into nested containers', () => {
  it('returns true for objects with matching nested objects/arrays', () => {
    expect(isDeepEqual({ a: 1, b: { c: 2, d: [3, 4] } }, { a: 1, b: { c: 2, d: [3, 4] } })).toBe(true)
  })

  it('returns true for arrays with matching nested objects', () => {
    expect(isDeepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toBe(true)
  })

  it('returns false for arrays whose nested objects differ', () => {
    expect(isDeepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 3 }])).toBe(false)
  })

  it('returns true for Sets and Maps nesting equal Sets/Maps', () => {
    const set1 = new Set([new Map([['key1', 'value1']]), new Set([1, 2])])
    const set2 = new Set([new Map([['key1', 'value1']]), new Set([1, 2])])
    expect(isDeepEqual(set1, set2)).toBe(true)

    const map1 = new Map<string, unknown>([
      ['key1', new Set([1, 2, 3])],
      ['key2', new Map([['nestedKey', 'nestedValue']])],
    ])
    const map2 = new Map<string, unknown>([
      ['key1', new Set([1, 2, 3])],
      ['key2', new Map([['nestedKey', 'nestedValue']])],
    ])
    expect(isDeepEqual(map1, map2)).toBe(true)
  })

  it('matches Set members as a multiset, not "does a match exist anywhere"', () => {
    // Each of Set([{}, {}])'s two distinct-but-deeply-equal members must
    // consume its own match in the other Set, not the same single member
    // twice. Without consuming a matched member, both {} entries in the
    // left-hand Set would each report a match against the single {} in the
    // right-hand Set, making this comparison wrongly `true` in one
    // direction while its reverse is correctly `false` -- an asymmetry the
    // symmetry property test is designed to catch on any input shape, this
    // is the concrete case pinned down as a unit test.
    const e1 = {}
    const e2 = {}
    const f = {}
    const g = { a: 1 }
    expect(isDeepEqual(new Set([e1, e2]), new Set([f, g]))).toBe(false)
    expect(isDeepEqual(new Set([f, g]), new Set([e1, e2]))).toBe(false)
  })

  it('returns true for Sets of distinct-but-deeply-equal empty objects, size for size', () => {
    expect(isDeepEqual(new Set([{}, {}]), new Set([{}, {}]))).toBe(true)
  })
})
