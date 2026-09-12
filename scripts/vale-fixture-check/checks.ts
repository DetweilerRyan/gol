// The five binary facts this program asserts about vale-styles/. One exported
// function per check, flat, in the order the docs list them -- the same shape as
// ast-grep-rule-check's checks.ts, and for the same reason: a reader comparing
// the docs to the code should not have to trace a call graph.
//
// WHAT THIS PROGRAM CANNOT CHECK, stated here because a later reader will
// otherwise assume a green run means more than it does.
//
// Check 2 proves a `.good` fixture reports nothing. It does NOT prove the
// fixture DISCRIMINATES. `ProcedureLength.good.md` earns its keep because its
// bullet is 23 words -- long enough to trip the rule if the numbered marker were
// not the real discriminator. Verifying that requires knowing what a given rule
// turns on, which is rule-specific knowledge no generic checker has.
//
// A heuristic was considered and REJECTED: scoring word overlap between the
// `.bad` and `.good` pair would reject legitimate fixtures, and a false
// rejection is worse than an honest gap. The near-miss judgement stays with
// `architect` at REVIEW time. Ruled 2026-09-12.
//
// The same gap exists in ast-grep-rule-check and is accepted there: its
// fixture-has-invalid-cases check never inspects the `valid:` side at all.
//
// EQUIVALENT MUTANTS, ruled 2026-09-12 and recorded rather than left implicit.
// checkStylesWired's `style === undefined || extension === undefined` guard
// carries four survivors between its two operands. No input reaches it: the key
// it destructures is built two lines above as `${rule.style} ${ext}`, so the
// split always yields two defined halves. The guard exists because
// noUncheckedIndexedAccess makes the destructure `string | undefined`, and
// TypeScript cannot see the invariant. Deleting it is not an option and no test
// can distinguish it -- see mutation-testing.md on ruling a survivor equivalent.

import { checkNonEmpty, type GateFailure } from '../gate-report.ts'
import { sectionCoversExtension, type FixtureSection } from './fixtures-config.ts'
import type { RuleFile } from './rule-files.ts'
import type { ValeFinding } from './vale-output.ts'

export type Failure = GateFailure

/** Check 1: every rule has a `.bad` and a `.good` fixture per claimed extension. */
export function checkFixturePairsExist(rules: RuleFile[], fixtureNames: string[]): Failure[] {
  const failures: Failure[] = []
  for (const rule of rules) {
    for (const extension of rule.extensions) {
      for (const kind of ['bad', 'good']) {
        const expected = `${rule.name}.${kind}.${extension}`
        if (fixtureNames.includes(expected)) continue
        failures.push({
          check: 'fixture-pair-exists',
          file: rule.path,
          message: `no ${expected} -- a rule with no ${kind} fixture for an extension it claims is untested there`,
        })
      }
    }
  }
  return failures
}

/** Check 2: every `.good` fixture reports nothing. */
export function checkGoodFixturesSilent(fixtureNames: string[], findings: ValeFinding[]): Failure[] {
  const goodNames = fixtureNames.filter((name) => name.includes('.good.'))
  return findings
    .filter((finding) => goodNames.some((name) => finding.file.endsWith(name)))
    .map((finding) => ({
      check: 'good-fixture-silent',
      file: finding.file,
      message: `reports ${finding.rule} -- a good fixture must report nothing, or the rule over-fires`,
    }))
}

/** Check 3: every `.bad` fixture reports its own rule, by name, at least once. */
export function checkBadFixturesFire(rules: RuleFile[], fixtureNames: string[], findings: ValeFinding[]): Failure[] {
  const failures: Failure[] = []
  for (const rule of rules) {
    for (const extension of rule.extensions) {
      const expected = `${rule.name}.bad.${extension}`
      if (!fixtureNames.includes(expected)) continue
      const fired = findings.some(
        (finding) => finding.file.endsWith(expected) && finding.rule === `${rule.style}.${rule.name}`,
      )
      if (fired) continue
      failures.push({
        check: 'bad-fixture-fires',
        file: expected,
        message: `does not report ${rule.style}.${rule.name} -- a rule matching nothing reports nothing, which reads exactly like a clean tree`,
      })
    }
  }
  return failures
}

/** Check 4: at least one rule was found at all. */
export function checkAnyRulesFound(rules: RuleFile[]): Failure[] {
  return checkNonEmpty(
    rules,
    'any-rules-found',
    '(none)',
    'no rule files found in any tracked style -- every other check passes vacuously',
  )
}

/**
 * Check 5: every tracked style is enabled in the fixture config, for each
 * extension its own rules claim. A style wired into no section has fixtures
 * nobody lints, and passes checks 1 to 3 by being invisible to them.
 */
export function checkStylesWired(rules: RuleFile[], sections: FixtureSection[]): Failure[] {
  const failures: Failure[] = []
  const wanted = new Set(rules.flatMap((rule) => rule.extensions.map((ext) => `${rule.style} ${ext}`)))
  for (const key of [...wanted].sort()) {
    const [style, extension] = key.split(' ')
    if (style === undefined || extension === undefined) continue
    const wired = sections.some(
      (section) => sectionCoversExtension(section.glob, extension) && section.styles.includes(style),
    )
    if (wired) continue
    failures.push({
      check: 'style-wired-into-fixtures',
      file: 'vale-styles/fixtures/fixtures.vale.ini',
      message: `${style} is not enabled for *.${extension} -- its fixtures are never linted, so its rules pass every other check untested`,
    })
  }
  return failures
}

/** Every check, in the order the docs list them. */
export function checkAll(
  rules: RuleFile[],
  fixtureNames: string[],
  findings: ValeFinding[],
  sections: FixtureSection[],
): Failure[] {
  return [
    ...checkAnyRulesFound(rules),
    ...checkFixturePairsExist(rules, fixtureNames),
    ...checkGoodFixturesSilent(fixtureNames, findings),
    ...checkBadFixturesFire(rules, fixtureNames, findings),
    ...checkStylesWired(rules, sections),
  ]
}
