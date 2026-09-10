// The whole program's decision as one pure function: parse+validate the
// config, run every checks.ts check, and -- only if both of those are
// clean -- evaluate a --diff verdict. run.ts's job is gathering DecideInput
// off disk and git and handing it to decide() here, mirroring
// ast-grep-rule-check's and agent-doc-check's own decide.ts split.
//
// Exit codes: 0 everything asserted is true; 1 validation failed and no
// verdict was computed; 2 config sound but the diff is not invariant. Kept
// distinct so `if npm run mutation-invariance -- --diff X; then` fails safe
// under a crash -- a nonzero exit either way, but only 2 is "I checked and
// it's not invariant".

import { checkAll, type VitestProject } from './checks.ts'
import { parseConfig, type MutationInvarianceConfig } from './config-file.ts'
import { evaluateDiff } from './diff-verdict.ts'
import type { GateFailure } from '../gate-report.ts'

/** A resolved `--diff <range>`: the range itself (for display), the command that produced `changedPaths` (for display), and the changed paths themselves. Gathering these is run.ts's job -- decide() only evaluates them. */
export interface DiffInput {
  range: string
  command: string
  changedPaths: string[]
}

export interface DecideInput {
  configText: string
  schemaText: string
  configPath: string
  vitestProjects: VitestProject[]
  strykerIgnorePatterns: string[]
  trackedFiles: Set<string>
  rationaleText: string
  diff?: DiffInput
}

export interface DecideResult {
  exitCode: number
  lines: string[]
}

function formatFailureLines(label: string, failures: GateFailure[]): string[] {
  return [
    `mutation-invariance -- ${label}, ${failures.length} failure(s):`,
    '',
    ...failures.flatMap((failure) => [`[${failure.check}] ${failure.file}`, `  ${failure.message}`]),
  ]
}

function decideDiff(config: MutationInvarianceConfig, diff: DiffInput): DecideResult {
  const verdict = evaluateDiff(diff.changedPaths, config)
  if (verdict.invariant) {
    return { exitCode: 0, lines: [`mutation-invariance -- ${diff.range} is mutation-invariant.`] }
  }
  // evaluateDiff sets `reason` on every `invariant: false` verdict (see
  // diff-verdict.ts) -- the `?? ''` this used to carry had no path that
  // could reach it, and so no test could distinguish it from `reason`
  // itself; dropped for the same reason as config-file.ts's formatAjvError.
  const lines = [`mutation-invariance -- ${diff.range} is NOT mutation-invariant.`, `  ${verdict.reason}`]
  if (verdict.disqualifying?.absentReason) {
    lines.push(`  (${verdict.disqualifying.path} is in absent[]: ${verdict.disqualifying.absentReason})`)
  }
  return { exitCode: 2, lines }
}

/**
 * The whole program's decision: config parse/schema failures short-circuit
 * with exit 1 before checkAll runs; checkAll failures short-circuit with
 * exit 1 before the diff is evaluated; only a sound config reaches
 * evaluateDiff, which returns exit 0 (invariant) or 2 (not invariant). No
 * `diff` at all is exit 0 -- config validity alone was asked for.
 */
export function decide(input: DecideInput): DecideResult {
  // One operand, because ParseConfigResult is a union rather than a pair of
  // optional fields -- there is no "config present alongside failures" state
  // to guard against, so there is no second condition here whose correlation
  // with the first would have to be argued in a comment and could not be
  // told apart by any test.
  const parsed = parseConfig(input.configText, input.schemaText, input.configPath)
  if (parsed.failures !== undefined) {
    return { exitCode: 1, lines: formatFailureLines('config invalid', parsed.failures) }
  }

  const checkFailures = checkAll({
    config: parsed.config,
    vitestProjects: input.vitestProjects,
    strykerIgnorePatterns: input.strykerIgnorePatterns,
    trackedFiles: input.trackedFiles,
    rationaleText: input.rationaleText,
  })
  if (checkFailures.length > 0) {
    return { exitCode: 1, lines: formatFailureLines('config unsound', checkFailures) }
  }

  if (!input.diff) {
    return { exitCode: 0, lines: ['mutation-invariance -- config valid, no --diff given.'] }
  }

  return decideDiff(parsed.config, input.diff)
}
