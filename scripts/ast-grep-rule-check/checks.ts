// The semantic checks over rules/*.yml + rule-tests/*.yml described in
// CLAUDE.md: mechanical facts that catch a rule matching nothing without
// anyone noticing (the failure mode two of this repo's six rules actually hit
// when first written). Every check here is a binary fact -- unlike
// gherkin-dry-checker and halstead4ts, this program is a gate, not advisory.
//
// Verified against ast-grep 0.45.1: an unresolved `files:` glob fails *open*
// (the rule silently checks nothing, exit 0) while an unresolved `ignores:`
// glob fails *safe* (the rule merely over-applies, which shows up as noisy
// findings). That asymmetry is why check 6 below covers `files:` only.
//
// This file is the nine checks and checkAllRules, which just runs all of
// them -- the surrounding orchestration (parsing raw file text, catching
// parse errors, and formatting the exit code/output lines) lives in
// decide.ts instead, which imports checkAllRules from here. See decide.ts's
// module comment for why that's a separate file rather than living here too.

import { fixtureStemForRuleId, ruleIdForFixtureStem } from './filenames.ts'
import type { FixtureFile } from './fixture-file.ts'
import type { RuleFile } from './rule-file.ts'

export interface Failure {
  check: string
  file: string
  message: string
}

// Shared across checks 6 and 9 (and decide()'s glob-driven checkAllRules
// call): whether a `files:` glob pattern currently resolves to a real file.
// Named so its six call sites don't each spell out the same inline function
// type -- see rule-file.ts's UnresolvedFilesMarker for the marker it's paired
// with.
export type GlobHasMatch = (pattern: string) => boolean

// Confirmed directly against ast-grep 0.45.1: `severity: bogus` fails to
// parse with exactly this list. A typo'd *key* (`sevrity:`) is a different
// failure -- YAML accepts it, `severity` on the parsed rule is simply
// undefined, and ast-grep silently demotes the rule to `help` -- which is why
// "severity present and valid" has to be a check of its own, not just
// something ast-grep would reject for us.
const VALID_SEVERITIES = ['hint', 'info', 'warning', 'error', 'off']

// Check 1: every rule has a fixture at rule-tests/<id>-test.yml.
export function checkFixtureExists(rules: RuleFile[], fixtures: FixtureFile[]): Failure[] {
  const fixtureStems = new Set(fixtures.map((fixture) => fixture.filenameStem))
  const failures: Failure[] = []
  for (const rule of rules) {
    if (!rule.id) {
      failures.push({
        check: 'fixture-exists',
        file: rule.path,
        message: 'rule has no `id`, so its fixture cannot be located',
      })
      continue
    }
    const expectedStem = fixtureStemForRuleId(rule.id)
    if (!fixtureStems.has(expectedStem)) {
      failures.push({
        check: 'fixture-exists',
        file: rule.path,
        message: `no fixture found at rule-tests/${expectedStem}.yml`,
      })
    }
  }
  return failures
}

// Check 2: a rule's declared id equals its own filename stem.
export function checkIdMatchesFilename(rules: RuleFile[]): Failure[] {
  return rules
    .filter((rule) => rule.id !== rule.filenameStem)
    .map((rule) => ({
      check: 'id-matches-filename',
      file: rule.path,
      message: `id \`${rule.id ?? '(missing)'}\` does not match filename stem \`${rule.filenameStem}\``,
    }))
}

// Groups rules by declared id, dropping id-less rules (those are already
// covered by checkFixtureExists), so checkNoDuplicateIds only has to walk the
// groups and doesn't have to build them itself.
function groupRulesById(rules: RuleFile[]): Map<string, RuleFile[]> {
  const filesById = new Map<string, RuleFile[]>()
  for (const rule of rules) {
    if (!rule.id) continue
    const existing = filesById.get(rule.id) ?? []
    existing.push(rule)
    filesById.set(rule.id, existing)
  }
  return filesById
}

