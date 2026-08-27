import { describe, expect, it } from 'vitest'
import { analyzeSteps, type CorpusStep, type DryReport, type Finding, type FindingKind } from './analyze.ts'

// Narrows a `.find()` result so the assertions below can read fields off it --
// a missing finding fails the test here rather than at a downstream property
// access, which reports the actual problem.
function requireFinding(report: DryReport, kinds: FindingKind | FindingKind[]): Finding {
  const wanted = Array.isArray(kinds) ? kinds : [kinds]
  const finding = report.findings.find((f) => wanted.includes(f.kind))
  expect(finding, `expected a ${wanted.join(' or ')} finding`).toBeDefined()
  return finding as Finding
}

// Narrows to the one finding whose members are exactly { textA, textB } --
// needed whenever a corpus incidentally produces several other findings too
// (cross-pairs sharing a token once placeholders are stripped, say), so a
// looser `findings.some(...)` check would pass whether or not the specific
// pair under test was wrongly dropped.
function requirePairFinding(report: DryReport, textA: string, textB: string): Finding {
  const finding = report.findings.find(
    (f) => f.members.length === 2 && f.members.some((m) => m.text === textA) && f.members.some((m) => m.text === textB),
  )
  expect(finding, `expected a finding whose members are exactly ${textA} and ${textB}`).toBeDefined()
  return finding as Finding
}

function step(overrides: Partial<CorpusStep>): CorpusStep {
  return {
    feature: 'a.feature',
    section: 'scenario',
    scenarioIndex: 0,
    scenarioName: 'Scene',
    stepIndex: 0,
    keyword: 'Given',
    text: 'a step',
    ...overrides,
  }
}

// The cross-scenario finding kinds all need the same minimal corpus: one step
// in each of two distinct scenarios, differing only in text. Every scenario
// below that isn't specifically about backgrounds or feature files uses it.
function reportForTwoScenarios(textA: string, textB: string): DryReport {
  return analyzeSteps([step({ text: textA, scenarioIndex: 0 }), step({ text: textB, scenarioIndex: 1 })])
}

function findingForTwoScenarios(textA: string, textB: string, kinds: FindingKind | FindingKind[]): Finding {
  return requireFinding(reportForTwoScenarios(textA, textB), kinds)
}

const PLACEHOLDER_VARIANT_A = 'the player is in room <destination_room>'
const PLACEHOLDER_VARIANT_B = 'the player is in room <expected_player_room>'

