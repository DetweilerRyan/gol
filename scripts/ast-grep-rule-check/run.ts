#!/usr/bin/env tsx
// Semantic checker over rules/*.yml + rule-tests/*.yml: the properties that
// make a rule's own "was it ever actually shown to fire" claim checkable --
// see checks.ts for what each check asserts and why.
//
// THIS ONE IS A GATE, unlike gherkin-dry-checker and halstead4ts. Those two
// are advisory because their output needs judgment (similarity heuristics, an
// unpublished score formula); every check here is a binary fact, so this
// process exits non-zero on any failure rather than always exiting 0.
//
// Rule and fixture files are discovered by reading sgconfig.yml's `ruleDirs`
// and `testConfigs[].testDir` and recursing into them -- not a hand-maintained
// list like gherkin-dry-checker's FEATURE_FILES, and not a hardcoded
// `rules`/`rule-tests` pair either. ast-grep itself recurses into subdirectories
// of `ruleDirs`/`testDir` (measured against 0.45.1: a rule at
// `rules/nested/no-qux.yml` is scanned by `ast-grep scan` and its fixture run
// by `ast-grep test`), so reading sgconfig.yml and recursing the same way is
// what keeps this checker's file set equal to the one ast-grep actually uses --
// a hardcoded top-level-only pair would fail open on both a nested rule and a
// second `ruleDirs` entry, silently.
//
// Everything that can be pure lives in decide.ts's decide(): parsing (with
// parse-error handling), running every check.ts check, and formatting the
// exit code/output lines. What's left here is genuinely I/O -- recursive
// directory reads, sgconfig.yml parsing, console.log, process.exit -- so a
// test can pin decide()'s exit code without touching the filesystem, and
// run.test.ts can still exercise the recursive/sgconfig-driven parts directly
// against a real temp directory.

import { globSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { decide, type DecideResult, type RawFile } from './decide.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

interface SgConfig {
  ruleDirs: string[]
  testDirs: string[]
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

// Reads `ruleDirs` and `testConfigs[].testDir` off sgconfig.yml rather than
// assuming the `rules`/`rule-tests` pair this repo happens to have today --
// see the module comment above for why a hardcoded pair fails open.
export function loadSgConfig(repoRoot: string): SgConfig {
  const raw = readFileSync(path.join(repoRoot, 'sgconfig.yml'), 'utf8')
  const parsed = (parseYaml(raw) ?? {}) as Record<string, unknown>
  const testConfigs = Array.isArray(parsed.testConfigs) ? parsed.testConfigs : []
  const testDirs = testConfigs
    .map((testConfig: unknown) => (testConfig as { testDir?: unknown } | null)?.testDir)
    .filter((testDir): testDir is string => typeof testDir === 'string')
  return { ruleDirs: toStringArray(parsed.ruleDirs), testDirs }
}

// `ast-grep test` auto-manages a `__snapshots__` subdirectory under each
// testDir for rules that rewrite code (Jest-style snapshot storage, not a
// fixture) -- measured directly: a fixture-shaped file dropped under
// `__snapshots__` is never counted towards "Running N tests", while the exact
// same file one directory name over is. Recursing into it would make this
// checker apply fixture-only checks (e.g. checkFixtureHasInvalidCases) to
// files ast-grep itself never treats as fixtures.
const SNAPSHOTS_DIR_NAME = '__snapshots__'

// Recurses into subdirectories, matching ast-grep's own scan of `ruleDirs`/
// `testDir` (see the module comment above) -- a plain, non-recursive
// `readdirSync` would miss a rule or fixture ast-grep itself still sees.
export function readYamlFilesRecursive(absoluteDir: string, relativeDir: string): RawFile[] {
  const files: RawFile[] = []
  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === SNAPSHOTS_DIR_NAME) continue
    const entryRelativePath = `${relativeDir}/${entry.name}`
    if (entry.isDirectory()) {
      files.push(...readYamlFilesRecursive(path.join(absoluteDir, entry.name), entryRelativePath))
      continue
    }
    if (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml')) {
      files.push({ path: entryRelativePath, text: readFileSync(path.join(absoluteDir, entry.name), 'utf8') })
    }
  }
  return files
}

// Gathers the real file set off disk and hands it to decide.ts's pure
// decide() -- the one function in this module a test can call without
// mocking process.exit, given a repoRoot pointing at a real (or temporary)
// directory tree.
export function runCheck(repoRoot: string): DecideResult {
  const { ruleDirs, testDirs } = loadSgConfig(repoRoot)
  const ruleFiles = ruleDirs.flatMap((dir) => readYamlFilesRecursive(path.join(repoRoot, dir), dir))
  const fixtureFiles = testDirs.flatMap((dir) => readYamlFilesRecursive(path.join(repoRoot, dir), dir))
  const globHasMatch = (pattern: string): boolean => globSync(pattern, { cwd: repoRoot }).length > 0
  return decide(ruleFiles, fixtureFiles, globHasMatch)
}

function main(): void {
  const { exitCode, lines } = runCheck(REPO_ROOT)
  for (const line of lines) console.log(line)
  process.exit(exitCode)
}

// Guards against running main() as a side effect of being imported for tests
// -- run.test.ts imports loadSgConfig/readYamlFilesRecursive/runCheck above
// directly, and none of those should trigger a real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
