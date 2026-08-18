import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { extractPlaceholderNames, parseSteps } from './step-parser.mjs'

const FEATURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../features')

const SAMPLE = `Feature: Sample
  Background:
    Given a shared setup

  Scenario: First
    Given a precondition
    When an action happens
    Then a result occurs

  Scenario Outline: Second
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 2     | four   |
`

describe('parseSteps', () => {
  it('extracts background steps with a null scenario index/name', () => {
    const steps = parseSteps(SAMPLE)
    const background = steps.filter((s) => s.section === 'background')
    expect(background).toEqual([
      {
        section: 'background',
        scenarioIndex: null,
        scenarioName: null,
        stepIndex: 0,
        keyword: 'Given',
        text: 'a shared setup',
      },
    ])
  })

  it('extracts scenario steps with correct 0-based scenario and step indexes', () => {
    const steps = parseSteps(SAMPLE)
    const first = steps.filter((s) => s.scenarioName === 'First')
    expect(first).toEqual([
      {
        section: 'scenario',
        scenarioIndex: 0,
        scenarioName: 'First',
        stepIndex: 0,
        keyword: 'Given',
        text: 'a precondition',
      },
      {
        section: 'scenario',
        scenarioIndex: 0,
        scenarioName: 'First',
        stepIndex: 1,
        keyword: 'When',
        text: 'an action happens',
      },
      {
        section: 'scenario',
        scenarioIndex: 0,
        scenarioName: 'First',
        stepIndex: 2,
        keyword: 'Then',
        text: 'a result occurs',
      },
    ])
  })

  it('increments scenario index across a Scenario Outline', () => {
    const steps = parseSteps(SAMPLE)
    const second = steps.filter((s) => s.scenarioName === 'Second')
    expect(second.every((s) => s.scenarioIndex === 1)).toBe(true)
  })

  it('ignores Examples table rows -- they are not steps', () => {
    const steps = parseSteps(SAMPLE)
    expect(steps.some((s) => s.text === '2' || s.text === 'four')).toBe(false)
    expect(steps).toHaveLength(6)
  })

  it('ignores blank lines and comments', () => {
    const withComment = SAMPLE.replace('Given a precondition', '# a comment\n\n    Given a precondition')
    expect(parseSteps(withComment)).toHaveLength(6)
  })

  it('returns an empty array for a feature with no scenarios', () => {
    expect(parseSteps('Feature: Empty\n')).toEqual([])
  })
})

describe('extractPlaceholderNames', () => {
  it('extracts every distinct placeholder name in appearance order', () => {
    expect(extractPlaceholderNames('a value of <x> and <y> and <x> again')).toEqual(['x', 'y', 'x'])
  })

  it('returns an empty array for text with no placeholders', () => {
    expect(extractPlaceholderNames('a plain step')).toEqual([])
  })
})

describe('against the real feature files', () => {
  it('parses every scenario and outline without throwing', () => {
    for (const file of ['cell-life-and-death.feature', 'infinite-grid.feature', 'camera-pan-and-zoom.feature']) {
      const text = readFileSync(`${FEATURES_DIR}/${file}`, 'utf8')
      const steps = parseSteps(text)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps.every((s) => s.keyword && s.text)).toBe(true)
    }
  })
})
