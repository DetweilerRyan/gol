import { describe, expect, it } from 'vitest'
import { mutateValue, seededRandom } from './mutation-rules.mjs'

describe('seededRandom', () => {
  it('is deterministic for the same seed', () => {
    const a = seededRandom('seed')
    const b = seededRandom('seed')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('differs across seeds', () => {
    const a = seededRandom('seed-a')
    const b = seededRandom('seed-b')
    expect(a()).not.toBe(b())
  })
})

describe('mutateValue', () => {
  it('is deterministic for the same seedKey and value', () => {
    expect(mutateValue('20', 'k')).toBe(mutateValue('20', 'k'))
  })

  it('produces different mutants for different seedKeys with the same value', () => {
    const results = new Set(Array.from({ length: 20 }, (_, i) => mutateValue('20', `k${i}`)))
    expect(results.size).toBeGreaterThan(1)
  })

  describe('integers', () => {
    it('adds a nonzero delta', () => {
      for (let i = 0; i < 50; i++) {
        const mutated = mutateValue('20', `int-${i}`)
        expect(mutated).toMatch(/^-?\d+$/)
        expect(Number(mutated)).not.toBe(20)
      }
    })

    it('handles negative integers', () => {
      const mutated = mutateValue('-500', 'neg')
      expect(mutated).toMatch(/^-?\d+$/)
      expect(Number(mutated)).not.toBe(-500)
    })

    it('handles zero', () => {
      const mutated = mutateValue('0', 'zero')
      expect(mutated).toMatch(/^-?\d+$/)
      expect(Number(mutated)).not.toBe(0)
    })
  })

  describe('floats', () => {
    it('adds a nonzero delta and preserves decimal precision', () => {
      for (let i = 0; i < 50; i++) {
        const mutated = mutateValue('3.14', `float-${i}`)
        expect(mutated).toMatch(/^-?\d+\.\d{2}$/)
        expect(Number(mutated)).not.toBe(3.14)
      }
    })

    it('mutates a small decimal like 0.001', () => {
      const mutated = mutateValue('0.001', 'small')
      expect(mutated).toMatch(/^-?\d+\.\d{3}$/)
      expect(Number(mutated)).not.toBe(0.001)
    })

    it('never rounds back to the original via toFixed (e.g. 1.5 + 0.001 -> "1.5")', () => {
      for (let i = 0; i < 50; i++) {
        expect(mutateValue('1.5', `round-${i}`)).not.toBe('1.5')
      }
    })
  })

  describe('booleans', () => {
    it('flips true to false', () => {
      expect(mutateValue('true', 'k')).toBe('false')
    })

    it('flips false to true', () => {
      expect(mutateValue('false', 'k')).toBe('true')
    })

    it('is case-insensitive and preserves case style', () => {
      expect(mutateValue('True', 'k')).toBe('False')
    })
  })

  describe('null-like values', () => {
    it('replaces null with a non-empty string', () => {
      const mutated = mutateValue('null', 'k')
      expect(mutated.length).toBeGreaterThan(0)
      expect(mutated).not.toBe('null')
    })
  })

  describe('strings', () => {
    it('mutates a plain word into something different', () => {
      for (let i = 0; i < 30; i++) {
        expect(mutateValue('alive', `word-${i}`)).not.toBe('alive')
      }
    })

    it('inserts a character into an empty string', () => {
      const mutated = mutateValue('', 'k')
      expect(mutated.length).toBe(1)
    })

    it('still changes a single-character string', () => {
      for (let i = 0; i < 30; i++) {
        expect(mutateValue('x', `single-${i}`)).not.toBe('x')
      }
    })

    it('still changes a word with adjacent duplicate characters (swap no-op guard)', () => {
      // A naive swap of two identical adjacent characters (the "ll"/"oo" in
      // "balloon") would reproduce the original string unnoticed.
      for (let i = 0; i < 30; i++) {
        expect(mutateValue('balloon', `dup-${i}`)).not.toBe('balloon')
      }
    })

    it('still changes a string made of one repeated character', () => {
      // No swap could ever change "aaaa" -- must fall back to another strategy.
      for (let i = 0; i < 30; i++) {
        expect(mutateValue('aaaa', `repeat-${i}`)).not.toBe('aaaa')
      }
    })
  })

  describe('comma-delimited lists', () => {
    it('mutates exactly one item and preserves the rest', () => {
      const mutated = mutateValue('alive,dead,alive', 'k')
      const parts = mutated.split(',')
      expect(parts).toHaveLength(3)
      const original = ['alive', 'dead', 'alive']
      const changedCount = parts.filter((p, i) => p !== original[i]).length
      expect(changedCount).toBe(1)
    })
  })

  describe('ISO-8601 dates', () => {
    it('shifts the date by a few days', () => {
      const mutated = mutateValue('2026-05-13', 'k')
      expect(mutated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(mutated).not.toBe('2026-05-13')
    })
  })

  describe('ISO-8601 datetimes', () => {
    it('shifts the timestamp by a few minutes', () => {
      const mutated = mutateValue('2026-05-13T10:00:00.000Z', 'k')
      expect(mutated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(mutated).not.toBe('2026-05-13T10:00:00.000Z')
    })
  })

  describe('ISO-8601 durations', () => {
    it('bumps the numeric component while preserving valid syntax', () => {
      const mutated = mutateValue('P3D', 'k')
      expect(mutated).toMatch(/^P\d+D$/)
      expect(mutated).not.toBe('P3D')
    })

    it('never bumps below 1', () => {
      for (let i = 0; i < 30; i++) {
        const mutated = mutateValue('P1D', `dur-${i}`)
        expect(Number(mutated.match(/\d+/)[0])).toBeGreaterThanOrEqual(1)
      }
    })

    it('never clamps back to the original value (e.g. 1 + -1 -> max(1, 0) -> 1)', () => {
      for (let i = 0; i < 30; i++) {
        expect(mutateValue('P1D', `clamp-${i}`)).not.toBe('P1D')
      }
    })
  })
})
