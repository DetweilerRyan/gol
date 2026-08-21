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

  it('keeps only a single separator between the keyword and the step text', () => {
    const steps = parseSteps('Feature: F\n  Scenario: S\n    Given   spaced out\n')
    expect(steps[0].text).toBe('spaced out')
  })

  it('does not treat a step keyword as a step unless it starts the line', () => {
    const steps = parseSteps('Feature: F\n  Scenario: S\n    not a step Given inline text\n')
    expect(steps).toEqual([])
  })

  // A lone `\r` and U+2028/U+2029 are line terminators the `split(/\r?\n/)`
  // above doesn't split on, and `.` refuses to cross them -- so the step regex
  // can't reach its `$` and the line is no step at all. The alternative (an
  // unanchored regex quietly recording the text up to the terminator) would be
  // worse: a silently truncated step, indistinguishable from a real one.
  it.each([
    ['a carriage return', '\r'],
    ['a line separator', '\u2028'],
    ['a paragraph separator', '\u2029'],
  ])('records no step at all for a line broken by %s', (_name, terminator) => {
    expect(parseSteps(`Feature: F\n  Scenario: S\n    Given a${terminator}b\n`)).toEqual([])
  })

  // An Examples: table swallows every following line until a declaration ends
  // it. Each keyword involved may be bare or carry a name, and the parser
  // matches on the keyword *prefix*, so both forms of each need covering: a
  // named `Examples:` went unrecognized for a while precisely because every
  // fixture here happened to use the bare form.
  const outlineWithExamples = (examplesLine: string, afterTable: string) =>
    [
      'Feature: One',
      '  Scenario Outline: Outlined',
      '    Given <a>',
      `    ${examplesLine}`,
      '      | a |',
      '      | 1 |',
      afterTable,
      '    Then a later step',
    ].join('\n')

  it.each([
    { examples: 'Examples:', after: '  Scenario: After', ends: true },
    { examples: 'Examples:', after: '  Scenario Outline: After', ends: true },
    { examples: 'Examples:', after: '  Background:', ends: true },
    { examples: 'Examples:', after: '  Background: named', ends: true },
    { examples: 'Examples:', after: 'Feature:', ends: true },
    { examples: 'Examples:', after: 'Feature: Two', ends: true },
    { examples: 'Examples:', after: '      | 2 |', ends: false },
    { examples: 'Examples: some cases', after: '  Scenario: After', ends: true },
    { examples: 'Examples: some cases', after: 'Feature: Two', ends: true },
    { examples: 'Examples: some cases', after: '      | 2 |', ends: false },
  ])('after "$examples", a "$after" line ends the table: $ends', ({ examples, after, ends }) => {
    const steps = parseSteps(outlineWithExamples(examples, after))
    expect(steps.map((s) => s.text)).toEqual(ends ? ['<a>', 'a later step'] : ['<a>'])
  })

  it('starts a fresh scenario index and step index on the Scenario that ends an Examples table', () => {
    const steps = parseSteps(outlineWithExamples('Examples:', '  Scenario: After'))
    expect(steps[1]).toMatchObject({ scenarioIndex: 1, scenarioName: 'After', stepIndex: 0 })
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
