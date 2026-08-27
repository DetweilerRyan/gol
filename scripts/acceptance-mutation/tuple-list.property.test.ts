// Property tests for mutateCommaList's parenthesised-coordinate-pair handling.
//
// The `.property.test.ts` suffix is src/'s convention carried over for
// discoverability and carries NO project meaning here -- scripts/ has no
// `property` vitest project. Measured on this tree: vitest.scripts.config.ts's
// `scripts/**/*.test.ts` include collects this file into the ordinary
// `npm run test:scripts` run, and vite.config.ts's sharedExclude entry for
// `scripts/**` keeps the src-side `property` project (whose include is the
// unrooted `**/*.property.test.ts`) from also collecting it. So there is still
// no scripts-scoped `test:property` command and no role gains an obligation --
// see .claude/agents/articles/engineering.md's "Working inside scripts/".
//
// Why a property rather than more of mutation-rules.test.ts's seed loops: those
// quantify over the random stream while holding ONE input value fixed (a
// four-pair, all-single-digit, all-non-negative list). The invariant here is
// over the input domain -- any number of pairs, any coordinate magnitude, either
// sign -- and that is where the gaps were. A property nobody has seen fail is
// documentation, so this file was measured against three deliberately broken
// implementations before being accepted. Counts are of THIS FILE's ten tests,
// run as `npx vitest run --config vitest.scripts.config.ts <this file>` with
// mutation-rules.ts swapped underneath it:
//   * the pre-slice implementation (no affix strip at all) -- 9 of 10 red. Its
//     first counterexample was the single-pair list "(0, 0)", a shape no unit
//     fixture exercises alone.
//   * `core.slice(0, -1)` mutated to `core.slice(0, 1)` -- 4 of 10 red. That
//     mutant needed a hand-hunted seed to kill in the unit layer, because every
//     unit fixture uses single-digit coordinates, where the two slice
//     directions coincide by construction.
//   * dropping the `+ suffix` affix restore -- 9 of 10 red.

import { fc, test } from '@fast-check/vitest'
import { describe, expect, it } from 'vitest'
import { mutateValue } from './mutation-rules.ts'

const PAIR = /\((-?\d+),\s*(-?\d+)\)/g

function pairsOf(value: string): string[] {
  return [...value.matchAll(PAIR)].map((m) => `${m[1]},${m[2]}`)
}

function renderList(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `(${x}, ${y})`).join(', ')
}

// Deliberately wide on both axes: negative coordinates exercise the integer
// rule's sign handling through the affix strip, and three-digit ones separate
// `core.slice(0, -1)` from every same-result slice a mutant could substitute.
const coordinate = fc.integer({ min: -999, max: 999 })
const coordinateList = fc.array(fc.tuple(coordinate, coordinate), { minLength: 1, maxLength: 6 })
// The seed key is the run's other degree of freedom: mutateValue seeds its
// generator from `${seedKey}::${value}`, so quantifying over it is what makes
// this a statement about every reachable random stream rather than one of them.
const seedKey = fc.string({ minLength: 1, maxLength: 8 })

describe('mutateCommaList over parenthesised coordinate pairs', () => {
  test.prop([coordinateList, seedKey])('mutates to a list of the same length', (pairs, key) => {
    const value = renderList(pairs)
    expect(pairsOf(mutateValue(value, key))).toHaveLength(pairs.length)
  })

  test.prop([coordinateList, seedKey])('changes exactly one pair and leaves the rest byte-identical', (pairs, key) => {
    const value = renderList(pairs)
    const before = pairsOf(value)
    const after = pairsOf(mutateValue(value, key))
    expect(after.filter((p, i) => p !== before[i])).toHaveLength(1)
  })

  test.prop([coordinateList, seedKey])('never duplicates or drops an affix', (pairs, key) => {
    for (const part of mutateValue(renderList(pairs), key).split(',')) {
      const trimmed = part.trim()
      // Each comma-split fragment of a rendered pair list carries exactly one
      // affix: "(x" opens, " y)" closes. A strip that restores nothing yields
      // zero, one that restores twice yields "((x" -- a plain
      // startsWith/endsWith check cannot tell either from correct.
      expect(trimmed.match(/^\(*/)?.[0]).toHaveLength(trimmed.startsWith('(') ? 1 : 0)
      expect(trimmed.match(/\)*$/)?.[0]).toHaveLength(trimmed.endsWith(')') ? 1 : 0)
    }
  })

  // Degenerate values are pinned rather than left to the generator: the
  // counterexamples the three demonstrations above produced were all
  // single-pair lists, which fc.array reaches only at its minLength boundary.
  // See the memory note "Pin edge values, do not trust fc.anything".
  describe('degenerate inputs, pinned deterministically', () => {
    const DEGENERATE: [label: string, value: string][] = [
      ['a single pair', '(0, 0)'],
      ['a single pair at the origin of a longer list', '(0, 0), (1, 1)'],
      ['negative coordinates on both axes', '(-3, -7)'],
      ['a sign change straddling zero', '(0, -1), (-1, 0)'],
      ['multi-digit coordinates', '(123, 456), (7, 89)'],
      ['a multi-digit closing fragment beside a single-digit opening one', '(1, 23)'],
      ['repeated identical pairs', '(2, 2), (2, 2), (2, 2)'],
    ]

    for (const [label, value] of DEGENERATE) {
      it(`stays a same-length list differing in exactly one pair: ${label}`, () => {
        const before = pairsOf(value)
        // 40 seed keys rather than one: a single key would pin one path through
        // mutateCommaList's target choice, and the point of these rows is the
        // input shape, not the stream.
        for (let i = 0; i < 40; i++) {
          const after = pairsOf(mutateValue(value, `degenerate-${i}`))
          expect(after).toHaveLength(before.length)
          expect(after.filter((p, k) => p !== before[k])).toHaveLength(1)
        }
      })
    }
  })
})
