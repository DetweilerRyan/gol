import { describe, expect, it } from 'vitest'
import { mutateValue, seededRandom } from './mutation-rules.ts'

// Numeric rules must produce a *numerically* different value that still looks
// like the same kind of literal -- "020" would satisfy a string comparison
// against "20" without being a real mutation. Swept across a spread of seeds
// because each (value, seedKey) pair is deterministic, so any single seed can
// hide a rule that only misbehaves on some draws.
function expectNumericMutantsOverSeeds(original: string, seedPrefix: string, shape: RegExp): void {
  for (let i = 0; i < 50; i++) {
    const mutated = mutateValue(original, `${seedPrefix}-${i}`)
    expect(mutated).toMatch(shape)
    expect(Number(mutated)).not.toBe(Number(original))
  }
}

// The ISO rules share one contract: a different value that still parses as the
// same shape it started as, so the mutated feature file stays syntactically
// valid and the scenario fails on the value rather than on a parse error.
function expectIsoMutant(original: string, seedKey: string, shape: RegExp): void {
  const mutated = mutateValue(original, seedKey)
  expect(mutated).toMatch(shape)
  expect(mutated).not.toBe(original)
}

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
      expectNumericMutantsOverSeeds('20', 'int', /^-?\d+$/)
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
      expectNumericMutantsOverSeeds('3.14', 'float', /^-?\d+\.\d{2}$/)
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

    it('lowercases an already-uppercase letter under the case strategy, not just uppercases it', () => {
      // Every other free-text fixture above is all-lowercase, so
      // `ch === ch.toUpperCase()` is always false for them and the case
      // strategy's true branch (lowercase an uppercase char) never actually
      // runs -- both the real ternary and a mutant collapsing it to "always
      // uppercase" produce identical output. 'hunt-13' is a seed hunted
      // against the *unmutated* code to land on the case strategy for a
      // single uppercase letter, so this exercises the branch a mutant
      // there could otherwise flip unnoticed.
      expect(mutateValue('A', 'hunt-13')).toBe('a')
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

    // A paren-delimited list of numeric tuples ("(0, 0), (1, 0)") is claimed
    // by the tuple-list rule (tuple-list.ts), which sits ahead of this one in
    // VALUE_RULES -- see tuple-list.test.ts for that shape's own coverage,
    // including the fixtures that used to live here as regression tests for
    // mutateCommaList's now-deleted strip-and-restore patch.
  })

  describe('ISO-8601 dates', () => {
    it('shifts the date by a few days', () => {
      expectIsoMutant('2026-05-13', 'k', /^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('ISO-8601 datetimes', () => {
    it('shifts the timestamp by a few minutes', () => {
      expectIsoMutant('2026-05-13T10:00:00.000Z', 'k', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('ISO-8601 durations', () => {
    it('bumps the numeric component while preserving valid syntax', () => {
      expectIsoMutant('P3D', 'k', /^P\d+D$/)
    })

    it('never bumps below 1', () => {
      for (let i = 0; i < 30; i++) {
        const mutated = mutateValue('P1D', `dur-${i}`)
        expect(Number(mutated.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1)
      }
    })

    it('never clamps back to the original value (e.g. 1 + -1 -> max(1, 0) -> 1)', () => {
      for (let i = 0; i < 30; i++) {
        expect(mutateValue('P1D', `clamp-${i}`)).not.toBe('P1D')
      }
    })
  })
})

// The exact output of this module is load-bearing, not an implementation
// detail: `npm run acceptance-mutation` reports a mutant/killed/survived split
// that every role checks its work against, and that figure only means anything
// because a given (value, seedKey) pair always produces the same mutant. Any
// change to the hash, the mulberry32 draws, the draw *order*, or which rule
// claims a value silently invalidates it. These two tables pin that down.
//
// The figure itself is deliberately NOT written down here. This comment used
// to carry `142 mutants | 128 killed | 14 survived | 90.1%` and had gone stale
// by a wide margin -- not drifted, but left behind by the runner's move onto
// playwright-bdd and by the pruning of the Examples tables it counts. A
// literal here is wrong the moment the next slice lands, and reads as
// authoritative while being wrong, which is the worse of the two failure
// modes. Take the current figure from `product`'s most recent VERIFY handoff
// on main, which is where .claude/agents/articles/engineering.md points for it
// and for the same stated reason.
//
// The near-miss rows are the point of the value table, not padding: "2026-5-13"
// and "3." and "PT" are there so a rule's pattern can't quietly widen to
// swallow a value belonging to another rule or to the free-text fallback.
describe('pinned mutants', () => {
  const PINNED: [original: string, mutated: string][] = [
    // integers, then values the integer rule must not claim
    ['20', '16'],
    ['-500', '-503'],
    ['0', '-3'],
    ['007', '8'],
    ['123456', '123450'],
    ['20a', '2a0'],
    ['a20', 'aa20'],
    ['2 0', '2c 0'],
    ['+20', '+p0'],
    ['20.', '02.'],
    // decimals, then near-misses
    ['3.14', '2.55'],
    ['0.001', '0.054'],
    ['1.5', '2.3'],
    ['-2.75', '-3.65'],
    ['10.0', '9.6'],
    ['3.', '3i'],
    ['.14', '1.4'],
    ['3.14.15', '3.1.415'],
    ['-.5', '-a5'],
    // booleans, then near-misses
    ['true', 'false'],
    ['false', 'true'],
    ['True', 'False'],
    ['FALSE', 'True'],
    ['truex', 'trex'],
    ['ffalse', 'Ffalse'],
    ['tru', 'rtu'],
    // anchor near-misses: a prefix/suffix around the literal must not let the
    // boolean rule fire (comma-list-mutants-are-all-syntax-breaking mutation
    // scan: dropping `^` from /^true$/i, or `$` from /^false$/i, lets these
    // match and mutate the whole value with matchCase instead of falling
    // through to the free-text rule)
    ['xtrue', 'xtruE'],
    ['falsey', 'falsez'],
    // null-likes, then near-misses
    ['null', 'nlul'],
    ['nil', 'nIl'],
    ['none', 'onne'],
    ['NULL', 'NUlL'],
    ['None', 'Nonx'],
    ['nulls', 'unlls'],
    ['nill', 'ill'],
    ['no', 'wno'],
    // ISO dates, then near-misses
    ['2026-05-13', '2026-05-16'],
    ['1999-01-01', '1998-12-27'],
    ['2026-5-13', '2026-5-1i'],
    ['2026-05-13x', '2w26-05-13x'],
    ['26-05-13', '2-605-13'],
    // an anchor near-miss, not a shape near-miss: 'x2026-05-13' has a real
    // ISO_DATE substring but a prefix breaks the exact match, so this must
    // fall through to the free-text rule (mutation scan: dropping `^` from
    // ISO_DATE lets a prefixed date match, and mutateIsoDate then throws on
    // an Invalid Date built from a non-date string)
    ['x2026-05-13', 'x202z6-05-13'],
    // ISO datetimes (with and without seconds/offset), then near-misses
    ['2026-05-13T10:00:00.000Z', '2026-05-13T09:58:00.000Z'],
    ['2026-05-13T10:00', '2026-05-13T14:13:00.000Z'],
    ['2026-05-13T10:00:00+02:00', '2026-05-13T07:39:00.000Z'],
    ['2026-05-13T10', '0226-05-13T10'],
    ['2026-05-13 10:00', '2026-05-13 10:0u0'],
    // same anchor-near-miss shape as the ISO_DATE row above, one for each end
    // (mutation scan: dropping `^` or `$` from ISO_DATETIME)
    ['x2026-05-13T10:00', 'x2026-0-13T10:00'],
    ['2026-05-13T10:00x', '2026-0513T10:00x'],
    // ISO durations, then near-misses (including the digitless "P"/"PT")
    ['P3D', 'P1D'],
    ['P1D', 'P2D'],
    ['PT5M', 'PT6M'],
    ['P1Y2M3D', 'P2Y2M3D'],
    ['PT2H30M', 'PT3H30M'],
    ['P', 'wP'],
    ['PT', 'lPT'],
    ['p3d', 'p3x'],
    ['3D', 'mD'],
    ['XP3D', 'P3D'],
    // multi-digit components, one per duration field (mutation scan: the
    // pinned rows above only ever exercise single-digit years/months/days/
    // hours/seconds, so a mutant narrowing ISO_DURATION's `\d+` to `\d` for
    // any one field, or mutateIsoDuration's own `/\d+/` match, went
    // unnoticed). 'PT12H' also covers the T-group's minutes becoming
    // mandatory, since it has an hours component and no minutes.
    ['P12D', 'P10D'],
    ['P10Y', 'P7Y'],
    ['P11M', 'P13M'],
    ['PT12H', 'PT11H'],
    ['PT30S', 'PT27S'],
    // a suffix after an otherwise-valid duration must not match (mutation
    // scan: dropping the trailing `$` from ISO_DURATION)
    ['P3Dx', 'p3Dx'],
    // comma lists, then all-blank lists that fall through to the string rule
    ['alive,dead,alive', 'aliVe,dead,alive'],
    ['1,2', '6,2'],
    ['a,', 'ga,'],
    [',b', ',B'],
    ['2026-05-13,P3D', '2026-05-13,P4D'],
    // a paren-delimited list of numeric tuples: claimed by the tuple-list
    // rule (tuple-list.ts), ahead of this one, which parses the pairs
    // directly rather than patching around a flat comma-split -- see
    // tuple-list.test.ts for that rule's own coverage.
    ['(0, 0), (1, 0), (0, 1), (1, 1)', '(0, 0), (1, 0), (0, 1), (-5, 1)'],
    // the tuple-list rule's boundary: this list is paren-delimited but its
    // first item, "2026-05-13, P3D", is a date and a duration rather than a
    // pair of integers, so isTupleList rejects it (mixed, non-numeric
    // components) and it falls through to the plain comma-list rule above --
    // which still has no notion of a paren, so the mutant lands on
    // punctuation rather than a value. This is the tuple grammar's boundary,
    // not the affix-strip regression this row used to document: without a
    // strict "numeric tuples only" predicate, a rule aggressive enough to
    // reshape "(0" / " 0)" into "0" would reshape this list's non-tuple
    // items the same way and mutate the wrong thing.
    ['(2026-05-13, P3D), (1, 2)', '(2026-05-13, P3D), (1, v)'],
    [',', ''],
    [',,', ','],
    [' , ', ' x, '],
    // free text, covering all five string strategies
    ['alive', 'aLive'],
    ['x', 'qx'],
    ['X', ''],
    ['balloon', 'ballpon'],
    ['aaaa', 'saaa'],
    ['', 'f'],
    ['Alive', 'Alvie'],
    ['A B', 'AzB'],
    ['dead', 'daed'],
    ['9x', 'x9'],
    ['LWSS (Lightweight Spaceship)', 'LWSS (Lightwight Spaceship)'],
  ]

  it.each(PINNED)('mutates %j to %j under the "pinned" seed key', (original, mutated) => {
    expect(mutateValue(original, 'pinned')).toBe(mutated)
  })

  // seededRandom is pinned separately from mutateValue because it's the
  // upstream of every row above: if the mulberry32 constants or the seed hash
  // drift, this fails on its own rather than as 90 confusing table failures.
  it.each([
    ['seed', [0.5452382741495967, 0.3154050074517727, 0.3575042944867164, 0.4742251511197537]],
    ['pinned::20', [0.2900203890167177, 0.5188606553710997, 0.029390834271907806, 0.11894456413574517]],
  ])('draws a stable sequence for the seed %j', (seedString, expected) => {
    const rand = seededRandom(seedString)
    expect(expected.map(() => rand())).toEqual(expected)
  })
})
