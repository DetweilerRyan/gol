// The seven checks over a parsed mutation-invariance config -- the allowlist
// behind CLAUDE.md's merge-protocol step 5 exemption, which is where the
// predicate they police is defined. Every check here is a binary fact --
// this program is a gate, like ast-grep-rule-check and agent-doc-check, not
// advisory like gherkin-dry-checker or halstead4ts.
//
// This file is the seven checks and checkAll, which just runs all of them --
// the surrounding orchestration (parsing, short-circuiting, formatting the
// exit code/output lines) lives in decide.ts instead, mirroring
// ast-grep-rule-check's checks.ts/decide.ts split.

import { checkNonEmpty, type GateFailure } from '../gate-report.ts'
import type { AbsentEntry, AllowEntry, MutationInvarianceConfig } from './config-file.ts'
import { directoryOf, matchesChangedPath, strykerIgnoreCovers, vitestExcludeCovers } from './path-forms.ts'

/** One vitest project's name plus its own `exclude` glob list -- what checkAll's C1 checks against every `allow[]` `vitest-exclude` entry. */
export interface VitestProject {
  name: string
  exclude: string[]
}

export interface CheckInput {
  config: MutationInvarianceConfig
  vitestProjects: VitestProject[]
  strykerIgnorePatterns: string[]
  trackedFiles: Set<string>
  rationaleText: string
}

function entriesSecuredBy(allow: AllowEntry[], securedBy: AllowEntry['securedBy']): AllowEntry[] {
  return allow.filter((entry) => entry.securedBy === securedBy)
}

/**
 * C1: every `vitest-exclude` entry's directory is covered by **every**
 * vitest project's `exclude` -- a project with no matching glob (including
 * one with an empty `exclude`) fails the entry, named in the message.
 */
export function checkVitestExcludeCoverage(
  config: MutationInvarianceConfig,
  vitestProjects: VitestProject[],
): GateFailure[] {
  const failures: GateFailure[] = []
  for (const entry of entriesSecuredBy(config.allow, 'vitest-exclude')) {
    const dir = directoryOf(entry.path)
    if (dir === undefined) {
      failures.push({
        check: 'vitest-exclude-covers',
        file: entry.path,
        message: 'a vitest-exclude entry must use the dir/** form',
      })
      continue
    }
    for (const project of vitestProjects) {
      if (!project.exclude.some((glob) => vitestExcludeCovers(glob, dir))) {
        failures.push({
          check: 'vitest-exclude-covers',
          file: entry.path,
          message: `vitest project "${project.name}" does not exclude ${dir}`,
        })
      }
    }
  }
  return failures
}

// C2's last-wins walk over ignorePatterns in declaration order: a later
// entry overrides an earlier one, exactly as Stryker itself resolves
// ignorePatterns, so a negation appearing after the covering entry re-opens
// the directory.
function isIgnoredByStrykerPatterns(dir: string, patterns: string[]): boolean {
  let ignored = false
  for (const pattern of patterns) {
    const { covers, negated } = strykerIgnoreCovers(pattern, dir)
    if (!covers) continue
    ignored = !negated
  }
  return ignored
}

/**
 * C2: every `stryker-ignore-patterns` entry's directory is ignored under a
 * last-wins walk of `ignorePatterns`, negations included -- a later
 * `!`-prefixed entry re-includes the directory and must fail here.
 */
export function checkStrykerIgnoreCoverage(
  config: MutationInvarianceConfig,
  strykerIgnorePatterns: string[],
): GateFailure[] {
  const failures: GateFailure[] = []
  for (const entry of entriesSecuredBy(config.allow, 'stryker-ignore-patterns')) {
    const dir = directoryOf(entry.path)
    if (dir === undefined) {
      failures.push({
        check: 'stryker-ignore-covers',
        file: entry.path,
        message: 'a stryker-ignore-patterns entry must use the dir/** form',
      })
      continue
    }
    if (!isIgnoredByStrykerPatterns(dir, strykerIgnorePatterns)) {
      failures.push({
        check: 'stryker-ignore-covers',
        file: entry.path,
        message: `${dir} is not ignored under a last-wins walk of ignorePatterns (a later negation may re-include it)`,
      })
    }
  }
  return failures
}

/** C3: every `written-argument` entry's path resolves in the tracked-file set. */
export function checkWrittenArgumentTracked(
  config: MutationInvarianceConfig,
  trackedFiles: Set<string>,
): GateFailure[] {
  return entriesSecuredBy(config.allow, 'written-argument')
    .filter((entry) => !trackedFiles.has(entry.path))
    .map((entry) => ({
      check: 'written-argument-tracked',
      file: entry.path,
      message: `${entry.path} is not a tracked file`,
    }))
}

