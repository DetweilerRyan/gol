// Property test for parseLaneDeclarations' totality claim: its own JSDoc
// states "every failure ... returns `unavailable` with a reason; there is
// no partial-map outcome", over text this module never controls -- it is
// handed whatever `board-lanes.config.json` happens to contain. A throw
// here would propagate uncaught out of run.ts, and a partial map would let
// a malformed declaration silently classify some lanes and not others.
//
// The arbitrary is declaration-shaped and weighted, rather than pure
// fc.jsonValue(): a single lane's "item" is drawn mostly from wrong-typed
// candidates (array, object) alongside well-typed ones. An array or object
// reaches `.length` and `.includes` like a string would, but has no
// `.endsWith` -- the shape that once slipped past a missing
// `typeof item === 'string'` guard and threw past the validator instead of
// failing gracefully. The weighting, and keeping the lane dictionary to at
// most one entry, is deliberate: an unweighted fc.jsonValue() draw, or a
// multi-lane dictionary where an earlier malformed entry returns first,
// each independently let this property pass against that exact break by
// chance rather than by design -- see MEASURED below. A smaller, fully
// arbitrary JSON fraction keeps generic garbage input covered too.
//
// MEASURED AGAINST A DELIBERATELY BROKEN IMPLEMENTATION before being kept,
// running just this file with `npx vitest run --config
// vitest.scripts.config.ts scripts/board-shape-hook/lane-declarations.property.test.ts`.
// `isValidItemBasename`'s `typeof item === 'string' &&` guard was deleted,
// reintroducing exactly the array/object-item throw this module's own
// history fixed.
//   * FIRST ATTEMPT, unweighted (an even fc.oneof of six item shapes, up to
//     four lanes per declaration, an even split against fc.jsonValue() at
//     every level): passed clean, 7/7, several times in a row. The
//     throwing branch was reachable but rare enough, and masked often
//     enough by an earlier short-circuiting lane, that the pass was luck
//     rather than a demonstrated absence of the defect -- confirmed
//     separately by the hand-picked "item" is not a string' row on
//     lane-declarations.test.ts's own table, which does catch this break
//     every time.
//   * REWEIGHTED as below (single-lane dictionaries, array/object items at
//     3x the weight of well-typed ones): red on the totality property,
//     every run, well within the default 100 cases -- `.endsWith is not a
//     function` propagating out of parseLaneDeclarations uncaught.
// Reverted before being kept.
//
// The `.property.test.ts` suffix carries no project meaning in scripts/ --
// there is no `property` vitest project here; vitest.scripts.config.ts's
// `scripts/**/*.test.ts` include collects this file into the ordinary
// `npm run test:scripts` run, and that config's setupFiles carries the
// fast-check seed pin (see fast-check-stryker-seed.ts) so these titles are
// stable under Stryker.

import { fc, test } from '@fast-check/vitest'
import { describe, expect, it } from 'vitest'
import { parseLaneDeclarations } from './lane-declarations.ts'

const LANE_NAME = fc.oneof(fc.stringMatching(/^[a-z]{1,6}$/), fc.constant(''), fc.constant('a/b'))

// Wrong-typed "item" candidates dominate by weight -- this is what makes
// the arbitrary a reliable discriminator rather than an occasional one; see
// the module header's MEASURED note.
const ITEM_VALUE = fc.oneof(
  { arbitrary: fc.array(fc.string({ maxLength: 4 }), { maxLength: 2 }), weight: 3 },
  { arbitrary: fc.object({ maxDepth: 1 }), weight: 3 },
  { arbitrary: fc.string({ maxLength: 8 }), weight: 1 },
  { arbitrary: fc.integer(), weight: 1 },
  { arbitrary: fc.boolean(), weight: 1 },
  { arbitrary: fc.constant(null), weight: 1 },
)

const LANE_SHAPE_VALUE = fc.oneof(
  { arbitrary: fc.record({ shape: fc.constant('folder'), item: ITEM_VALUE }), weight: 3 },
  { arbitrary: fc.record({ shape: fc.constant('flat') }), weight: 1 },
  { arbitrary: fc.record({ shape: fc.string({ maxLength: 6 }) }), weight: 1 },
  { arbitrary: fc.jsonValue(), weight: 1 },
)

// At most one lane: a second, earlier-iterated entry that happens to fail
// its own check would return before buildLaneMap ever reaches the one
// entry this arbitrary is built to stress -- see the module header.
const LANES_OBJECT = fc.dictionary(LANE_NAME, LANE_SHAPE_VALUE, { maxKeys: 1 })

const DECLARATION_JSON = fc.oneof(
  { arbitrary: fc.record({ lanes: LANES_OBJECT }), weight: 3 },
  { arbitrary: fc.jsonValue(), weight: 1 },
)

const DECLARATION_TEXT = fc.oneof(
  { arbitrary: DECLARATION_JSON.map((value) => JSON.stringify(value)), weight: 3 },
  { arbitrary: fc.constant(undefined), weight: 1 },
  { arbitrary: fc.string({ maxLength: 40 }), weight: 1 },
)

describe('parseLaneDeclarations -- totality', () => {
  test.prop([DECLARATION_TEXT])('never throws, and only ever delivers declared or unavailable', (text) => {
    const result = parseLaneDeclarations(text)

    if (result.kind === 'unavailable') {
      expect(typeof result.reason).toBe('string')
      expect(result.reason.length).toBeGreaterThan(0)
      return
    }

    expect(result.kind).toBe('declared')
    for (const shape of result.lanes.values()) {
      if (shape.shape === 'flat') {
        expect(Object.keys(shape)).toEqual(['shape'])
        continue
      }
      expect(shape.item.length).toBeGreaterThan(0)
      expect(shape.item).not.toContain('/')
      expect(shape.item.endsWith('.md')).toBe(true)
    }
  })

  // Pinned rather than left to the generator, per the property-testing
  // article's rule on degenerate values: an empty string is the shortest
  // possible non-undefined `text`, and '{}' / '[]' / 'null' are the
  // smallest JSON documents at each of the three shapes the validator's
  // first three checks distinguish between.
  it.each([undefined, '', '{}', '[]', 'null', '   '])('does not throw on the degenerate input %j', (text) => {
    expect(() => parseLaneDeclarations(text)).not.toThrow()
  })
})
