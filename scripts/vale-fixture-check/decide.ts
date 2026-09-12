// Orchestration around the five checks: parsing, ordering, formatting, exit
// code. Split from checks.ts so that file stays a flat list of the checks the
// docs enumerate, one per exported function.

import { checkAll, type Failure } from './checks.ts'
import { parseFixtureSections } from './fixtures-config.ts'
import { toRuleFile, type RuleFile } from './rule-files.ts'
import { parseValeFindings } from './vale-output.ts'

/** A style directory's name plus one rule file's path and unparsed text. */
export interface RawRule {
  style: string
  path: string
  text: string
}

/**
 * Everything run.ts gathers off disk. `valeOutput` is the raw
 * `vale --output=line` text over the fixture directory; `valeFailed` says the
 * run itself could not be trusted, which is a failure rather than a clean set.
 */
export interface Input {
  rawRules: RawRule[]
  fixtureNames: string[]
  fixtureConfig: string
  valeOutput: string
  valeFailure?: string | undefined
}

export interface DecideResult {
  exitCode: number
  lines: string[]
}

/**
 * The pure decision. A vale run that could not complete short-circuits every
 * other check: its empty output is indistinguishable from a clean fixture set,
 * which is the exact confident-zero shape this program exists to prevent.
 */
export function decide(input: Input): DecideResult {
  if (input.valeFailure !== undefined) {
    return {
      exitCode: 1,
      lines: [`vale-fixture-check -- could not lint the fixtures: ${input.valeFailure}`],
    }
  }
  const rules: RuleFile[] = input.rawRules.map((raw) => toRuleFile(raw.style, raw.path, raw.text))
  const failures = checkAll(
    rules,
    input.fixtureNames,
    parseValeFindings(input.valeOutput),
    parseFixtureSections(input.fixtureConfig),
  )
  return failures.length === 0 ? passing(rules, input.fixtureNames) : failing(failures)
}

function passing(rules: RuleFile[], fixtureNames: string[]): DecideResult {
  const styles = new Set(rules.map((rule) => rule.style))
  return {
    exitCode: 0,
    lines: [
      `vale-fixture-check -- ${styles.size} style(s), ${rules.length} rule(s), ${fixtureNames.length} fixture(s), no failures.`,
    ],
  }
}

function failing(failures: Failure[]): DecideResult {
  const lines = failures.map((failure) => `  ${failure.check}: ${failure.file} -- ${failure.message}`)
  return {
    exitCode: 1,
    lines: [`vale-fixture-check -- ${failures.length} failure(s):`, ...lines],
  }
}
