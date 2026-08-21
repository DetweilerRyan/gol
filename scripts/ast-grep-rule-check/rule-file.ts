// Parses one rules/*.yml file into the shape checks.ts needs. Parsing is kept
// separate from I/O (run.ts reads the files) and from the checks themselves so
// each half can be unit-tested against literal strings, with no filesystem.

import { parse } from 'yaml'

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
const UNRESOLVED_FILES_MARKER = /^#\s*ast-grep-rule-check:\s*allow-unresolved-files(.*)$/m

export function extractUnresolvedFilesMarker(rawText: string): UnresolvedFilesMarker {
  const match = rawText.match(UNRESOLVED_FILES_MARKER)
  if (!match) return { present: false, reason: null }
  const reason = match[1].trim()
  return { present: true, reason: reason.length > 0 ? reason : null }
}

function filenameStemOf(relativePath: string): string {
  return relativePath.replace(/^.*\//, '').replace(/\.ya?ml$/, '')
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
