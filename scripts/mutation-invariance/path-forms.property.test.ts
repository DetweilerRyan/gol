// Property tests for path-forms.ts, the only interpreter of a path form in
// this program. Its module comment states the rule as a universal -- "a
// string this program has never seen returns false rather than true" -- and
// path-forms.test.ts checks that universal against fourteen hand-picked
// rows. Fourteen witnesses cannot state a universal; these properties can.
//
// Which defect each property is aimed at, since a fail-OPEN bug here is the
// one that defeats the gate silently. `matchesChangedPath` is what
// diff-verdict.ts asks about every changed path, so a form that wrongly
// answers `true` there marks a diff invariant and skips stage 5. `covers`
// answering wrongly `true` in either of the other two lets an allowlist
// entry claim a securing mechanism it does not have.
//
// THE ALPHABET IS SHAPED BY CONSTRUCTION, NEVER BY A FILTER. Every candidate
// below is assembled so that it provably cannot be one of the recognised
// forms: SEGMENT contains no `/`, no `*` and no `!`, which are the only three
// characters any recognised form is built from. Filtering a failing draw out
// of a generator would leave the defect in the module and remove the only
// thing that could find it -- so if a property here goes red, fix
// path-forms.ts or pin the row, and do not narrow these arbitraries.
//
// The `.property.test.ts` suffix carries no project meaning in scripts/ --
// there is no `property` vitest project here; vitest.scripts.config.ts's
// `scripts/**/*.test.ts` include collects this file into the ordinary
// `npm run test:scripts` run, and that config's setupFiles carries the
// fast-check seed pin (see fast-check-stryker-seed.ts) so these titles are
// stable under Stryker.
//
// MEASURED AGAINST DELIBERATELY BROKEN IMPLEMENTATIONS before being kept,
// running just this file with `npx vitest run --config
// vitest.scripts.config.ts scripts/mutation-invariance/path-forms.property.test.ts`.
// Counts are of this file's own tests at the time of measurement -- six
// properties plus a six-row pinned table, twelve in all -- and each break
// was applied alone and reverted before the next:
//   * `matchesChangedPath`'s `changedPath.startsWith(`${dir}/`)` reduced to
//     `changedPath.startsWith(dir)` -- the classic fail-open prefix bug, and
//     the one that would mark a real diff invariant and skip stage 5. 3 red:
//     the sibling-prefix property and two empty-directory rows.
//     path-forms.test.ts catches this one too, but only because someone
//     thought to write the `features-x/foo` row down.
//   * `vitestExcludeCovers`'s three equality tests reduced to
//     `excludeGlob.startsWith(dir)`. 1 red, on the non-covering property.
//   * `strykerIgnoreCovers`'s `rest === dir` widened to
//     `rest.startsWith(dir)`. 1 red, on the same property.
//   * each of the three returning a constant `false` in turn -- the shape
//     that makes every fail-safe property above pass vacuously. 1 red each,
//     and every one of them landed on a positive-direction property, which
//     is the whole reason those three are in this file.

import { fc, test } from '@fast-check/vitest'
import { describe, expect, it } from 'vitest'
import { directoryOf, matchesChangedPath, strykerIgnoreCovers, vitestExcludeCovers } from './path-forms.ts'

// One path segment. The alphabet is exactly the one
// schemas/mutation-invariance.schema.json's `path` pattern admits, minus the
// `/` separator -- so it contains none of `/`, `*` or `!`, the three
// characters every recognised form is decorated with. That exclusion is what
// makes each candidate below non-covering by construction rather than by a
// filter over draws.
const SEGMENT = fc.stringMatching(/^[A-Za-z0-9._-]{1,8}$/)

// A directory in the form an allow[]/absent[] entry actually carries: one to
// three segments joined by `/`, never with a trailing slash and never
// containing a `*`.
const DIR = fc.array(SEGMENT, { minLength: 1, maxLength: 3 }).map((segments) => segments.join('/'))

// Five ways to build a string that is outside BOTH recognised sets at once.
// Each is stated with the argument for why, because "outside the set" is the
// claim the whole property rests on:
//   - `${dir}${noise}`  longer than dir, and the character at dir.length is
//     in SEGMENT's alphabet, so it is neither `/` nor `*`. This is the
//     sibling-prefix shape (`features-x` against `features`).
//   - `${dir}/${noise}` contains no `*`, so it is none of the three vitest
//     forms; and it ends in a SEGMENT character, so strykerIgnoreCovers
//     strips no trailing `/**` or `/` and compares `dir/noise` against dir.
//   - `${noise}/${dir}` starts with a SEGMENT character, so no leading `!`
//     or `/` is stripped, and it is strictly longer than dir.
//   - `${dir}/*` and `${dir}/**/**` are the near-misses a real glob engine
//     would treat as covering dir. path-forms.ts deliberately does not, and
//     that is the fail-safe direction rather than a bug.
const NON_COVERING = fc.oneof(
  fc.tuple(DIR, SEGMENT).map(([dir, noise]) => ({ dir, candidate: `${dir}${noise}` })),
  fc.tuple(DIR, SEGMENT).map(([dir, noise]) => ({ dir, candidate: `${dir}/${noise}` })),
  fc.tuple(DIR, SEGMENT).map(([dir, noise]) => ({ dir, candidate: `${noise}/${dir}` })),
  DIR.map((dir) => ({ dir, candidate: `${dir}/*` })),
  DIR.map((dir) => ({ dir, candidate: `${dir}/**/**` })),
)

