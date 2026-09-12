import { describe, expect, it } from 'vitest'
import { claimedExtensions, toRuleFile } from './rule-files.ts'

describe('claimedExtensions', () => {
  it('reads both syntax scopes a JsDoc rule names, in file order', () => {
    const text = 'scope:\n  - text.comment.block.ts\n  - text.comment.block.tsx\ntokens:\n'
    expect(claimedExtensions(text)).toEqual(['ts', 'tsx'])
  })

  it('reads one when a rule claims only one -- the per-rule ruling prose.md requires', () => {
    expect(claimedExtensions('scope:\n  - text.comment.block.tsx\n')).toEqual(['tsx'])
  })

  it('does not repeat an extension a rule names twice', () => {
    const text = 'scope:\n  - text.comment.block.ts\n  - text.comment.line.ts\n'
    expect(claimedExtensions(text)).toEqual(['ts'])
  })

  it('falls back to md for a markup scope, which carries no extension', () => {
    for (const scope of ['raw', 'list', 'paragraph', 'sentence']) {
      expect(claimedExtensions(`scope: ${scope}\n`)).toEqual(['md'])
    }
  })

  it('falls back to md for a rule with no scope at all', () => {
    expect(claimedExtensions('extends: existence\ntokens:\n  - foo\n')).toEqual(['md'])
  })
})

describe('toRuleFile', () => {
  it('takes the rule name from the filename, not from the file body', () => {
    const rule = toRuleFile('Procedure', 'vale-styles/Procedure/OneInstruction.yml', 'scope: raw\n')
    expect(rule).toEqual({
      style: 'Procedure',
      name: 'OneInstruction',
      path: 'vale-styles/Procedure/OneInstruction.yml',
      extensions: ['md'],
    })
  })

  it('accepts the .yaml spelling as well as .yml', () => {
    expect(toRuleFile('JsDoc', 'vale-styles/JsDoc/Thing.yaml', 'scope: raw').name).toBe('Thing')
  })
})

describe('toRuleFile strips only the trailing extension', () => {
  it('leaves an inner .yaml alone and strips the final .yml', () => {
    expect(toRuleFile('JsDoc', 'vale-styles/JsDoc/My.yaml.yml', 'scope: raw').name).toBe('My.yaml')
  })
})
