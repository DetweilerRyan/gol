import { describe, expect, it } from 'vitest'
import { decide, type Input } from './decide.ts'

const FIXTURE_CONFIG = '[*.md]\nBasedOnStyles = Procedure\n'

function input(overrides: Partial<Input> = {}): Input {
  return {
    rawRules: [{ style: 'Procedure', path: 'vale-styles/Procedure/OneInstruction.yml', text: 'scope: raw\n' }],
    fixtureNames: ['OneInstruction.bad.md', 'OneInstruction.good.md'],
    fixtureConfig: FIXTURE_CONFIG,
    valeOutput: 'vale-styles/fixtures/OneInstruction.bad.md:1:14:Procedure.OneInstruction:chained\n',
    ...overrides,
  }
}

describe('decide', () => {
  it('exits 0 and counts what it checked when everything holds', () => {
    const { exitCode, lines } = decide(input())
    expect(exitCode).toBe(0)
    expect(lines).toEqual(['vale-fixture-check -- 1 style(s), 1 rule(s), 2 fixture(s), no failures.'])
  })

  it('exits 1 and names each failure', () => {
    const { exitCode, lines } = decide(input({ valeOutput: '' }))
    expect(exitCode).toBe(1)
    expect(lines[0]).toBe('vale-fixture-check -- 1 failure(s):')
    expect(lines[1]).toContain('bad-fixture-fires')
  })

  it('treats a vale run that could not happen as a failure, never as a clean set', () => {
    const { exitCode, lines } = decide(input({ valeFailure: 'vale is not on PATH' }))
    expect(exitCode).toBe(1)
    expect(lines[0]).toContain('could not lint the fixtures: vale is not on PATH')
  })

  it('short-circuits the checks on that failure, so no second explanation is printed', () => {
    const broken = input({ valeFailure: 'config would not load', valeOutput: '', fixtureNames: [] })
    expect(decide(broken).lines).toHaveLength(1)
  })

  it('derives a rule name and its extensions from the raw rule, not from the fixture names', () => {
    const jsdoc: Input = input({
      rawRules: [
        {
          style: 'JsDoc',
          path: 'vale-styles/JsDoc/DeadIndexical.yml',
          text: 'scope:\n  - text.comment.block.ts\n',
        },
      ],
      fixtureNames: ['DeadIndexical.bad.ts', 'DeadIndexical.good.ts'],
      fixtureConfig: '[*.ts]\nBasedOnStyles = JsDoc\n',
      valeOutput: 'vale-styles/fixtures/DeadIndexical.bad.ts:3:13:JsDoc.DeadIndexical:m\n',
    })
    expect(decide(jsdoc).exitCode).toBe(0)
  })
})

describe('decide counts what it actually checked', () => {
  it('counts distinct styles rather than rules', () => {
    const two = input({
      rawRules: [
        { style: 'Procedure', path: 'vale-styles/Procedure/OneInstruction.yml', text: 'scope: raw\n' },
        { style: 'Instruction', path: 'vale-styles/Instruction/OneInstruction.yml', text: 'scope: raw\n' },
      ],
      fixtureConfig: '[*.md]\nBasedOnStyles = Procedure, Instruction\n',
      valeOutput: [
        'vale-styles/fixtures/OneInstruction.bad.md:1:1:Procedure.OneInstruction:m',
        'vale-styles/fixtures/OneInstruction.bad.md:1:1:Instruction.OneInstruction:m',
      ].join('\n'),
    })
    expect(decide(two).lines[0]).toContain('2 style(s), 2 rule(s)')
  })
})
