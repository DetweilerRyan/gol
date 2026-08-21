// Parses one rule-tests/*.yml fixture into the shape checks.ts needs. See
// rule-file.ts for why parsing is split from I/O and from the checks.

import { parse } from 'yaml'

export interface FixtureFile {
  path: string
  filenameStem: string
  id: string | undefined
  hasInvalidCases: boolean
}

function filenameStemOf(relativePath: string): string {
  return relativePath.replace(/^.*\//, '').replace(/\.ya?ml$/, '')
}

export function parseFixtureFile(relativePath: string, rawText: string): FixtureFile {
  const parsed = (parse(rawText) ?? {}) as Record<string, unknown>
  const invalid = parsed.invalid
  return {
    path: relativePath,
    filenameStem: filenameStemOf(relativePath),
    id: typeof parsed.id === 'string' ? parsed.id : undefined,
    hasInvalidCases: Array.isArray(invalid) && invalid.length > 0,
  }
}
