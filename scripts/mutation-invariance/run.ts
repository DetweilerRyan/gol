#!/usr/bin/env tsx
// I/O shell for mutation-invariance: gathers decide.ts's DecideInput off
// disk, git, and vite.config.ts's own live project list, and hands it to
// decide()'s pure decision. Mirrors ast-grep-rule-check's/
// agent-doc-check's/reference-check's run.ts split -- args.ts, checks.ts,
// config-file.ts, diff-verdict.ts, path-forms.ts and decide.ts are all
// pure; everything here is genuinely I/O (readFileSync, a git subprocess, a
// dynamic import of vite.config.ts, console.log, process.exit).
//
// THIS ONE GATES like ast-grep-rule-check, agent-doc-check and
// reference-check -- every check decide.ts runs is a binary fact, so this
// process exits 1 on a config/check failure and 2 on a --diff range that
// isn't mutation-invariant, per decide.ts's own exit-code contract.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './args.ts'
import type { VitestProject } from './checks.ts'
import { decide, type DecideInput, type DecideResult, type DiffInput } from './decide.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

const CONFIG_PATH = 'mutation-invariance.config.json'
const SCHEMA_PATH = 'schemas/mutation-invariance.schema.json'
const RATIONALE_PATH = '.claude/agents/articles/mutation-testing.rationale.md'

function readRepoFile(repoRoot: string, relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Same existsSync-guard-that-throws-by-name idiom as agent-doc-check's
// RULE_DOC_PATH: a moved or renamed rationale file must fail loudly rather
// than produce a clean run over nothing. Without this guard, a missing file
// would make checkMentionedInRationale (C4) fail every allow[]/absent[]
// path as "not mentioned" -- still a failure, but the wrong one, and one
// that gives no hint the file itself moved rather than the prose in it.
function readRationaleFile(repoRoot: string): string {
  const fullPath = path.join(repoRoot, RATIONALE_PATH)
  if (!existsSync(fullPath)) {
    throw new Error(`Rationale file not found: ${RATIONALE_PATH} -- checkMentionedInRationale (C4) has nothing to read`)
  }
  return readRepoFile(repoRoot, RATIONALE_PATH)
}

/**
 * Every vitest project's own `name` and `test.exclude`, read from the live
 * `vite.config.ts` by dynamic import rather than from the `sharedExclude`
 * constant it's built from -- C1's whole point is verifying what each
 * project actually collects with, and a project that stopped spreading
 * `sharedExclude` into its own `exclude` is exactly the regression reading
 * the constant instead would miss. The specifier is a literal relative
 * path, kept static rather than built from REPO_ROOT, so a shape change in
 * vite.config.ts's export is a build-time signal wherever tsconfig.scripts.json's
 * lib gap allows it, not just a runtime one.
 */
async function loadVitestProjects(): Promise<VitestProject[]> {
  const mod = (await import('../../vite.config.ts')) as {
    default: { test?: { projects?: { test?: { name?: string; exclude?: string[] } }[] } }
  }
  const projects = mod.default.test?.projects ?? []
  return projects.map((project) => ({
    name: project.test?.name ?? '(unnamed)',
    exclude: project.test?.exclude ?? [],
  }))
}

function loadStrykerIgnorePatterns(repoRoot: string): string[] {
  const parsed = JSON.parse(readRepoFile(repoRoot, 'stryker.config.json')) as { ignorePatterns?: string[] }
  return parsed.ignorePatterns ?? []
}

/**
 * Every tracked file plus every untracked-but-not-gitignored file --
 * `git ls-files --cached --others --exclude-standard`, the same universe
 * reference-check's listRepoPaths draws from.
 */
function loadTrackedFiles(repoRoot: string): Set<string> {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  return new Set(output.split('\n').filter((line) => line.length > 0))
}

/**
 * `--no-renames` is not optional: rename detection reports only a changed
 * path's new name, which would hide a path moving out of an allowlisted
 * directory from evaluateDiff entirely. `command` carries the exact string
 * run, since decide.ts's report echoes it back on failure.
 */
function loadDiff(repoRoot: string, range: string): DiffInput {
  const args = ['diff', '--name-only', '--no-renames', range]
  const command = `git ${args.join(' ')}`
  const output = execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
  const changedPaths = output.split('\n').filter((line) => line.length > 0)
  return { range, command, changedPaths }
}

export async function gatherDecideInput(repoRoot: string, range: string | undefined): Promise<DecideInput> {
  return {
    configText: readRepoFile(repoRoot, CONFIG_PATH),
    schemaText: readRepoFile(repoRoot, SCHEMA_PATH),
    configPath: CONFIG_PATH,
    vitestProjects: await loadVitestProjects(),
    strykerIgnorePatterns: loadStrykerIgnorePatterns(repoRoot),
    trackedFiles: loadTrackedFiles(repoRoot),
    rationaleText: readRationaleFile(repoRoot),
    diff: range === undefined ? undefined : loadDiff(repoRoot, range),
  }
}

export async function runCheck(repoRoot: string, argv: string[]): Promise<DecideResult> {
  const { range } = parseArgs(argv)
  const input = await gatherDecideInput(repoRoot, range)
  return decide(input)
}

async function main(): Promise<void> {
  const { exitCode, lines } = await runCheck(REPO_ROOT, process.argv.slice(2))
  for (const line of lines) console.log(line)
  process.exit(exitCode)
}

// Guards against running main() as a side effect of being imported for
// tests -- run.test.ts imports the exported helpers directly, and none of
// those should trigger a real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main()
}
