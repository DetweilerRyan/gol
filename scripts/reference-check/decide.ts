import { checkAll, type CheckInput, type FileIndex, type Failure } from './checks.ts'
import { extractFileTokens } from './references.ts'
import { scannableLinesOf } from './scannable-lines.ts'

export interface DecideResult {
  exitCode: number
  lines: string[]
}

function countReferences(input: CheckInput): number {
  return input.files.reduce(
    (total, file) =>
      total +
      scannableLinesOf(file.text, file.surface).reduce(
        (lineTotal, line) => lineTotal + extractFileTokens(line.text).length,
        0,
      ),
    0,
  )
}

function formatLines(input: CheckInput, failures: Failure[]): string[] {
  // The summary always reports files scanned *and* references found, even
  // on a clean run, so a shrinking surface (a scope predicate quietly
  // narrowing) is visible before it reaches zero and trips
  // reference-check-inert.
  const summary = `reference-check -- ${input.files.length} file(s) scanned, ${countReferences(input)} reference(s) found`
  if (failures.length === 0) return [`${summary}, no failures.`]
  return [
    `${summary}, ${failures.length} failure(s):`,
    '',
    ...failures.flatMap((failure) => [`[${failure.check}] ${failure.file}`, `  ${failure.message}`]),
  ]
}

/**
 * The whole program's decision as one pure function: run every check.ts
 * check over the files run.ts read off disk and the FileIndex it built, and
 * turn the result into an exit code plus the exact lines to print -- which
 * is what lets a test pin the exit code without touching the filesystem.
 */
// Mirrors agent-doc-check's/ast-grep-rule-check's decide.ts split for the
// same reason.
export function decide(input: CheckInput, index: FileIndex): DecideResult {
  const failures = checkAll(input, index)
  return {
    exitCode: failures.length === 0 ? 0 : 1,
    lines: formatLines(input, failures),
  }
}
