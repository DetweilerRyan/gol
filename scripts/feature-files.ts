// Shared by acceptance-mutation and gherkin-dry-checker, the two programs
// that need the current set of *.feature files: reading the directory keeps
// both in sync with features/ automatically, rather than each carrying its
// own hardcoded list that goes stale the moment a feature is added, renamed,
// or removed -- both programs used to carry an independent copy of exactly
// that list.
import { readdirSync } from 'node:fs'

// Throws rather than returning an empty array on a features directory with
// no .feature files in it -- the silent-empty-glob hazard vite.config.ts's
// `dom` project comment warns about: a wrong path here would otherwise look
// identical to "there is nothing to check" rather than "the check itself is
// broken".
export function listFeatureFiles(featuresDir: string): string[] {
  const files = readdirSync(featuresDir)
    .filter((name) => name.endsWith('.feature'))
    .sort()
  if (files.length === 0) {
    throw new Error(`No .feature files found in ${featuresDir}`)
  }
  return files
}
