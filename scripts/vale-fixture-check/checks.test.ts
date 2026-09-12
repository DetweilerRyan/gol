import { describe, expect, it } from 'vitest'
import {
  checkAll,
  checkAnyRulesFound,
  checkBadFixturesFire,
  checkFixturePairsExist,
  checkGoodFixturesSilent,
  checkStylesWired,
  type Failure,
} from './checks.ts'
import type { FixtureSection } from './fixtures-config.ts'
import type { RuleFile } from './rule-files.ts'

function rule(overrides: Partial<RuleFile> = {}): RuleFile {
  return {
    style: 'Procedure',
    name: 'OneInstruction',
    path: 'vale-styles/Procedure/OneInstruction.yml',
    extensions: ['md'],
    ...overrides,
  }
}

const MD_SECTION: FixtureSection[] = [{ glob: '*.md', styles: ['Procedure'] }]

describe('checkFixturePairsExist', () => {
  it('passes when both halves are present', () => {
    expect(checkFixturePairsExist([rule()], ['OneInstruction.bad.md', 'OneInstruction.good.md'])).toEqual([])
  })

  it('names the missing half, and blames the rule file rather than the absent fixture', () => {
    const failures = checkFixturePairsExist([rule()], ['OneInstruction.bad.md'])
    expect(failures).toHaveLength(1)
    expect(failures[0]?.file).toBe('vale-styles/Procedure/OneInstruction.yml')
    expect(failures[0]?.message).toContain('OneInstruction.good.md')
  })

  it('requires a pair for EVERY extension a rule claims, not just the first', () => {
    const both = rule({ style: 'JsDoc', name: 'DeadIndexical', extensions: ['ts', 'tsx'] })
    const failures = checkFixturePairsExist([both], ['DeadIndexical.bad.ts', 'DeadIndexical.good.ts'])
    expect(failures.map((failure) => failure.message)).toEqual([
      expect.stringContaining('DeadIndexical.bad.tsx'),
      expect.stringContaining('DeadIndexical.good.tsx'),
    ])
  })
})

describe('checkGoodFixturesSilent', () => {
  it('passes when nothing was reported against a good fixture', () => {
    const findings = [{ file: 'vale-styles/fixtures/OneInstruction.bad.md', rule: 'Procedure.OneInstruction' }]
    expect(checkGoodFixturesSilent(['OneInstruction.bad.md', 'OneInstruction.good.md'], findings)).toEqual([])
  })

  it('fails on any finding against a good fixture, whichever rule reported it', () => {
    const findings = [{ file: 'vale-styles/fixtures/OneInstruction.good.md', rule: 'Instruction.HistoricalNarration' }]
    const failures = checkGoodFixturesSilent(['OneInstruction.good.md'], findings)
    expect(failures).toHaveLength(1)
    expect(failures[0]?.message).toContain('Instruction.HistoricalNarration')
  })
})

describe('checkBadFixturesFire', () => {
  const names = ['OneInstruction.bad.md']

  it('passes when the bad fixture reports its own rule', () => {
    const findings = [{ file: 'vale-styles/fixtures/OneInstruction.bad.md', rule: 'Procedure.OneInstruction' }]
    expect(checkBadFixturesFire([rule()], names, findings)).toEqual([])
  })

  it('fails when the fixture reports nothing -- the inert-rule case this check exists for', () => {
    expect(checkBadFixturesFire([rule()], names, [])).toHaveLength(1)
  })

  it('fails when the fixture reports some OTHER rule, which is not evidence this one works', () => {
    const findings = [{ file: 'vale-styles/fixtures/OneInstruction.bad.md', rule: 'Instruction.ListItemSentences' }]
    expect(checkBadFixturesFire([rule()], names, findings)).toHaveLength(1)
  })

  it('does not also fail here when the fixture is absent -- that is check 1, reported once', () => {
    expect(checkBadFixturesFire([rule()], [], [])).toEqual([])
  })
})

describe('checkAnyRulesFound', () => {
  it('fails on an empty rule set, where every other check would pass vacuously', () => {
    expect(checkAnyRulesFound([])).toHaveLength(1)
  })

  it('passes once any rule was found', () => {
    expect(checkAnyRulesFound([rule()])).toEqual([])
  })
})

describe('checkStylesWired', () => {
  it('passes when the style is enabled for the extension its rules claim', () => {
    expect(checkStylesWired([rule()], MD_SECTION)).toEqual([])
  })

  it('fails when a style is wired into no section -- how Procedure would have entered untested', () => {
    const failures = checkStylesWired([rule()], [{ glob: '*.md', styles: ['Instruction'] }])
    expect(failures).toHaveLength(1)
    expect(failures[0]?.message).toContain('Procedure is not enabled for *.md')
  })

  it('fails when the style is wired for a DIFFERENT extension than its rules claim', () => {
    const jsdoc = rule({ style: 'JsDoc', name: 'DeadIndexical', extensions: ['tsx'] })
    expect(checkStylesWired([jsdoc], [{ glob: '*.ts', styles: ['JsDoc'] }])).toHaveLength(1)
  })

  it('reports a style once per extension, not once per rule', () => {
    const rules = [rule(), rule({ name: 'ProcedureLength' })]
    expect(checkStylesWired(rules, [{ glob: '*.md', styles: [] }])).toHaveLength(1)
  })
})

