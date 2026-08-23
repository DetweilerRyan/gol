#!/usr/bin/env tsx
// Gating checker over `.claude/**` + CLAUDE.md: the binary facts described
// in CLAUDE.md's "Custom quality tooling" section (npm run references
// resolve, agent frontmatter validates, no stale retired-role references,
// the cycle string is identical everywhere, every rules/*.yml is named in
// CLAUDE.md and vice versa). Follows ast-grep-rule-check's shape exactly:
// this file is pure I/O (recursive-ish directory reads, package.json
// parsing, console.log, process.exit), decide.ts is the pure orchestration,
// checks.ts is the five checks themselves.
//
// THIS ONE GATES, like ast-grep-rule-check and unlike gherkin-dry-checker
// and halstead4ts -- every check here is a binary fact rather than
// something needing judgment, so this process exits non-zero on any
// failure.

import { globSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type CheckInput, type RawFile } from './checks.ts'
import { decide, type DecideResult } from './decide.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

function readRawFile(repoRoot: string, relativePath: string): RawFile {
  return { path: relativePath, text: readFileSync(path.join(repoRoot, relativePath), 'utf8') }
}

// Non-recursive by design: .claude/agents/ holds agent files as direct
// children only. Its one subdirectory, articles/, holds shared house rules
// with no frontmatter at all -- recursing into it would hand those files to
// check2's frontmatter parser, which would report every one of them as
// malformed. See CLAUDE.md's own note that articles/*.md files are "not
// agent files."
export function listAgentFiles(repoRoot: string): RawFile[] {
  const dir = path.join(repoRoot, '.claude/agents')
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => readRawFile(repoRoot, `.claude/agents/${entry.name}`))
}

// Directory names never descended into while collecting doc files.
// `.claude/worktrees/` is a sanctioned slice-worktree location (see
// CLAUDE.md's "Setting up a slice"), and a worktree is a full checkout --
// its own CLAUDE.md, its own `.claude/`, and after `npm ci` its own
// node_modules full of package READMEs. Scanning one from the primary
// checkout would walk thousands of foreign files and report another
// slice's (or some dependency's) `npm run` references as this repo's
// failures. The predicate tests each path segment rather than the whole
// string because globSync hands this callback a bare directory name while
// descending ("worktrees") and a fuller relative path for other entries --
// a segment test is correct under either form, and stays correct on a
// runtime that passes only files and prunes nothing.
const EXCLUDED_DOC_DIRS = new Set(['worktrees'])

function isInsideExcludedDocDir(candidatePath: string): boolean {
  return candidatePath.split('/').some((segment) => EXCLUDED_DOC_DIRS.has(segment))
}

// CLAUDE.md plus every .md under .claude/** -- agents and articles alike,
// since checks 1/3/4 (npm run references, stale role references, the cycle
// string) all need to see prose in both places. Sorted so file discovery
// order never changes the order failures are reported in.
export function listDocFiles(repoRoot: string): RawFile[] {
  const claudeMd = readRawFile(repoRoot, 'CLAUDE.md')
  const agentDocs = globSync('.claude/**/*.md', { cwd: repoRoot, exclude: isInsideExcludedDocDir })
    .sort()
    .map((relativePath) => readRawFile(repoRoot, relativePath))
  return [claudeMd, ...agentDocs]
}

// Rule ids are read off the filename, not a parsed `id:` field -- check5
// asks "is this filename named in CLAUDE.md," which is a question about the
// file that exists on disk, not about what the rule happens to declare
// about itself (that agreement is ast-grep-rule-check's checkIdMatchesFilename's
// job, not this program's).
export function listRuleIds(repoRoot: string): string[] {
  const dir = path.join(repoRoot, 'rules')
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.ya?ml$/, ''))
    .sort()
}

export function loadPackageScripts(repoRoot: string): Set<string> {
  const parsed = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>
  }
  return new Set(Object.keys(parsed.scripts ?? {}))
}

export function gatherCheckInput(repoRoot: string): CheckInput {
  return {
    docFiles: listDocFiles(repoRoot),
    agentFiles: listAgentFiles(repoRoot),
    claudeMdText: readRawFile(repoRoot, 'CLAUDE.md').text,
    packageScripts: loadPackageScripts(repoRoot),
    ruleIds: listRuleIds(repoRoot),
  }
}

export function runCheck(repoRoot: string): DecideResult {
  return decide(gatherCheckInput(repoRoot))
}

function main(): void {
  const { exitCode, lines } = runCheck(REPO_ROOT)
  for (const line of lines) console.log(line)
  process.exit(exitCode)
}

// Guards against running main() as a side effect of being imported for
// tests -- run.test.ts imports the exported helpers directly, and none of
// those should trigger a real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
