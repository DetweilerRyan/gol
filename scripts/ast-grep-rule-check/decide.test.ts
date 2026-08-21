import { describe, expect, it } from 'vitest'
import { decide, type RawFile } from './decide.ts'

describe('decide', () => {
  const GOOD_RULE = 'id: no-foo\nseverity: warning\nrule:\n  pattern: foo\n'
  const GOOD_FIXTURE = 'id: no-foo\nvalid:\n  - bar\ninvalid:\n  - foo\n'

  function ruleFile(overrides: Partial<RawFile> = {}): RawFile {
    return { path: 'rules/no-foo.yml', text: GOOD_RULE, ...overrides }
  }

  function fixtureFile(overrides: Partial<RawFile> = {}): RawFile {
    return { path: 'rule-tests/no-foo-test.yml', text: GOOD_FIXTURE, ...overrides }
  }

  it('exits 0 with a summary line for a fully well-formed rule and fixture', () => {
    const result = decide([ruleFile()], [fixtureFile()], () => true)
    expect(result.exitCode).toBe(0)
    expect(result.lines).toEqual(['ast-grep rule check -- 1 rules, 1 fixtures, no failures.'])
  })

  it('exits 1 and reports each failure on its own two lines, separated from the header by a blank line', () => {
    const result = decide([], [], () => true)
    expect(result.exitCode).toBe(1)
    expect(result.lines[0]).toContain('1 failure(s)')
    expect(result.lines[1]).toBe('')
    expect(result.lines.some((line) => line.includes('[rules-found]'))).toBe(true)
  })

  it('catches a multi-document rule file and reports a named parse failure instead of throwing', () => {
    const brokenRuleFile = ruleFile({ text: `${GOOD_RULE}---\nid: no-bar\nseverity: warning\n` })
    const result = decide([brokenRuleFile], [fixtureFile()], () => true)
    expect(result.exitCode).toBe(1)
    expect(result.lines.some((line) => line.includes('[parse] rules/no-foo.yml'))).toBe(true)
  })

  it('catches a multi-document fixture file and reports a named parse failure instead of throwing', () => {
    const brokenFixtureFile = fixtureFile({ text: `${GOOD_FIXTURE}---\nid: no-bar\n` })
    const result = decide([ruleFile()], [brokenFixtureFile], () => true)
    expect(result.exitCode).toBe(1)
    expect(result.lines.some((line) => line.includes('[parse] rule-tests/no-foo-test.yml'))).toBe(true)
  })
})
