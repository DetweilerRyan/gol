// Property tests for pairKey, the dedupe set's key for an unordered pair of
// step texts. Its whole job is to be INJECTIVE over unordered pairs (see
// analyze.ts) -- a collision makes dedupePairs.has() answer "already
// explained" about a pair nothing explained, and that pair's finding
// disappears from a report that exits 0 either way.
//
// The `.property.test.ts` suffix carries no project meaning in scripts/ --
// there is no `property` vitest project here; vitest.scripts.config.ts's
// `scripts/**/*.test.ts` include collects this file into the ordinary
// `npm run test:scripts` run. Same note as mutation-rules.property.test.ts.
//
// Why a property rather than more fixtures: analyze.test.ts already carries
// four hand-built collision corpora, and the fourth of them exists because
// the shipped `[a, b].sort().join(' ')` encoding really did drop findings.
// Four witnesses cannot say the fifth encoding is safe; a quantified
// statement can.
//
// Measured against three deliberately broken implementations of pairKey,
// running just this file with `npx vitest run --config
// vitest.scripts.config.ts scripts/gherkin-dry-checker/analyze.property.test.ts`.
// Counts are of THIS FILE's tests as of that measurement (8, before the
// deterministic twin below was added); the property rows were repeated rather
// than run once, since a generator that only SOMETIMES finds a counterexample
// is a generator that will one day not find one. They turned out not to be
// sometimes: every figure below held on every repeat, and the sort-dropped
// row was independently re-measured at 30 runs out of 30. So read these as
// deterministic for these arbitraries, not as sample rates:
//   * `[a, b].sort().join(' ')` -- the encoding this file was written to
//     retire, and the one that really was shipping. 3 of 8 red, 5 runs out of
//     5: the injectivity property plus its two space-collision pinned rows.
//     Order-independence stays green, correctly -- that form is canonical.
//   * `[a, b].sort().join('')` -- 5 of 8 red: injectivity plus four pinned
//     rows, since a separator-free key collides far more densely.
//   * `JSON.stringify([a, b])`, the sort dropped -- 1 of 8 red, 3 runs of 3
//     here and 30 of 30 when re-measured: ONLY order-independence. That form
//     is still injective, just not canonical, which is why both properties
//     are here rather than one.
//
// NONE OF THAT REACHES THE MUTATION GATE, and the twin at the bottom of this
// file is why it is there. A `test.prop` body never executes against a
// mutant: its title carries fast-check's per-run seed and Stryker filters
// each mutant run by the dry run's test names, so the title never matches.
// Every figure above is a fact about `npm run test:scripts` alone. See
// CLAUDE.md's `@fast-check/vitest` paragraph -- and do not read a green
// mutation score as evidence about anything in this file.
//
// One negative result worth keeping, because it is the trap this file nearly
// fell into. The first draft stated injectivity over four independently drawn
// strings (`pairKey(a, b) === pairKey(c, d)` iff the sorted pairs match) over
// the wider alphabet below. It ran GREEN against the space-joined and
// separator-free forms in every run -- only the pinned rows caught them. Four
// loose draws from a roomy alphabet essentially never collide, so that form
// of the property was documentation. The set-based form below is what
// replaced it.

import { fc, test } from '@fast-check/vitest'
import { describe, expect, it } from 'vitest'
import { pairKey } from './analyze.ts'

// Two alphabets, for two different jobs.
//
// COLLIDABLE is deliberately TINY -- strings of length 0..4 over {'a', ' '},
// a universe of exactly 31 values. That is the point: injectivity is a claim
// about PAIRS of pairs, and four independently-drawn strings from a roomy
// alphabet essentially never collide, so the naive four-argument form of this
// property runs green against a broken implementation and proves nothing
// (measured -- it did exactly that on the first draft of this file). Drawing
// a set of texts from a small universe and checking every pair within it
// instead puts a large, overlapping fraction of that universe's pairs in one
// run, which is what makes a collision reachable. Brute-forcing this
// alphabet's length-0..3 slice alone yields 51 distinct colliding
// pair-of-pairs under the old space-joined key.
//
// ESCAPABLE is wider -- it adds the quote and the backslash, the two
// characters a JSON-shaped encoding has to escape. It is used only for the
// order-independence property, where no collision is needed.
//
// Do not widen COLLIDABLE to make a finding go away: widening it is exactly
// how this property stops being able to see one.
const COLLIDABLE = fc.stringMatching(/^[a ]{0,4}$/)
const ESCAPABLE = fc.stringMatching(/^[ab "\\,]{0,3}$/)

function sortedPair(a: string, b: string): string {
  // NUL cannot occur in either alphabet, so this is a faithful identity for
  // the unordered pair and is not itself a candidate key encoding.
  return [a, b].sort().join('\u0000')
}

// Degenerate inputs pinned rather than left to the generator: each is a value
// some plausible encoding mishandles, and several involve a character
// COLLIDABLE does not contain at all.
const PINNED: [string, string, string, string][] = [
  // The space-joined collision, minimized from the brute-force scan.
  ['', ' a', ' ', 'a'],
  // The same shape one character over.
  ['', 'a a', ' a', 'a'],
  // Separator-free concatenation.
  ['ab', 'c', 'a', 'bc'],
  // The quote and backslash a JSON encoding has to escape.
  ['"', 'a', '', '"a'],
  ['\\', 'a', '', '\\a'],
  // Two empty strings against one -- the self-pair shape.
  ['', '', '', ' '],
]

describe('pairKey', () => {
  // Every pair drawn from one set of distinct texts gets its own key. Stated
  // over a set rather than over four loose strings for the reachability
  // reason in the header comment.
  test.prop([fc.uniqueArray(COLLIDABLE, { minLength: 10, maxLength: 20 })])(
    'gives two different unordered pairs two different keys',
    (texts) => {
      const pairByKey = new Map<string, string>()
      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          const key = pairKey(texts[i], texts[j])
          const pair = sortedPair(texts[i], texts[j])
          const prior = pairByKey.get(key)
          if (prior !== undefined) expect(prior).toBe(pair)
          pairByKey.set(key, pair)
        }
      }
    },
  )

  test.prop([ESCAPABLE, ESCAPABLE])('does not depend on the order the caller holds the two texts in', (a, b) => {
    expect(pairKey(a, b)).toBe(pairKey(b, a))
  })

  // The deterministic twin of the property above, and the only form of that
  // claim the MUTATION GATE can see. `@fast-check/vitest` interpolates the
  // run's seed into a property's title, while Stryker's vitest runner filters
  // each mutant run with a `testNamePattern` built from the DRY RUN's test
  // names (vitest-test-runner.js's `run`) -- the seed differs between the two,
  // so a property's title never matches and the property simply does not
  // execute against any mutant. Measured on the `.sort()` mutant scoped alone:
  // Survived with the seed left free, Killed once it was pinned, same config
  // otherwise. So the property above kills that mutant in `npm run
  // test:scripts` and could not kill it in `npm run test:mutation:scripts`;
  // these fixed-input rows, whose titles are stable, are what close it.
  it.each([
    ['a', 'b'],
    ['', 'a'],
    ['a b', 'a'],
    ['"', '\\'],
    ['zz', 'aa'],
  ])('does not depend on argument order, for %j and %j', (a, b) => {
    expect(pairKey(a, b)).toBe(pairKey(b, a))
  })

  it.each(PINNED)('keeps %j/%j distinct from %j/%j', (a, b, c, d) => {
    expect(pairKey(a, b)).not.toBe(pairKey(c, d))
  })
})