describe('path-forms -- the fail-safe direction', () => {
  test.prop([NON_COVERING])(
    'a string outside the recognised forms covers nothing, in either Covers function',
    ({ dir, candidate }) => {
      expect(vitestExcludeCovers(candidate, dir)).toBe(false)
      expect(strykerIgnoreCovers(candidate, dir).covers).toBe(false)
    },
  )

  test.prop([DIR, SEGMENT])(
    'a sibling sharing a directory prefix never matches a dir/** entry (the fail-open prefix bug)',
    (dir, noise) => {
      expect(matchesChangedPath(`${dir}/**`, `${dir}${noise}`)).toBe(false)
    },
  )

  test.prop([DIR, SEGMENT])('a bare-file entry matches nothing but itself', (file, noise) => {
    expect(matchesChangedPath(file, `${file}${noise}`)).toBe(false)
    expect(matchesChangedPath(file, `${noise}/${file}`)).toBe(false)
    expect(matchesChangedPath(file, file)).toBe(true)
  })
})

// The positive direction is not decoration. Every property above is
// satisfied by a `return false` stub, so without these three a broken
// implementation of all three functions would pass this file.
describe('path-forms -- the recognised forms are recognised', () => {
  test.prop([DIR])('vitestExcludeCovers accepts exactly the three literal forms', (dir) => {
    expect(vitestExcludeCovers(dir, dir)).toBe(true)
    expect(vitestExcludeCovers(`${dir}/**`, dir)).toBe(true)
    expect(vitestExcludeCovers(`${dir}/**/*`, dir)).toBe(true)
  })

  test.prop([DIR])('strykerIgnoreCovers strips !, leading / and one trailing /** or /', (dir) => {
    const decorations: [string, boolean][] = [
      [dir, false],
      [`/${dir}`, false],
      [`${dir}/`, false],
      [`${dir}/**`, false],
      [`/${dir}/**`, false],
      [`!${dir}`, true],
      [`!/${dir}`, true],
      [`!${dir}/**`, true],
    ]
    for (const [pattern, negated] of decorations) {
      expect(strykerIgnoreCovers(pattern, dir)).toEqual({ covers: true, negated })
    }
  })

  test.prop([DIR, SEGMENT])('a path strictly inside a dir/** entry matches it', (dir, noise) => {
    expect(matchesChangedPath(`${dir}/**`, `${dir}/${noise}`)).toBe(true)
    expect(matchesChangedPath(`${dir}/**`, `${dir}/${noise}/${noise}`)).toBe(true)
  })
})

// Degenerate values pinned deterministically rather than left to the
// generator, because DIR cannot draw either of them: its segments are
// non-empty by construction, so the empty directory is out of reach, and its
// alphabet excludes `*`, so a `**` entry path is too. Both are rejected by
// schemas/mutation-invariance.schema.json's `path` pattern, so no config can
// carry one -- they are pinned because they are where a prefix check
// degenerates into matching everything, which is the fail-open direction.
//
// An it.each table rather than one it() block per row: dry4ts:scripts scores
// the two files in this pair together, and a describe-plus-three-expects
// block here is structurally identical to path-forms.test.ts's own.
describe('path-forms -- degenerate values DIR cannot draw', () => {
  it.each([
    ['the empty string is the directory directoryOf recovers from "/**"', () => directoryOf('/**'), ''],
    ['an empty-directory entry matches no changed path', () => matchesChangedPath('/**', 'src/camera.ts'), false],
    ['nor does it match the empty changed path', () => matchesChangedPath('/**', ''), false],
    ['a bare "**" is not the dir/** form at all', () => directoryOf('**'), undefined],
    ['so it matches by equality only, like any bare file', () => matchesChangedPath('**', 'src/camera.ts'), false],
    ['and an empty exclude glob covers only the empty directory', () => vitestExcludeCovers('', 'src'), false],
  ] as const)('%s', (_label, compute, expected) => {
    expect(compute()).toEqual(expected)
  })
})