// Check 3: no two rule files declare the same id.
export function checkNoDuplicateIds(rules: RuleFile[]): Failure[] {
  const failures: Failure[] = []
  for (const [id, files] of groupRulesById(rules)) {
    if (files.length < 2) continue
    for (const rule of files) {
      const others = files.filter((other) => other !== rule).map((other) => other.path)
      failures.push({
        check: 'no-duplicate-ids',
        file: rule.path,
        message: `id \`${id}\` is also used by ${others.join(', ')}`,
      })
    }
  }
  return failures
}

// Check 4: every rule declares a severity, and it's one ast-grep recognizes.
export function checkSeverityValid(rules: RuleFile[]): Failure[] {
  const failures: Failure[] = []
  for (const rule of rules) {
    if (!rule.severity) {
      failures.push({
        check: 'severity-valid',
        file: rule.path,
        message:
          "missing `severity` -- a typo'd key (e.g. `sevrity:`) leaves this absent and ast-grep silently demotes the rule",
      })
      continue
    }
    if (!VALID_SEVERITIES.includes(rule.severity)) {
      failures.push({
        check: 'severity-valid',
        file: rule.path,
        message: `severity \`${rule.severity}\` is not one of: ${VALID_SEVERITIES.join(', ')}`,
      })
    }
  }
  return failures
}

// Check 5: every fixture has at least one `invalid:` case -- a fixture with
// only `valid:` entries passes `ast-grep test` while proving nothing.
export function checkFixtureHasInvalidCases(fixtures: FixtureFile[]): Failure[] {
  return fixtures
    .filter((fixture) => !fixture.hasInvalidCases)
    .map((fixture) => ({
      check: 'fixture-has-invalid-cases',
      file: fixture.path,
      message: 'fixture has no `invalid:` cases -- a rule with no failing fixture has not been shown to work',
    }))
}

function unresolvedFilesMarkerFailure(rule: RuleFile): Failure {
  return {
    check: 'files-globs-resolve',
    file: rule.path,
    message: 'allow-unresolved-files marker has no reason -- the opt-out requires one to be stated',
  }
}

// The glob half of check 6, kept separate from the marker handling below it
// -- it has no opinion on the marker, only on `files:` globs.
function checkGlobsResolve(rule: RuleFile, globHasMatch: GlobHasMatch): Failure[] {
  const failures: Failure[] = []
  for (const pattern of rule.files ?? []) {
    if (!globHasMatch(pattern)) {
      failures.push({
        check: 'files-globs-resolve',
        file: rule.path,
        message: `\`files:\` glob \`${pattern}\` matches no file`,
      })
    }
  }
  return failures
}

// One rule's contribution to check 6, kept separate from the list-level
// flatMap in checkFilesGlobsResolve below. A marker present *with* a reason
// suppresses both the no-reason failure and the glob check below it -- any
// other combination (no marker, or a marker with no reason) runs the glob
// check as normal.
function checkRuleFilesGlobsResolve(rule: RuleFile, globHasMatch: GlobHasMatch): Failure[] {
  const marker = rule.unresolvedFilesMarker
  const suppressed = marker.present && Boolean(marker.reason)
  if (suppressed) return []

  const markerFailure = marker.present ? [unresolvedFilesMarkerFailure(rule)] : []
  return [...markerFailure, ...checkGlobsResolve(rule, globHasMatch)]
}

// Check 6: every `files:` glob resolves to at least one existing file, unless
// the rule carries an `allow-unresolved-files` marker with a stated reason.
// A marker present without a reason does not suppress the check -- it's
// reported as its own failure instead, since the opt-out requires the reason
// to actually be written down.
export function checkFilesGlobsResolve(rules: RuleFile[], globHasMatch: GlobHasMatch): Failure[] {
  return rules.flatMap((rule) => checkRuleFilesGlobsResolve(rule, globHasMatch))
}

