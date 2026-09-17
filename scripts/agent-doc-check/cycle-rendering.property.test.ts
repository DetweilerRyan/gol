// Property test for the round trip check4 depends on: renderCycle produces
// exactly the string findCycleMentions is built to recognise as one cycle
// mention. checks.test.ts's checkCycleStringConsistent tests pin a handful
// of hand-picked rosters; this property states the general claim renderCycle
// and findCycleMentions must jointly satisfy for check4's "declares a cycle,
// finds it byte-identical" guard 4/5 pair to mean anything at all.
//
// Which defect this targets: a renderer using the wrong glyph or spacing
// (e.g. ' -> ' instead of ' → ') would make every declared cycle
// permanently inert (guard 4 fires on every real doc mention, config or no
// config) without a single unit test necessarily catching it, since the
// hand-picked fixtures across this program all happen to hardcode the
// correct glyph on both sides of the comparison. Verified failing against
// exactly that renderer before being kept -- see the note below.
//
// MEASURED: this property was run once against a deliberately wrong
// renderer, `(roles) => roles.join(' -> ')`, substituted in place of the
// real `renderCycle` import. It failed immediately (toHaveLength(1) saw 0
// mentions, since cycle-string.ts's pattern requires the '→' glyph) on the
// very first generated case. Reverted before being kept.
//
// The `.property.test.ts` suffix carries no project meaning in scripts/ --
// there is no `property` vitest project here; vitest.scripts.config.ts's
// `scripts/**/*.test.ts` include collects this file into the ordinary
// `npm run test:scripts` run, and that config's setupFiles carries the
// fast-check seed pin (see fast-check-stryker-seed.ts) so these titles are
// stable under Stryker.

import { fc, test } from '@fast-check/vitest'
import { describe, expect, it } from 'vitest'
import { renderCycle } from './cycle-config.ts'
import { findCycleMentions } from './cycle-string.ts'

// A slug-shaped role name: lowercase letters only, 3-8 characters. Plain
// letters are enough to reach this property's target failure mode (a wrong
// join glyph); escapeRegExp's own handling of a special character is
// already pinned by cycle-string.test.ts's "escapes a role name" case.
const ROLE_NAME = fc.stringMatching(/^[a-z]{3,8}$/)

// A roster of 3-6 distinct role names with no prefix pairs -- no name is a
// prefix of another. cycle-string.ts's \b-based matching happens to handle a
// prefix pair correctly (see the pinned unit test below), but that is not
// this property's claim: excluding prefix pairs by precondition keeps this
// property about the general case only.
const ROSTER = fc
  .uniqueArray(ROLE_NAME, { minLength: 3, maxLength: 6 })
  .filter((roster) => roster.every((name) => roster.every((other) => other === name || !other.startsWith(name))))

describe('renderCycle + findCycleMentions -- the round trip check4 depends on', () => {
  test.prop([ROSTER])('a rendered cycle yields exactly one mention, byte-equal to the rendering', (roster) => {
    const knownRoles = new Set(roster)
    const rendering = renderCycle(roster)
    const mentions = findCycleMentions(rendering, knownRoles)
    expect(mentions).toHaveLength(1)
    expect(mentions[0].text).toBe(rendering)
  })

  // Documents, not contracts: this pins today's observed behavior for one
  // prefix pair (coder/coder2), in both Set-insertion orders, since JS Set
  // iteration order is insertion order and the regex alternation
  // findCycleMentions builds from it could plausibly have gone the other
  // way. It is not a claim that every prefix pair behaves this well, which
  // is exactly why the property above excludes prefix pairs by precondition
  // rather than relying on this case generalizing.
  it('happens to match correctly even with a prefix pair (coder/coder2)', () => {
    const rendering = renderCycle(['coder', 'coder2', 'cleaner'])
    expect(findCycleMentions(rendering, new Set(['coder', 'coder2', 'cleaner']))).toEqual([
      { text: rendering, line: 1 },
    ])
    expect(findCycleMentions(rendering, new Set(['coder2', 'coder', 'cleaner']))).toEqual([
      { text: rendering, line: 1 },
    ])
  })
})