describe('analyzeSteps', () => {
  it('reports no findings for a corpus with no repetition or similarity', () => {
    const report = analyzeSteps([
      step({ text: 'a completely unique setup' }),
      step({ text: 'a totally different assertion', keyword: 'Then', stepIndex: 1 }),
    ])
    expect(report.findings).toEqual([])
    expect(report.summary).toEqual({ step_occurrences: 2, unique_steps: 2, findings: 0 })
  })

  it('flags identical step text repeated within one scenario as duplicate-in-scenario', () => {
    const report = analyzeSteps([
      step({ text: 'I toggle the cell at (2, 3)', stepIndex: 0 }),
      step({ text: 'something else', keyword: 'When', stepIndex: 1 }),
      step({ text: 'I toggle the cell at (2, 3)', keyword: 'And', stepIndex: 2 }),
    ])
    const finding = requireFinding(report, 'duplicate-in-scenario')
    expect(finding.confidence).toBe('high')
    expect(finding.members).toHaveLength(2)
  })

  it('flags identical step text reused across different scenarios as exact-duplicate, not duplicate-in-scenario', () => {
    const report = analyzeSteps([
      step({ text: 'an empty grid', scenarioIndex: 0, scenarioName: 'A' }),
      step({ text: 'an empty grid', scenarioIndex: 1, scenarioName: 'B' }),
    ])
    expect(report.findings.find((f) => f.kind === 'duplicate-in-scenario')).toBeUndefined()
    const finding = requireFinding(report, 'exact-duplicate')
    expect(finding.members).toHaveLength(2)
  })

  it('flags identical step text reused across different feature files as exact-duplicate', () => {
    const report = analyzeSteps([
      step({ text: 'an empty grid', feature: 'a.feature' }),
      step({ text: 'an empty grid', feature: 'b.feature', scenarioIndex: 5 }),
    ])
    expect(report.findings.find((f) => f.kind === 'exact-duplicate')).toBeDefined()
  })

  it('flags two step texts that are identical after placeholder-name normalization as placeholder-variant', () => {
    const finding = findingForTwoScenarios(PLACEHOLDER_VARIANT_A, PLACEHOLDER_VARIANT_B, 'placeholder-variant')
    expect(finding.pattern_candidate).toBe('the player is in room <_1>')
    expect(finding.members).toHaveLength(2)
  })

  it('does not double-report a placeholder-variant pair as a near-duplicate', () => {
    const report = reportForTwoScenarios(PLACEHOLDER_VARIANT_A, PLACEHOLDER_VARIANT_B)
    expect(report.findings.filter((f) => f.kind === 'near-duplicate')).toHaveLength(0)
  })

  it('flags highly similar wording as near-duplicate with a score at or above 0.72', () => {
    const finding = findingForTwoScenarios(
      'a horizontal blinker centered at (1, 1)',
      'a horizontal blinker centered at (<x>, <y>)',
      'near-duplicate',
    )
    expect(finding.score).toBeGreaterThanOrEqual(0.72)
    expect(finding).toMatchObject({
      confidence: 'medium',
      suggested_action:
        'Likely the same logical step with slightly different wording -- consider unifying the step definitions.',
    })
  })

  // NEAR_DUPLICATE_THRESHOLD is 0.72 and the comparison is `score >=
  // NEAR_DUPLICATE_THRESHOLD`, not `>` -- a score landing exactly on the
  // threshold must still classify as near-duplicate. Built from 18 shared and
  // 7 A-only tokens (18/25 = 0.72 exactly) rather than picked from ordinary
  // step prose, since no realistic short pair happens to land exactly there.
  it('classifies a score exactly at the near-duplicate threshold as near-duplicate, not possible-synonym', () => {
    const shared = Array.from({ length: 18 }, (_, i) => `w${i + 1}`)
    const uniqueToA = Array.from({ length: 7 }, (_, i) => `x${i + 1}`)
    const finding = findingForTwoScenarios([...shared, ...uniqueToA].join(' '), shared.join(' '), [
      'near-duplicate',
      'possible-synonym',
    ])
    expect(finding.score).toBe(0.72)
    expect(finding.kind).toBe('near-duplicate')
  })

  it('flags moderately similar wording as possible-synonym with a score between 0.45 and 0.72', () => {
    const finding = findingForTwoScenarios('the cell should be alive', 'the cell should end up alive', [
      'possible-synonym',
      'near-duplicate',
    ])
    expect(finding.score).toBeGreaterThanOrEqual(0.45)
    expect(finding.kind).toBe('possible-synonym')
    expect(finding.confidence).toBe('low')
    expect(finding.suggested_action).toBe('Possibly related steps; review for accidental wording drift.')
  })

  // POSSIBLE_SYNONYM_THRESHOLD is 0.45 and the skip guard is `score <
  // POSSIBLE_SYNONYM_THRESHOLD`, not `<=` -- a score landing exactly on the
  // threshold must still produce a finding. Same construction as the
  // near-duplicate boundary test above (9 shared, 11 A-only tokens; 9/20 =
  // 0.45 exactly), since no realistic short pair lands exactly there either.
  it('still reports a finding for a score exactly at the possible-synonym threshold', () => {
    const shared = Array.from({ length: 9 }, (_, i) => `w${i + 1}`)
    const uniqueToA = Array.from({ length: 11 }, (_, i) => `x${i + 1}`)
    const finding = findingForTwoScenarios([...shared, ...uniqueToA].join(' '), shared.join(' '), 'possible-synonym')
    expect(finding.score).toBe(0.45)
  })

  it('reports no similarity finding below the possible-synonym threshold', () => {
    const report = reportForTwoScenarios('an empty grid', 'the camera resets to the default zoom')
    expect(report.findings.filter((f) => f.kind === 'near-duplicate' || f.kind === 'possible-synonym')).toEqual([])
  })

  it('includes the feature, scenario, and keyword in every member location', () => {
    const finding = findingForTwoScenarios('x', 'x', 'exact-duplicate')
    expect(finding.members[0].location).toMatchObject({ feature: 'a.feature', section: 'scenario', keyword: 'Given' })
  })

  it('does not also report a within-scenario repeat as a cross-scenario exact-duplicate', () => {
    const report = analyzeSteps([
      step({ text: 'I toggle the cell at (2, 3)', stepIndex: 0 }),
      step({ text: 'I toggle the cell at (2, 3)', keyword: 'And', stepIndex: 1 }),
    ])
    expect(report.findings.filter((f) => f.kind === 'exact-duplicate')).toEqual([])
  })

  // The placeholder-variant pass suppresses its own pairs from the similarity
  // pass so they aren't reported twice. That suppression has to be per-pair:
  // an unrelated near-duplicate elsewhere in the corpus must still come out.
  it('suppresses only the placeholder-variant pair, not every other similar pair', () => {
    const report = analyzeSteps([
      step({ text: PLACEHOLDER_VARIANT_A, scenarioIndex: 0 }),
      step({ text: PLACEHOLDER_VARIANT_B, scenarioIndex: 1 }),
      step({ text: 'a horizontal blinker centered at (1, 1)', scenarioIndex: 2 }),
      step({ text: 'a horizontal blinker centered at (<x>, <y>)', scenarioIndex: 3 }),
    ])
    expect(report.findings.some((f) => f.kind === 'placeholder-variant')).toBe(true)
    expect(report.findings.some((f) => f.kind === 'near-duplicate')).toBe(true)
  })

  // Three ways pairKey's collision space can leak an unrelated pair past
  // dedupePairs, all sharing one shape: a placeholder-variant group registers
  // a key built from two of its own texts joined by a single space, and a
  // *different*, unrelated pair's own sorted-and-joined texts land on that
  // exact string, so dedupePairs.has() wrongly says "already explained" and
  // the unrelated pair's own finding silently vanishes.
  //
  // 'separator': without pairKey's join(' ') separator, sorted ["ab", "c"]
  // and sorted ["a", "bc"] both concatenate to "abc" -- the collision this
  // slice's join-separator regression test already covered.
  // 'diagonal': without the `a !== b` guard on the dedupe double loop, a
  // self-pair key a + ' ' + a enters the set; a doubled string with an
  // internal space admits an alternate split into two different texts.
  // 'unsorted': without pairKey's own `.sort()`, a lookup key is built from
  // corpus insertion order rather than a canonical order, so an unrelated
  // pair's *unsorted* concatenation can land on a real entry's unsorted form.
  it.each([
    {
      name: 'separator',
      corpus: ['<foo>ab', '<bar>ab', '<bar>ab<', 'foo>ab'],
      pair: ['<bar>ab<', 'foo>ab'],
    },
    {
      name: 'diagonal',
      corpus: ['w1 <p> w2', 'w1 <q> w2', 'w1 <p>', 'w2 w1 <p> w2'],
      pair: ['w1 <p>', 'w2 w1 <p> w2'],
    },
    {
      name: 'unsorted',
      corpus: ['w1 <p> w2', 'w1 <q> w2', 'w1', '<p> w2 w1 <q> w2'],
      pair: ['w1', '<p> w2 w1 <q> w2'],
    },
  ])('does not let an unrelated pair collide with a placeholder-variant dedupe key ($name)', ({ corpus, pair }) => {
    const report = analyzeSteps(corpus.map((text, scenarioIndex) => step({ text, scenarioIndex })))
    expect(report.findings.some((f) => f.kind === 'placeholder-variant')).toBe(true)
    // The pair's own finding, isolated from the other cross-pairs this
    // corpus incidentally also produces (its members all share a token once
    // placeholders are stripped, so several other pairs clear the similarity
    // threshold too) -- this is the one a colliding key would drop.
    requirePairFinding(report, pair[0], pair[1])
  })

  // The report is the product here -- a finding with blank prose or no members
  // is useless to the human reading it, whichever kind produced it.
  it('gives every finding of every kind a populated confidence, reason, action, and member list', () => {
    const report = analyzeSteps([
      step({ text: 'a repeated step', scenarioIndex: 0, stepIndex: 0 }),
      step({ text: 'a repeated step', scenarioIndex: 0, stepIndex: 1, keyword: 'And' }),
      step({ text: 'an empty grid', scenarioIndex: 1 }),
      step({ text: 'an empty grid', scenarioIndex: 2 }),
      step({ text: PLACEHOLDER_VARIANT_A, scenarioIndex: 3 }),
      step({ text: PLACEHOLDER_VARIANT_B, scenarioIndex: 4 }),
      step({ text: 'a horizontal blinker centered at (1, 1)', scenarioIndex: 5 }),
      step({ text: 'a horizontal blinker centered at (<x>, <y>)', scenarioIndex: 6 }),
      step({ text: 'the cell should be alive', scenarioIndex: 7 }),
      step({ text: 'the cell should end up alive', scenarioIndex: 8 }),
    ])

    const kinds = new Set(report.findings.map((f) => f.kind))
    expect([...kinds].sort()).toEqual([
      'duplicate-in-scenario',
      'exact-duplicate',
      'near-duplicate',
      'placeholder-variant',
      'possible-synonym',
    ])

    for (const finding of report.findings) {
      expect(finding.confidence).not.toBe('')
      expect(finding.reason).not.toBe('')
      expect(finding.suggested_action).not.toBe('')
      expect(finding.canonical_candidate).not.toBe('')
      expect(finding.members.length).toBeGreaterThanOrEqual(2)
      for (const member of finding.members) {
        expect(member.text).not.toBe('')
        expect(member.location.feature).not.toBe('')
      }
    }
  })
})
