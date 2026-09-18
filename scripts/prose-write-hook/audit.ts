// The write-time prose loop's decisions: is a written path in scope, is
// vale on PATH, and what to report once it has run. run.ts owns the git
// spawn, the PATH probe's filesystem access, and the vale spawn itself.
import { delimiter, join } from 'node:path'
import { type HookOutcome } from '../post-tool-use.ts'

export function emptyPathOutcome(): HookOutcome {
  return { lines: ['PROSEHOOK (no path): extraction returned empty'], deliver: true }
}

export function noRootOutcome(path: string): HookOutcome {
  return { lines: [`PROSEHOOK ${path}: no repo root found -- NOT RUN`], deliver: true }
}

/**
 * `path` made relative to `root`. Vale matches `.vale.ini` section globs
 * against the path AS GIVEN, and the harness hands this hook absolute
 * paths -- measured: an absolute path matches no section and reads clean --
 * so the path must be repo-relative before Vale ever sees it.
 */
export function repoRelative(path: string, root: string): string {
  return path.startsWith(root + '/') ? path.slice(root.length + 1) : path
}

// Scope is skills/ and references/ only; articles and CLAUDE.md wait on their backlog triage.
export function inScope(rel: string): boolean {
  const underScope = rel.startsWith('.claude/skills/') || rel.startsWith('.claude/references/')
  return underScope && rel.endsWith('.md') && !rel.endsWith('.meta.md')
}

/** The faithful port of `command -v`: a PATH scan for an executable name, no execution. */
export function valeCandidates(pathEnv: string | undefined): string[] {
  return (pathEnv ?? '').split(delimiter).map((dir) => join(dir, 'vale'))
}

export function valeAbsentOutcome(rel: string): HookOutcome {
  return { lines: [`PROSEHOOK ${rel}: vale absent -- NOT RUN`], deliver: true }
}

/**
 * Turns raw vale output (stdout and stderr merged, as `2>&1` did) into the
 * report. A clean run reports a single line and delivers nothing to the
 * acting agent's context; a finding reports the vale text plus a summary
 * line naming the fix procedure, and delivers both.
 */
export function outcomeFor(rel: string, valeOutput: string): HookOutcome {
  const findings = valeOutput.split('\n').filter((l) => l.includes(':')).length
  if (findings === 0) return { lines: [`PROSEHOOK ${rel}: 0 findings`], deliver: false }
  const valeText = valeOutput.endsWith('\n') ? valeOutput.slice(0, -1) : valeOutput
  return {
    lines: [
      valeText,
      `PROSEHOOK ${rel}: ${findings} finding(s) -- run /prose-audit on this file, and fix before landing`,
    ],
    deliver: true,
  }
}
