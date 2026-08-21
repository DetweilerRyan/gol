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

  // The stem rule itself (last slash wins, only a trailing extension is
  // stripped) is filenames.ts's, and tested there -- this only pins down that
  // the parser puts the derived stem on the record it returns.
  it('derives filenameStem from the path, stripping the .yml extension', () => {
    const rule = parseRuleFile('rules/nested/no-dom-in-domain.yml', FULL_RULE)
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

  it('leaves id undefined when the id: value is not a string (e.g. a bare YAML number)', () => {
    const rule = parseRuleFile('rules/numeric-id.yml', 'id: 42\nseverity: warning\n')
    expect(rule.id).toBeUndefined()
  })

  it('leaves severity undefined when the severity: value is not a string (e.g. a bare YAML number)', () => {
    const rule = parseRuleFile('rules/numeric-severity.yml', 'id: x\nseverity: 42\n')
    expect(rule.severity).toBeUndefined()
  })

  it('drops non-string entries from a files: list rather than passing them through', () => {
    const rule = parseRuleFile(
      'rules/mixed-files.yml',
      "id: x\nseverity: warning\nfiles:\n  - 'src/a.ts'\n  - 42\n  - 'src/b.ts'\n",
    )
    expect(rule.files).toEqual(['src/a.ts', 'src/b.ts'])
  })

  it('parses a comment-only document without crashing, leaving every field empty', () => {
    // `yaml`'s parse() returns null (not {}) for a document with no content --
    // this pins down the `?? {}` fallback that keeps the rest of the parser
    // from throwing on `parsed.id`/`parsed.severity`/etc.
    const rule = parseRuleFile('rules/empty.yml', '# nothing here but a comment\n')
    expect(rule.id).toBeUndefined()
    expect(rule.severity).toBeUndefined()
    expect(rule.files).toBeUndefined()
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

  it('finds a marker with unusual spacing (no space after #, no space before the reason)', () => {
    const text = '#ast-grep-rule-check:allow-unresolved-files reason\nid: x\n'
    expect(extractUnresolvedFilesMarker(text)).toEqual({ present: true, reason: 'reason' })
  })

  it('does not treat marker-like text as a marker unless it starts the line -- a quoted string on an otherwise unrelated line is not a real comment', () => {
    const text = 'message: "# ast-grep-rule-check: allow-unresolved-files fake reason"\nid: x\n'
    expect(extractUnresolvedFilesMarker(text)).toEqual({ present: false, reason: null })
  })
})