describe('checkAll', () => {
  it('reports nothing for a consistent fixture set', () => {
    const findings = [{ file: 'vale-styles/fixtures/OneInstruction.bad.md', rule: 'Procedure.OneInstruction' }]
    const names = ['OneInstruction.bad.md', 'OneInstruction.good.md']
    expect(checkAll([rule()], names, findings, MD_SECTION)).toEqual([])
  })

  it('reports the empty-rule-set guard first, ahead of the per-rule checks', () => {
    expect(checkAll([], [], [], MD_SECTION)[0]?.check).toBe('any-rules-found')
  })
})

// Mutation-driven cases. Each pins a way a check could be wrong while still
// passing the tests above: a quantifier flipped from "any" to "all", a dropped
// sort, or a failure record whose own check name is empty.
//
// Table-driven rather than one test per check: five near-identical bodies each
// asserting two fields is the shape dry4ts flags, and it flagged exactly this.
describe('failure records name themselves, so a report is readable and greppable', () => {
  const goodFinding = [{ file: 'vale-styles/fixtures/OneInstruction.good.md', rule: 'Procedure.OneInstruction' }]
  const cases: Array<{ name: string; failures: Failure[]; check: string; file: string }> = [
    {
      name: 'checkFixturePairsExist blames the rule file',
      failures: checkFixturePairsExist([rule()], []),
      check: 'fixture-pair-exists',
      file: 'vale-styles/Procedure/OneInstruction.yml',
    },
    {
      name: 'checkGoodFixturesSilent blames the fixture vale named',
      failures: checkGoodFixturesSilent(['OneInstruction.good.md'], goodFinding),
      check: 'good-fixture-silent',
      file: 'vale-styles/fixtures/OneInstruction.good.md',
    },
    {
      name: 'checkBadFixturesFire blames the fixture',
      failures: checkBadFixturesFire([rule()], ['OneInstruction.bad.md'], []),
      check: 'bad-fixture-fires',
      file: 'OneInstruction.bad.md',
    },
    {
      name: 'checkAnyRulesFound blames no file',
      failures: checkAnyRulesFound([]),
      check: 'any-rules-found',
      file: '(none)',
    },
    {
      name: 'checkStylesWired blames the fixture config',
      failures: checkStylesWired([rule()], []),
      check: 'style-wired-into-fixtures',
      file: 'vale-styles/fixtures/fixtures.vale.ini',
    },
  ]

  it.each(cases)('$name', ({ failures, check, file }) => {
    expect(failures[0]?.check).toBe(check)
    expect(failures[0]?.file).toBe(file)
  })
})

describe('quantifiers: one match is enough, and one miss is not a failure', () => {
  it('checkGoodFixturesSilent blames only the good fixture that reported, not every one', () => {
    const findings = [{ file: 'vale-styles/fixtures/B.good.md', rule: 'Procedure.OneInstruction' }]
    expect(checkGoodFixturesSilent(['A.good.md', 'B.good.md'], findings).map((f) => f.file)).toEqual([
      'vale-styles/fixtures/B.good.md',
    ])
  })

  it('checkStylesWired passes when ANY section wires the style, not only when all do', () => {
    const sections: FixtureSection[] = [
      { glob: '*.md', styles: [] },
      { glob: '*.md', styles: ['Procedure'] },
    ]
    expect(checkStylesWired([rule()], sections)).toEqual([])
  })

  it('checkBadFixturesFire passes on ANY matching finding, among findings for other files', () => {
    const findings = [
      { file: 'vale-styles/fixtures/Other.bad.md', rule: 'Procedure.OneInstruction' },
      { file: 'vale-styles/fixtures/OneInstruction.bad.md', rule: 'Procedure.OneInstruction' },
    ]
    expect(checkBadFixturesFire([rule()], ['OneInstruction.bad.md'], findings)).toEqual([])
  })

  it('reports unwired styles in a stable order, so two runs of one tree read the same', () => {
    const rules = [rule({ style: 'Zeta' }), rule({ style: 'Alpha' })]
    const failures = checkStylesWired(rules, [])
    expect(failures.map((failure) => failure.message.split(' ')[0])).toEqual(['Alpha', 'Zeta'])
  })
})

describe('failure messages carry what a reader needs to act', () => {
  it('checkBadFixturesFire names the rule that failed to fire', () => {
    const [failure] = checkBadFixturesFire([rule()], ['OneInstruction.bad.md'], [])
    expect(failure?.message).toContain('Procedure.OneInstruction')
  })

  it('checkAnyRulesFound explains why an empty set is itself the failure', () => {
    const [failure] = checkAnyRulesFound([])
    expect(failure?.message).toContain('vacuously')
  })
})
