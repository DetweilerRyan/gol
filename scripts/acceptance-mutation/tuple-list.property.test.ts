// Property tests for tuple-list.ts's paren-delimited numeric-tuple handling,
// driven through mutation-rules.ts's mutateValue rather than tuple-list.ts's
// own mutateTupleList directly -- that's deliberate, not an oversight: this
// file is what makes the rule's POSITION in VALUE_RULES (ahead of the plain
// comma-list rule) an observable property rather than an assumption, the
// same way tuple-list.test.ts's own "through mutateValue" block does at the
// unit layer. Every property here therefore also depends on VALUE_RULES
// routing every generated value to the tuple rule in the first place --
// coordinateList below only ever renders values isTupleList accepts.
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
// Why a property rather than more of tuple-list.test.ts's fixed-draw-sequence
// unit tests: those quantify over the draw sequence while holding ONE input
// value fixed (a four-pair, all-single-digit, all-non-negative list). The
// invariant here is over the input domain -- any number of pairs, any
// coordinate magnitude, either sign -- and, via seedKey, over every reachable
// random stream too, so it's a statement about the rule as wired rather than
// about one hand-picked draw sequence. A property nobody has seen fail is
// documentation, so this file was measured against three deliberately broken
// implementations of tuple-list.ts before being accepted. Counts are of THIS
// FILE's ten tests, run as
// `npx vitest run --config vitest.scripts.config.ts <this file>` with
// tuple-list.ts swapped underneath it:
//   * parseTupleList's innerStart off by one (`tupleMatch.index` instead of
//     `tupleMatch.index + 1`) -- every component span is shifted left by one
//     character, into the tuple's own opening paren. 10 of 10 red: every
//     component-change splice corrupts a digit run, which breaks both length
//     and single-changed-pair, and even a swap corrupts (it still swaps two
//     spans, but each span now starts one character too early).
//   * mutateComponent's final splice, `value.slice(0, target.start) +
//     mutated + value.slice(target.end)`, with `target.start` and
//     `target.end` swapped -- 9 of 10 red (every test except the "multi-digit
//     coordinates" degenerate row, which happens to survive this particular
//     corruption on all 40 of its seeds). Reversing the two slice bounds
//     duplicates bytes into the result rather than replacing them, breaking
//     length and the single-changed-pair count on every component-change
//     mutant, and even the transposition property once a swap-branch mutant
//     in the same run also lands on a corrupted component-change one.
//   * spliceSwap's middle-slice boundary, `value.slice(first.end,
//     second.start)` changed to `value.slice(first.start, second.start)` --
//     5 of 10 red: the three fc.prop tests (which generate enough distinct
//     lists and seeds between them to hit the swap branch somewhere), plus
//     two of the seven degenerate rows ("negative coordinates on both axes"
//     and "a sign change straddling zero"). It duplicates `first`'s own text
//     into the gap between the two swapped spans, which is corruption, but
//     the resulting string can still parse back into the *same number* of
//     well-formed-looking pairs for some inputs -- pairsOf's regex has no way
//     to tell a duplicated digit run from a legitimately different one --
//     which is why several single/short fixtures pass despite genuinely
//     having a swap candidate. Read this as the honest limit of a
//     structural (length, one-changed-pair, transposition) property over a
//     regex extraction: it catches corruption when the shape breaks, not
//     every corruption that still happens to parse.

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
// rule's sign handling, and three-digit ones give parseTupleList's span
// arithmetic room to be wrong in a way single-digit fixtures can't reveal.
const coordinate = fc.integer({ min: -999, max: 999 })
const coordinateList = fc.array(fc.tuple(coordinate, coordinate), { minLength: 1, maxLength: 6 })
// The seed key is the run's other degree of freedom: mutateValue seeds its
// generator from `${seedKey}::${value}`, so quantifying over it is what makes
// this a statement about every reachable random stream -- and therefore both
// of tuple-list.ts's mutation strategies -- rather than one of them.
const seedKey = fc.string({ minLength: 1, maxLength: 8 })

describe('the tuple-list rule over parenthesised coordinate pairs', () => {
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

  // component-change only ever splices ONE component's span, so it can never
  // change both of a pair's components at once -- a pair differing in both
  // components can only have come from the swap strategy, and a swap is
  // exactly a transposition (the two original values, reordered), never an
  // independently-mutated pair that happens to differ in both places.
  test.prop([coordinateList, seedKey])(
    'a pair that differs in both components is a transposition of the original',
    (pairs, key) => {
      const value = renderList(pairs)
      const before = pairsOf(value)
      const after = pairsOf(mutateValue(value, key))
      for (let i = 0; i < before.length; i++) {
        const [bx, by] = before[i].split(',')
        const [ax, ay] = after[i].split(',')
        if (ax !== bx && ay !== by) {
          expect([ax, ay].sort()).toEqual([bx, by].sort())
        }
      }
    },
  )

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
        // 40 seed keys rather than one: a single key would pin one path
        // through the tuple rule's class/target draws, and the point of
        // these rows is the input shape, not the stream.
        for (let i = 0; i < 40; i++) {
          const after = pairsOf(mutateValue(value, `degenerate-${i}`))
          expect(after).toHaveLength(before.length)
          expect(after.filter((p, k) => p !== before[k])).toHaveLength(1)
        }
      })
    }
  })
})
