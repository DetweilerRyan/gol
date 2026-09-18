import { describe, expect, it } from 'vitest'
import { envelope, extractFilePath } from './post-tool-use.ts'

describe('extractFilePath', () => {
  // Tuple form, deliberately not the object-table shape audit.test.ts's
  // inScope table uses: the two were byte-identical at score 1.00 once both
  // were table-driven, and dry4ts caught it.
  it.each([
    [
      'reads tool_input.file_path out of a well-formed payload',
      '{"tool_input":{"file_path":"backlog/ideas/foo.md"}}',
      'backlog/ideas/foo.md',
    ],
    ['returns empty on malformed JSON rather than throwing', 'not json', ''],
    ['returns empty when tool_input is absent', '{}', ''],
    ['returns empty when file_path is absent', '{"tool_input":{}}', ''],
    ['returns empty when file_path is not a string', '{"tool_input":{"file_path":42}}', ''],
  ])('%s', (_name, stdinText, expected) => {
    expect(extractFilePath(stdinText)).toBe(expected)
  })
})

describe('envelope', () => {
  it('joins lines with newlines inside the hookSpecificOutput additionalContext', () => {
    expect(envelope(['one', 'two'])).toBe(
      JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: 'one\ntwo' } }),
    )
  })

  it('does not guard emptiness itself -- an empty lines array still serializes', () => {
    expect(envelope([])).toBe(
      JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } }),
    )
  })
})
