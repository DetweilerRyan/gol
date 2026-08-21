// Parses one rules/*.yml file into the shape checks.ts needs. Parsing is kept
// separate from I/O (run.ts reads the files) and from the checks themselves so
// each half can be unit-tested against literal strings, with no filesystem.

import { parse } from 'yaml'
import { filenameStemOf } from './filenames.ts'

export interface UnresolvedFilesMarker {
  present: boolean
  // Non-null only when the marker carries a non-empty reason -- a marker with
  // no reason does not count as an opt-out (see checks.ts).
  reason: string | null
}

export interface RuleFile {
  path: string
  filenameStem: string
  id: string | undefined
  severity: string | undefined
  files: string[] | undefined
  unresolvedFilesMarker: UnresolvedFilesMarker
}

// `# ast-grep-rule-check: allow-unresolved-files <reason>` -- anything after
// the keyword on the same line is the reason. YAML comments are stripped by
// the parser, so this is matched against the raw text instead.
//
// The marker is file-scoped, not glob-scoped: a rule with two `files:` globs
// and one marker suppresses check 6 for *both* globs, including one that
// already resolves. Fine at today's scale (no rule file has ever needed two
// globs where only one was unresolved), but worth knowing if that changes --
// see checks.ts's checkStaleOptOuts for the complementary case, a marker that
// no longer excuses anything.
//
// The trailing `$` is a genuinely equivalent mutant if removed, so Stryker
// reports it as a permanent survivor here: `.` matches no line terminator, so
// greedy `(.*)` already stops exactly where a multiline `$` would assert, for
// every possible input. Re-verified by differentially fuzzing this regex
// against its `$`-less form over 400k random strings built from an alphabet
// of `\n`/`\r`/`#`/`:` and the keyword itself -- zero differing results. Left
// in because it documents the intent, not because a test can distinguish it.
const UNRESOLVED_FILES_MARKER = /^#\s*ast-grep-rule-check:\s*allow-unresolved-files(.*)$/m

export function extractUnresolvedFilesMarker(rawText: string): UnresolvedFilesMarker {
  const match = rawText.match(UNRESOLVED_FILES_MARKER)
  if (!match) return { present: false, reason: null }
  const reason = match[1].trim()
  return { present: true, reason: reason.length > 0 ? reason : null }
}

function toStringArray(value: unknown): string[] | undefined {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string')
  return undefined
}

export function parseRuleFile(relativePath: string, rawText: string): RuleFile {
  const parsed = (parse(rawText) ?? {}) as Record<string, unknown>
  return {
    path: relativePath,
    filenameStem: filenameStemOf(relativePath),
    id: typeof parsed.id === 'string' ? parsed.id : undefined,
    severity: typeof parsed.severity === 'string' ? parsed.severity : undefined,
    files: toStringArray(parsed.files),
    unresolvedFilesMarker: extractUnresolvedFilesMarker(rawText),
  }
}
