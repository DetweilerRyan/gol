// The PostToolUse wire contract shared by both hook programs
// (board-shape-hook, prose-write-hook): payload in, envelope out. Lives at
// scripts/ root because two programs need it -- the layout rule's "shared
// by two or more programs" test.
export type HookOutcome = { lines: string[]; deliver: boolean }

/**
 * Reads `tool_input.file_path` out of a PostToolUse JSON payload.
 * A malformed or keyless payload lands in the empty-extraction branch too:
 * this returns `''` rather than throwing, so the caller reports a finding
 * instead of reading a parse failure as nothing-to-check.
 */
export function extractFilePath(stdinText: string): string {
  let payload: unknown
  try {
    payload = JSON.parse(stdinText)
  } catch {
    // JSON.parse throws before the assignment above completes, so `payload`
    // stays at its declared initial value (undefined) either way.
  }
  const filePath = (payload as { tool_input?: { file_path?: unknown } })?.tool_input?.file_path
  return typeof filePath === 'string' ? filePath : ''
}

/**
 * Builds the `hookSpecificOutput` envelope JSON that reaches the acting
 * agent's context. Measured 2026-09-16: only this envelope reaches the
 * agent -- main context and subagent alike -- while flat
 * `additionalContext`, `systemMessage`, and exit-0 stderr all vanish. The
 * caller decides whether to write this to stdout at all; it does not guard
 * emptiness itself.
 */
export function envelope(lines: string[]): string {
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: lines.join('\n') },
  })
}
