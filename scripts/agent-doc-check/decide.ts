// The whole program's decision as one pure function: run every check in
// checks.ts over the file contents run.ts read off disk, and turn the
// result into an exit code plus the exact lines to print. run.ts's job
// shrinks to gathering the CheckInput off disk (agent files, other docs,
// package.json's scripts, rule filenames) and handing it to decide() here --
// which is what lets a test pin the exit code without touching the
// filesystem. Mirrors ast-grep-rule-check's decide.ts split for the same
// reason.

import { checkAll, type CheckInput, type Failure } from './checks.ts'

export interface DecideResult {
  exitCode: number
  lines: string[]
}

function formatLines(input: CheckInput, failures: Failure[]): string[] {
  if (failures.length === 0) {
    return [
      `agent-doc-check -- ${input.docFiles.length} doc file(s), ${input.agentFiles.length} agent file(s), ${input.ruleIds.length} rule(s), no failures.`,
    ]
  }
  return [
    `agent-doc-check -- ${failures.length} failure(s):`,
    '',
    ...failures.flatMap((failure) => [`[${failure.check}] ${failure.file}`, `  ${failure.message}`]),
  ]
}

export function decide(input: CheckInput): DecideResult {
  const failures = checkAll(input)
  return {
    exitCode: failures.length === 0 ? 0 : 1,
    lines: formatLines(input, failures),
  }
}
