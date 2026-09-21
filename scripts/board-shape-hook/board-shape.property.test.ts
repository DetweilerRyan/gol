// Property test for the design's row-3 outcome: the fail-open direction this
// slice exists to close. Before this slice, a two-segment path under any
// undeclared directory classified as a full candidate and delivered an
// envelope -- see design.md's decision table, row 3, "was full candidate +
// envelope". checkShape's own header states the intended shape (an
// undeclared lane draws its own outcome rather than folding into
// "not a candidate"), but nothing before this test pinned it as a law over
// the whole space of undeclared first segments, only over the handful of
// hand-picked examples in board-shape.test.ts.
//
// The arbitrary holds the declared lane set fixed at the tracked config's
// three lanes (ideas/ready/done) and draws the candidate's own first segment
// from names disjoint from that set, so "not a declared lane" is true by
// construction rather than filtered after the fact. Trailing segment count
// and the leading /repo/ prefix vary, to cover both accepted path forms and
// both the not-a-candidate (one segment) and shape-mismatch-shaped counts.
//
// MEASURED AGAINST A DELIBERATELY BROKEN IMPLEMENTATION before being kept,
// running just this file with `npx vitest run --config
// vitest.scripts.config.ts scripts/board-shape-hook/board-shape.property.test.ts`.
// classifyShape's `if (lane === undefined) return { kind: 'undeclared-lane' }`
// guard was replaced with `const lane = lanes.get(segments[0]) ?? { shape:
// 'flat' }`, reinstating exactly the pre-slice fall-through behavior the
// design's row 3 names. Red on the first run, every run, well within the
// default 100 cases: a delivered envelope and a tally line where the
// property expects neither. Reverted before being kept.
import { fc, test } from '@fast-check/vitest'
import { describe, expect, it } from 'vitest'
import { checkShape, type RecordLookup } from './board-shape.ts'
import { type LaneDeclarations } from './lane-declarations.ts'

const DECLARED_LANES: LaneDeclarations = new Map([
  ['ideas', { shape: 'flat' }],
  ['ready', { shape: 'folder', item: 'proposal.md' }],
  ['done', { shape: 'folder', item: 'proposal.md' }],
])
const DECLARED_LANE_NAMES = new Set(DECLARED_LANES.keys())

const NO_RECORD: RecordLookup = { kind: 'absent' }

const UNDECLARED_LANE = fc.stringMatching(/^[a-z]{1,8}$/).filter((name) => !DECLARED_LANE_NAMES.has(name))

const PATH_SEGMENT = fc.stringMatching(/^[a-zA-Z0-9_.-]{1,10}$/)

// Zero to three trailing segments after the lane -- zero reaches the
// not-a-candidate (one segment total) branch, more reach the various
// shape-mismatch-shaped counts. The property holds regardless of the count.
const TRAILING_SEGMENTS = fc.array(PATH_SEGMENT, { minLength: 0, maxLength: 3 })

const TARGET = fc
  .tuple(fc.boolean(), UNDECLARED_LANE, TRAILING_SEGMENTS)
  .map(([absolute, lane, rest]) => `${absolute ? '/repo/' : ''}backlog/${[lane, ...rest].join('/')}`)

const ARBITRARY_TEXT = fc.string({ maxLength: 60 })

describe('checkShape -- undeclared-lane totality', () => {
  test.prop([TARGET, ARBITRARY_TEXT])(
    'never delivers and never emits the candidate tally line for an undeclared first segment',
    (target, text) => {
      const outcome = checkShape(target, text, NO_RECORD, DECLARED_LANES)
      expect(outcome.deliver).toBe(false)
      expect(outcome.lines.some((line) => /\d+ checks, \d+ findings/.test(line))).toBe(false)
    },
  )

  // Pinned rather than left to the generator, per the property-testing
  // article's rule on degenerate values: the shortest possible undeclared
  // path (a single segment, the ruled root-silence case) and the shapes the
  // trailing-segment count boundaries fall on.
  it.each(['backlog/unknown', 'backlog/unknown/foo.md', 'backlog/unknown/foo/bar.md', '/repo/backlog/unknown/foo.md'])(
    'does not deliver for the pinned undeclared-lane path %s',
    (target) => {
      const outcome = checkShape(target, 'irrelevant', NO_RECORD, DECLARED_LANES)
      expect(outcome.deliver).toBe(false)
    },
  )
})