/** C4: every `allow[].path` and every `absent[].path` appears verbatim in the rationale text -- the per-entry arguments, which run.ts's RATIONALE_PATH resolves to `.claude/agents/articles/mutation-testing.rationale.md`. */
export function checkMentionedInRationale(config: MutationInvarianceConfig, rationaleText: string): GateFailure[] {
  const paths = [...config.allow.map((entry) => entry.path), ...config.absent.map((entry) => entry.path)]
  return paths
    .filter((path) => !rationaleText.includes(path))
    .map((path) => ({
      check: 'mentioned-in-rationale',
      file: path,
      message: `${path} does not appear verbatim in the rationale text`,
    }))
}

function duplicatesOf(paths: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const path of paths) {
    if (seen.has(path)) duplicates.add(path)
    seen.add(path)
  }
  return [...duplicates]
}

/** C5: no duplicate `path` within `allow`, and none within `absent` (checked as two separate lists -- a path may not appear twice in the same list). */
export function checkNoDuplicatePaths(config: MutationInvarianceConfig): GateFailure[] {
  const allowFailures = duplicatesOf(config.allow.map((entry) => entry.path)).map((path) => ({
    check: 'no-duplicate-paths',
    file: path,
    message: `${path} appears more than once in allow[]`,
  }))
  const absentFailures = duplicatesOf(config.absent.map((entry) => entry.path)).map((path) => ({
    check: 'no-duplicate-paths',
    file: path,
    message: `${path} appears more than once in absent[]`,
  }))
  return [...allowFailures, ...absentFailures]
}

function absentContradictedByAllow(absentEntry: AbsentEntry, allow: AllowEntry[]): GateFailure[] {
  return allow
    .filter((allowEntry) => matchesChangedPath(allowEntry.path, absentEntry.path))
    .map((allowEntry) => ({
      check: 'allow-absent-disjoint',
      file: absentEntry.path,
      message: `${absentEntry.path} is covered by allow[]'s ${allowEntry.path}, which contradicts its absent[] entry`,
    }))
}

/**
 * C6: no path appears in both `allow` and `absent`, and no `absent` path is
 * matched by an `allow` directory entry (e.g. an `absent` path nested under
 * an `allow`ed `dir/**`).
 */
export function checkAllowAbsentDisjoint(config: MutationInvarianceConfig): GateFailure[] {
  const allowPaths = new Set(config.allow.map((entry) => entry.path))
  const failures: GateFailure[] = []
  for (const absentEntry of config.absent) {
    if (allowPaths.has(absentEntry.path)) {
      failures.push({
        check: 'allow-absent-disjoint',
        file: absentEntry.path,
        message: `${absentEntry.path} appears in both allow[] and absent[]`,
      })
    }
    failures.push(...absentContradictedByAllow(absentEntry, config.allow))
  }
  return failures
}

/**
 * C7: `allow`, `vitestProjects` and `trackedFiles` must each be non-empty.
 * Without the last two, C1 and C3 pass vacuously -- an empty
 * `vitestProjects` means no `vitest-exclude` entry is ever checked against
 * anything, and an empty `trackedFiles` means no `written-argument` entry
 * can ever fail C3. This is the fail-open hole in this program; it is not
 * optional.
 */
export function checkNonEmptyInputs(input: CheckInput): GateFailure[] {
  return [
    ...checkNonEmpty(input.config.allow, 'allow-non-empty', '(none)', 'allow[] is empty'),
    ...checkNonEmpty(
      input.vitestProjects,
      'vitest-projects-non-empty',
      '(none)',
      'no vitest projects were provided -- C1 would pass vacuously',
    ),
    ...checkNonEmpty(
      [...input.trackedFiles],
      'tracked-files-non-empty',
      '(none)',
      'no tracked files were provided -- C3 would pass vacuously',
    ),
  ]
}

export function checkAll(input: CheckInput): GateFailure[] {
  return [
    ...checkNonEmptyInputs(input),
    ...checkVitestExcludeCoverage(input.config, input.vitestProjects),
    ...checkStrykerIgnoreCoverage(input.config, input.strykerIgnorePatterns),
    ...checkWrittenArgumentTracked(input.config, input.trackedFiles),
    ...checkMentionedInRationale(input.config, input.rationaleText),
    ...checkNoDuplicatePaths(input.config),
    ...checkAllowAbsentDisjoint(input.config),
  ]
}
