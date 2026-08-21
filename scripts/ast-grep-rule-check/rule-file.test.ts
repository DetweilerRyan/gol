import { describe, expect, it } from 'vitest'
import { extractUnresolvedFilesMarker, parseRuleFile } from './rule-file.ts'

const FULL_RULE = `id: no-dom-in-domain
language: TypeScript
severity: warning
files:
  - 'src/*.ts'
  - 'src/other/*.ts'
ignores:
  - 'src/hooks/**'
rule:
  pattern: document.$$$REST
`

describe('parseRuleFile', () => {
  it('reads id, severity, and files off a well-formed rule', () => {
    const rule = parseRuleFile('rules/no-dom-in-domain.yml', FULL_RULE)
    expect(rule.id).toBe('no-dom-in-domain')
    expect(rule.severity).toBe('warning')
    expect(rule.files).toEqual(['src/*.ts', 'src/other/*.ts'])
  })

  it('derives filenameStem from the path, stripping the .yml extension', () => {
    const rule = parseRuleFile('rules/no-dom-in-domain.yml', FULL_RULE)
    expect(rule.filenameStem).toBe('no-dom-in-domain')
  })

  it('normalizes a single files: string into a one-element array', () => {
    const rule = parseRuleFile('rules/single-file.yml', 'id: single-file\nseverity: warning\nfiles: src/App.tsx\n')
    expect(rule.files).toEqual(['src/App.tsx'])
  })

  it('leaves files undefined when the rule has no files: key', () => {
    const rule = parseRuleFile('rules/no-files.yml', 'id: no-files\nseverity: warning\n')
    expect(rule.files).toBeUndefined()
  })

  it('leaves severity undefined when the key is typoed (e.g. `sevrity:`)', () => {
    const rule = parseRuleFile('rules/typo.yml', 'id: typo\nsevrity: warning\n')
    expect(rule.severity).toBeUndefined()
  })

  it('leaves id undefined when the rule has no id: key', () => {
    const rule = parseRuleFile('rules/no-id.yml', 'severity: warning\n')
    expect(rule.id).toBeUndefined()
  })
})

describe('extractUnresolvedFilesMarker', () => {
  it('finds no marker in a rule file that lacks the comment', () => {
    expect(extractUnresolvedFilesMarker(FULL_RULE)).toEqual({ present: false, reason: null })
  })

  it('finds a marker with its reason', () => {
    const text = '# ast-grep-rule-check: allow-unresolved-files LifeBoard.tsx does not exist yet\nid: x\n'
    expect(extractUnresolvedFilesMarker(text)).toEqual({
      present: true,
      reason: 'LifeBoard.tsx does not exist yet',
    })
  })

  it('treats a marker with no reason text as present but reason-less', () => {
    const text = '# ast-grep-rule-check: allow-unresolved-files\nid: x\n'
    expect(extractUnresolvedFilesMarker(text)).toEqual({ present: true, reason: null })
  })

  it('treats a marker with only whitespace after the keyword as reason-less', () => {
    const text = '# ast-grep-rule-check: allow-unresolved-files   \nid: x\n'
    expect(extractUnresolvedFilesMarker(text)).toEqual({ present: true, reason: null })
  })
})
