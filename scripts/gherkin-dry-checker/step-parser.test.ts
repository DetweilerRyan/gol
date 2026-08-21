import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { extractPlaceholderNames, parseSteps } from './step-parser.ts'

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

  it('keeps a step whose own text ends in a # -- only a leading # marks a comment', () => {
    const steps = parseSteps('Feature: F\n  Scenario: S\n    Given a step about C#\n')
    expect(steps.map((s) => s.text)).toEqual(['a step about C#'])
  })

  it('recognizes a named Background:, not just a bare one', () => {
    const steps = parseSteps('Feature: F\n  Background: shared setup\n    Given a shared thing\n')
    expect(steps).toHaveLength(1)
    expect(steps[0].section).toBe('background')
  })

  it('treats a step that merely mentions "Scenario:" as a step, not a new scenario', () => {
    const steps = parseSteps('Feature: F\n  Scenario: Real\n    Given a step naming Scenario: inline\n')
    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({ scenarioName: 'Real', text: 'a step naming Scenario: inline' })
  })

  it('trims all the whitespace after Scenario:, not just one space', () => {
    const steps = parseSteps('Feature: F\n  Scenario:    Padded\n    Given a step\n')
    expect(steps[0].scenarioName).toBe('Padded')
  })

  it('drops a step written before any Background or Scenario declaration', () => {
    expect(parseSteps('Feature: F\n  Given an orphan step\n')).toEqual([])
  })

  it('resumes recording steps once a new Scenario ends an Examples table', () => {
    const steps = parseSteps(
      'Feature: F\n' +
        '  Scenario Outline: Outlined\n' +
        '    Given <a>\n' +
        '    Examples:\n' +
        '      | a |\n' +
        '      | 1 |\n' +
        '  Scenario: After the table\n' +
        '    Then a later step\n',
    )
    expect(steps.map((s) => s.text)).toEqual(['<a>', 'a later step'])
    expect(steps[1]).toMatchObject({ scenarioIndex: 1, stepIndex: 0 })
  })

  it('keeps ignoring steps that follow an Examples table inside the same scenario', () => {
    const steps = parseSteps(
      'Feature: F\n  Scenario Outline: Outlined\n    Given <a>\n    Examples:\n      | a |\n      | 1 |\n    Then a trailing step\n',
    )
    expect(steps.map((s) => s.text)).toEqual(['<a>'])
  })

  it('lets a following Feature: line end an Examples table', () => {
    const steps = parseSteps(
      'Feature: One\n' +
        '  Scenario Outline: Outlined\n' +
        '    Given <a>\n' +
        '    Examples:\n' +
        '      | a |\n' +
        '      | 1 |\n' +
        'Feature: Two\n' +
        '  Scenario: Fresh\n' +
        '    Then a step in the second feature\n',
    )
    expect(steps.map((s) => s.text)).toEqual(['<a>', 'a step in the second feature'])
  })

  it('keeps only a single separator between the keyword and the step text', () => {
    const steps = parseSteps('Feature: F\n  Scenario: S\n    Given   spaced out\n')
    expect(steps[0].text).toBe('spaced out')
  })

  it('recognizes a named Examples:, not just a bare one, so a following step in the same scenario is still ignored', () => {
    const steps = parseSteps(
      'Feature: F\n' +
        '  Scenario Outline: Outlined\n' +
        '    Given <a>\n' +
        '    Examples: some cases\n' +
        '      | a |\n' +
        '      | 1 |\n' +
        '    Then a trailing step\n',
    )
    expect(steps.map((s) => s.text)).toEqual(['<a>'])
  })

  it('lets a Feature: line end an Examples table even without a following Scenario/Background', () => {
    const steps = parseSteps(
      'Feature: One\n' +
        '  Scenario Outline: Outlined\n' +
        '    Given <a>\n' +
        '    Examples:\n' +
        '      | a |\n' +
        '      | 1 |\n' +
        'Feature: Two\n' +
        '    Then a step without a new scenario\n',
    )
    expect(steps.map((s) => s.text)).toEqual(['<a>', 'a step without a new scenario'])
  })

  it('does not treat a step keyword as a step unless it starts the line', () => {
    const steps = parseSteps('Feature: F\n  Scenario: S\n    not a step Given inline text\n')
    expect(steps).toEqual([])
  })
})

describe('extractPlaceholderNames', () => {
  it('extracts every distinct placeholder name in appearance order', () => {
    expect(extractPlaceholderNames('a value of <x> and <y> and <x> again')).toEqual(['x', 'y', 'x'])
  })

  it('returns an empty array for text with no placeholders', () => {
    expect(extractPlaceholderNames('a plain step')).toEqual([])
  })

  it('captures the whole placeholder name, not just its first character', () => {
    expect(extractPlaceholderNames('a value of <row_index> and <col2>')).toEqual(['row_index', 'col2'])
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
