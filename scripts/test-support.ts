import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

// Shared by the gate programs' run.test.ts files (currently
// ast-grep-rule-check and agent-doc-check) that build a throwaway repo tree
// under a temp directory to exercise their own I/O-reading exports
// (listRuleIds/listAgentFiles/etc.) end to end. Extracted once a second
// program produced a byte-identical copy -- dry4ts caught it.
//
// Excluded from crap4ts/Stryker's scripts/ scope the same way
// scripts/perf-report/test-support.ts already is -- see
// crap4ts.scripts.config.ts and stryker.scripts.config.json's shared
// `**/test-support.ts` exclusion. This is test infrastructure, not product
// code.
export function writeFile(root: string, relativePath: string, contents: string): void {
  const full = path.join(root, relativePath)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, contents)
}
