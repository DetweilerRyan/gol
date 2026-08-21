import { describe, expect, it } from 'vitest'
import { buildSeededLiveCells, parseSeedRequest } from './liveCellSeed'

describe('parseSeedRequest', () => {
  it('returns undefined when the cells param is absent -- no seeding requested', () => {
    expect(parseSeedRequest('')).toBeUndefined()
    expect(parseSeedRequest('?spread=10&seed=2')).toBeUndefined()
  })

  it('defaults spread to 200 and seed to 1 when absent', () => {
    expect(parseSeedRequest('?cells=5')).toEqual({ count: 5, spread: 200, seed: 1 })
  })

  it('parses all three params when present', () => {
    expect(parseSeedRequest('?cells=50000&spread=200&seed=1')).toEqual({ count: 50000, spread: 200, seed: 1 })
  })

  it('accepts count 0 and yields an empty request', () => {
    expect(parseSeedRequest('?cells=0')).toEqual({ count: 0, spread: 200, seed: 1 })
  })

  it('accepts spread 0, whose capacity is exactly 1', () => {
    expect(parseSeedRequest('?cells=1&spread=0')).toEqual({ count: 1, spread: 0, seed: 1 })
  })

  it('rejects a count that exceeds the (2*spread+1)^2 capacity', () => {
    // spread=30 -> side=61 -> capacity=3721
    expect(parseSeedRequest('?cells=3722&spread=30')).toBeUndefined()
  })

  it('accepts a count exactly at capacity', () => {
    expect(parseSeedRequest('?cells=3721&spread=30')).toEqual({ count: 3721, spread: 30, seed: 1 })
  })

  it('rejects a negative-looking count', () => {
    expect(parseSeedRequest('?cells=-1')).toBeUndefined()
  })

  it('rejects a non-integer count', () => {
    expect(parseSeedRequest('?cells=1.5')).toBeUndefined()
  })

  it('rejects a non-numeric count', () => {
    expect(parseSeedRequest('?cells=abc')).toBeUndefined()
  })

  // The digit-only regex is anchored at both ends specifically so trailing
  // junk after valid-looking digits is rejected outright, rather than
  // reaching Number() -- which parses "1e3" as 1000 and "0x10" as 16, both
  // safe integers that would otherwise slip through as a valid count.
  it('rejects trailing non-digit characters that Number() would otherwise parse', () => {
    expect(parseSeedRequest('?cells=1e3')).toBeUndefined()
    expect(parseSeedRequest('?cells=0x10')).toBeUndefined()
  })

  it('rejects a count above Number.MAX_SAFE_INTEGER', () => {
    expect(parseSeedRequest('?cells=99999999999999999999')).toBeUndefined()
  })

  it('rejects an invalid spread even when count is otherwise valid', () => {
    expect(parseSeedRequest('?cells=5&spread=-1')).toBeUndefined()
  })

  it('rejects an invalid seed even when count and spread are otherwise valid', () => {
    expect(parseSeedRequest('?cells=5&seed=nope')).toBeUndefined()
  })

  it('never throws on malformed query strings', () => {
    expect(() => parseSeedRequest('not a query string at all')).not.toThrow()
    expect(() => parseSeedRequest('?cells=&spread=&seed=')).not.toThrow()
  })
})

describe('buildSeededLiveCells', () => {
  it('returns an empty set for count 0', () => {
    expect(buildSeededLiveCells({ count: 0, spread: 200, seed: 1 })).toEqual(new Set())
  })

  it('produces exactly `count` distinct cells', () => {
    const result = buildSeededLiveCells({ count: 500, spread: 50, seed: 1 })
    expect(result.size).toBe(500)
  })

  it('fills the grid completely when count equals capacity', () => {
    // spread=1 -> side=3 -> capacity=9
    const result = buildSeededLiveCells({ count: 9, spread: 1, seed: 7 })
    expect(result.size).toBe(9)
    const expected = new Set<string>()
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        expected.add(`${x},${y}`)
      }
    }
    expect(result).toEqual(expected)
  })

  it('is deterministic for the same request', () => {
    const request = { count: 200, spread: 40, seed: 42 }
    const a = [...buildSeededLiveCells(request)].sort()
    const b = [...buildSeededLiveCells(request)].sort()
    expect(a).toEqual(b)
  })

  it('produces a different set for a different seed', () => {
    const a = buildSeededLiveCells({ count: 200, spread: 40, seed: 1 })
    const b = buildSeededLiveCells({ count: 200, spread: 40, seed: 2 })
    expect([...a].sort()).not.toEqual([...b].sort())
  })

  // Pins the exact LCG output for one small, hand-verifiable case rather than
  // only checking count/uniqueness/bounds -- those coarser invariants hold
  // for many different recurrences, so on their own they don't distinguish
  // this specific multiplier/increment pair (or its sign) from a different
  // one that would place the same count of cells somewhere else entirely.
  it('places cells at the exact positions this seed/spread/count produces', () => {
    const result = buildSeededLiveCells({ count: 6, spread: 2, seed: 3 })
    expect([...result].sort()).toEqual(['-1,2', '-2,-1', '0,2', '1,0', '2,-1', '2,1'])
  })
})