// Check 7: a fixture's declared `id` names the rule its own filename claims
// to test. ast-grep binds a fixture to a rule by this `id`, not by the
// filename -- `ast-grep test` happily runs a fixture named `no-bar-test.yml`
// against `no-foo`'s rule if that's what its `id:` says, exit 0, and reports
// nothing. checkFixtureExists only checks the forward direction (every rule
// has a same-stemmed fixture file on disk); this is the missing reverse
// direction, so renaming a rule without also updating the fixture's `id:`
// leaves that rule with no working fixture even though a same-named file
// exists.
export function checkFixtureIdMatchesFilename(fixtures: FixtureFile[]): Failure[] {
  const failures: Failure[] = []
  for (const fixture of fixtures) {
    const expectedId = ruleIdForFixtureStem(fixture.filenameStem)
    if (fixture.id === expectedId) continue
    failures.push({
      check: 'fixture-id-matches-filename',
      file: fixture.path,
      message: `filename claims to test \`${expectedId}\`, but its id is \`${fixture.id ?? '(missing)'}\` -- \`${expectedId}\`'s rule is untested`,
    })
  }
  return failures
}

// Check 8: at least one rule was found at all. An empty (or misconfigured)
// rules directory would otherwise report "0 rules, 0 fixtures, no failures"
// and exit 0 -- a checker that checked nothing, reporting nothing, is
// indistinguishable from a clean repo, which is exactly the failure mode
// every other check here exists to catch elsewhere.
export function checkAnyRulesFound(rules: RuleFile[]): Failure[] {
  if (rules.length > 0) return []
  return [
    {
      check: 'rules-found',
      file: '(none)',
      message: 'no rule files were found -- check ruleDirs in sgconfig.yml and the directories it points at',
    },
  ]
}

// One rule's contribution to check 9, kept separate from the loop in
// checkStaleOptOuts below -- mirrors the check-6 split above (a guard
// function the loop just calls) rather than inlining every early-return into
// one long function body.
function isStaleOptOut(rule: RuleFile, globHasMatch: GlobHasMatch): boolean {
  const marker = rule.unresolvedFilesMarker
  if (!marker.present || !marker.reason) return false
  const files = rule.files ?? []
  if (files.length === 0) return false
  return files.every((pattern) => globHasMatch(pattern))
}

// Check 9: an `allow-unresolved-files` marker whose reason no longer applies.
// The marker is meant to be temporary (see check 6's reason requirement) --
// once every `files:` glob it was excusing actually resolves, the marker
// keeps suppressing check 6 for no reason, which is drift of exactly the kind
// this program exists to catch. A rule with no `files:` glob at all isn't
// "stale" in this sense (there was never anything to excuse), so that case is
// left to check 6 rather than reported here.
export function checkStaleOptOuts(rules: RuleFile[], globHasMatch: GlobHasMatch): Failure[] {
  const failures: Failure[] = []
  for (const rule of rules) {
    if (!isStaleOptOut(rule, globHasMatch)) continue
    const reason = rule.unresolvedFilesMarker.reason
    failures.push({
      check: 'stale-allow-unresolved-files',
      file: rule.path,
      message: `every \`files:\` glob now resolves -- the allow-unresolved-files marker (reason: "${reason}") is stale and should be deleted`,
    })
  }
  return failures
}

export function checkAllRules(rules: RuleFile[], fixtures: FixtureFile[], globHasMatch: GlobHasMatch): Failure[] {
  return [
    ...checkAnyRulesFound(rules),
    ...checkFixtureExists(rules, fixtures),
    ...checkIdMatchesFilename(rules),
    ...checkNoDuplicateIds(rules),
    ...checkSeverityValid(rules),
    ...checkFixtureHasInvalidCases(fixtures),
    ...checkFilesGlobsResolve(rules, globHasMatch),
    ...checkFixtureIdMatchesFilename(fixtures),
    ...checkStaleOptOuts(rules, globHasMatch),
  ]
}
