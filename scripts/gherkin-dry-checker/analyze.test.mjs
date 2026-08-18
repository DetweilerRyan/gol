import { describe, expect, it } from 'vitest'
import { analyzeSteps } from './analyze.mjs'

function step(overrides) {
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
    const finding = report.findings.find((f) => f.kind === 'duplicate-in-scenario')
    expect(finding).toBeDefined()
    expect(finding.confidence).toBe('high')
    expect(finding.members).toHaveLength(2)
  })

  it('flags identical step text reused across different scenarios as exact-duplicate, not duplicate-in-scenario', () => {
    const report = analyzeSteps([
      step({ text: 'an empty grid', scenarioIndex: 0, scenarioName: 'A' }),
      step({ text: 'an empty grid', scenarioIndex: 1, scenarioName: 'B' }),
    ])
    expect(report.findings.find((f) => f.kind === 'duplicate-in-scenario')).toBeUndefined()
    const finding = report.findings.find((f) => f.kind === 'exact-duplicate')
    expect(finding).toBeDefined()
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
    const report = analyzeSteps([
      step({ text: 'the player is in room <destination_room>', scenarioIndex: 0 }),
      step({ text: 'the player is in room <expected_player_room>', scenarioIndex: 1 }),
    ])
    const finding = report.findings.find((f) => f.kind === 'placeholder-variant')
    expect(finding).toBeDefined()
    expect(finding.pattern_candidate).toBe('the player is in room <_1>')
    expect(finding.members).toHaveLength(2)
  })

  it('does not double-report a placeholder-variant pair as a near-duplicate', () => {
    const report = analyzeSteps([
      step({ text: 'the player is in room <destination_room>', scenarioIndex: 0 }),
      step({ text: 'the player is in room <expected_player_room>', scenarioIndex: 1 }),
    ])
    expect(report.findings.filter((f) => f.kind === 'near-duplicate')).toHaveLength(0)
  })

  it('flags highly similar wording as near-duplicate with a score at or above 0.72', () => {
    const report = analyzeSteps([
      step({ text: 'a horizontal blinker centered at (1, 1)', scenarioIndex: 0 }),
      step({ text: 'a horizontal blinker centered at (<x>, <y>)', scenarioIndex: 1 }),
    ])
    const finding = report.findings.find((f) => f.kind === 'near-duplicate')
    expect(finding).toBeDefined()
    expect(finding.score).toBeGreaterThanOrEqual(0.72)
    expect(finding.confidence).toBe('medium')
  })

  it('flags moderately similar wording as possible-synonym with a score between 0.45 and 0.72', () => {
    const report = analyzeSteps([
      step({ text: 'the cell should be alive', scenarioIndex: 0 }),
      step({ text: 'the cell should end up alive', scenarioIndex: 1 }),
    ])
    const finding = report.findings.find((f) => f.kind === 'possible-synonym' || f.kind === 'near-duplicate')
    expect(finding).toBeDefined()
    expect(finding.score).toBeGreaterThanOrEqual(0.45)
  })

  it('reports no similarity finding below the possible-synonym threshold', () => {
    const report = analyzeSteps([
      step({ text: 'an empty grid', scenarioIndex: 0 }),
      step({ text: 'the camera resets to the default zoom', scenarioIndex: 1 }),
    ])
    expect(report.findings.filter((f) => f.kind === 'near-duplicate' || f.kind === 'possible-synonym')).toEqual([])
  })

  it('includes the feature, scenario, and keyword in every member location', () => {
    const report = analyzeSteps([step({ text: 'x', scenarioIndex: 0 }), step({ text: 'x', scenarioIndex: 1 })])
    const finding = report.findings.find((f) => f.kind === 'exact-duplicate')
    expect(finding.members[0].location).toMatchObject({ feature: 'a.feature', section: 'scenario', keyword: 'Given' })
  })
})
