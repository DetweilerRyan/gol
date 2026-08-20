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
    expect(finding.confidence).toBe('medium')
  })

  it('flags moderately similar wording as possible-synonym with a score between 0.45 and 0.72', () => {
    const finding = findingForTwoScenarios('the cell should be alive', 'the cell should end up alive', [
      'possible-synonym',
      'near-duplicate',
    ])
    expect(finding.score).toBeGreaterThanOrEqual(0.45)
    expect(finding.kind).toBe('possible-synonym')
    expect(finding.confidence).toBe('low')
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
