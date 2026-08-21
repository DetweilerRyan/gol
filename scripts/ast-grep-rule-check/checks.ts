// The six semantic checks over rules/*.yml + rule-tests/*.yml described in
// CLAUDE.md: mechanical facts that catch a rule matching nothing without
// anyone noticing (the failure mode two of this repo's six rules actually hit
// when first written). Every check here is a binary fact -- unlike
// gherkin-dry-checker and halstead4ts, this program is a gate, not advisory.
//
// Verified against ast-grep 0.45.1: an unresolved `files:` glob fails *open*
// (the rule silently checks nothing, exit 0) while an unresolved `ignores:`
// glob fails *safe* (the rule merely over-applies, which shows up as noisy
// findings). That asymmetry is why check 6 below covers `files:` only.

import type { FixtureFile } from './fixture-file.ts'
import type { RuleFile } from './rule-file.ts'

export interface Failure {
  check: string
  file: string
  message: string
}

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
    const expectedStem = `${rule.id}-test`
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
// covered by checkFixtureExists) -- split out of checkNoDuplicateIds purely
// to keep that function's own cyclomatic complexity under crap4ts's threshold.
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

// The glob half of check 6, split out purely to keep
// checkRuleFilesGlobsResolve's own cyclomatic complexity under crap4ts's
// threshold -- it has no opinion on the marker, only on `files:` globs.
function checkGlobsResolve(rule: RuleFile, globHasMatch: (pattern: string) => boolean): Failure[] {
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

// One rule's contribution to check 6, split out of checkFilesGlobsResolve to
// keep that function's own cyclomatic complexity under crap4ts's threshold.
// A marker present *with* a reason suppresses both the no-reason failure and
// the glob check below it -- any other combination (no marker, or a marker
// with no reason) runs the glob check as normal.
function checkRuleFilesGlobsResolve(rule: RuleFile, globHasMatch: (pattern: string) => boolean): Failure[] {
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
export function checkFilesGlobsResolve(rules: RuleFile[], globHasMatch: (pattern: string) => boolean): Failure[] {
  return rules.flatMap((rule) => checkRuleFilesGlobsResolve(rule, globHasMatch))
}

export function checkAllRules(
  rules: RuleFile[],
  fixtures: FixtureFile[],
  globHasMatch: (pattern: string) => boolean,
): Failure[] {
  return [
    ...checkFixtureExists(rules, fixtures),
    ...checkIdMatchesFilename(rules),
    ...checkNoDuplicateIds(rules),
    ...checkSeverityValid(rules),
    ...checkFixtureHasInvalidCases(fixtures),
    ...checkFilesGlobsResolve(rules, globHasMatch),
  ]
}
