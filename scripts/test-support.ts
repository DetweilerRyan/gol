import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

// For a test that builds a throwaway repo tree under a temp directory in
// order to exercise a program's I/O-reading exports (listRuleIds /
// listAgentFiles and the like) end to end. Extracted once a second program
// produced a byte-identical copy -- dry4ts caught it. `git grep -l
// "test-support" scripts` answers which tests use it, which a list here
// cannot do without rotting.
//
// Excluded from crap4ts/Stryker's scripts/ scope the same way
// scripts/perf-report/test-support.ts already is -- see
// crap4ts.scripts.config.ts and stryker.scripts.config.json's shared
// `test-support.ts` exclusion (matched at any depth). This is test infrastructure, not product
// code.
export function writeFile(root: string, relativePath: string, contents: string): void {
  const full = path.join(root, relativePath)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, contents)
}
