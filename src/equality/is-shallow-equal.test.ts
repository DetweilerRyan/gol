// Shallow-specific behavior only -- the contract isShallowEqual shares with
// isDeepEqual (mismatch handling, size/length/key-count guards, primitive
// leaves) lives once in structural-equality-contract.test.ts instead of
// being duplicated here.
import { describe, expect, it } from 'vitest'
import { isShallowEqual } from './is-shallow-equal'

describe('isShallowEqual - does not descend into nested containers', () => {
  it('returns false for arrays containing objects, even with matching shapes', () => {
    expect(isShallowEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toBe(false)
  })

  it('returns false for objects containing nested objects/arrays, even with matching shapes', () => {
    expect(isShallowEqual({ a: 1, b: { c: 2, d: [3, 4] } }, { a: 1, b: { c: 2, d: [3, 4] } })).toBe(false)
  })

  it('returns false for Sets of objects, even with matching shapes', () => {
    expect(isShallowEqual(new Set([{ a: 1 }, { b: 2 }]), new Set([{ a: 1 }, { b: 2 }]))).toBe(false)
  })

  it('returns false for Maps of objects, even with matching shapes', () => {
    const map1 = new Map([
      ['key1', { nested: 'value1' }],
      ['key2', { nested: 'value2' }],
    ])
    const map2 = new Map([
      ['key1', { nested: 'value1' }],
      ['key2', { nested: 'value2' }],
    ])
    expect(isShallowEqual(map1, map2)).toBe(false)
  })
})

describe('isShallowEqual - Sets and Maps with nested reference equality', () => {
  it('returns true for Sets with nested values having reference equality', () => {
    const obj = { a: 1 }
    expect(isShallowEqual(new Set([obj, 2, 3]), new Set([obj, 2, 3]))).toBe(true)
  })

  it('returns false for Sets with nested values having different references', () => {
    expect(isShallowEqual(new Set([{ a: 1 }, 2, 3]), new Set([{ a: 1 }, 2, 3]))).toBe(false)
  })

  it('returns true for Maps with nested values having reference equality', () => {
    const obj = { a: 1 }
    const map1 = new Map<string, unknown>([
      ['key1', obj],
      ['key2', 'value2'],
    ])
    const map2 = new Map<string, unknown>([
      ['key1', obj],
      ['key2', 'value2'],
    ])
    expect(isShallowEqual(map1, map2)).toBe(true)
  })

  it('returns false for Maps with nested values having different references', () => {
    const map1 = new Map<string, unknown>([
      ['key1', { a: 1 }],
      ['key2', 'value2'],
    ])
    const map2 = new Map<string, unknown>([
      ['key1', { a: 1 }],
      ['key2', 'value2'],
    ])
    expect(isShallowEqual(map1, map2)).toBe(false)
  })

  it('returns true for Sets with identical nested Sets having reference equality', () => {
    const nestedSet = new Set([1, 2])
    expect(isShallowEqual(new Set([nestedSet, 3]), new Set([nestedSet, 3]))).toBe(true)
  })

  it('returns true for Maps with identical nested Maps having reference equality', () => {
    const nestedMap = new Map([['nestedKey', 'nestedValue']])
    const map1 = new Map<string, unknown>([
      ['key1', nestedMap],
      ['key2', 'value2'],
    ])
    const map2 = new Map<string, unknown>([
      ['key1', nestedMap],
      ['key2', 'value2'],
    ])
    expect(isShallowEqual(map1, map2)).toBe(true)
  })
})
