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
// decide() -- the pure rules/fixtures/failures -> {exitCode, lines} decision,
// including parsing raw file text and catching parse errors -- lives at the
// bottom of this file so run.ts's I/O shell (recursive directory reads,
// console.log, process.exit) has a single pure function to call into and a
// test can pin its exit code without touching the filesystem.

import { parseFixtureFile, type FixtureFile } from './fixture-file.ts'
import { parseRuleFile, type RuleFile } from './rule-file.ts'

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

// One rule's contribution to check 6, kept separate from the list-level
// flatMap in checkFilesGlobsResolve below. A marker present *with* a reason
// suppresses both the no-reason failure and the glob check below it -- any
// other combination (no marker, or a marker with no reason) runs the glob
// check as normal.
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
    const expectedId = fixture.filenameStem.replace(/-test$/, '')
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

// Check 9: an `allow-unresolved-files` marker whose reason no longer applies.
// The marker is meant to be temporary (see check 6's reason requirement) --
// once every `files:` glob it was excusing actually resolves, the marker
// keeps suppressing check 6 for no reason, which is drift of exactly the kind
// this program exists to catch. A rule with no `files:` glob at all isn't
// "stale" in this sense (there was never anything to excuse), so that case is
// left to check 6 rather than reported here.
export function checkStaleOptOuts(rules: RuleFile[], globHasMatch: (pattern: string) => boolean): Failure[] {
  const failures: Failure[] = []
  for (const rule of rules) {
    const marker = rule.unresolvedFilesMarker
    if (!marker.present || !marker.reason) continue
    const files = rule.files ?? []
    if (files.length === 0) continue
    if (!files.every((pattern) => globHasMatch(pattern))) continue
    failures.push({
      check: 'stale-allow-unresolved-files',
      file: rule.path,
      message: `every \`files:\` glob now resolves -- the allow-unresolved-files marker (reason: "${marker.reason}") is stale and should be deleted`,
    })
  }
  return failures
}

export function checkAllRules(
  rules: RuleFile[],
  fixtures: FixtureFile[],
  globHasMatch: (pattern: string) => boolean,
): Failure[] {
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

// A rule or fixture file's path plus its unparsed text -- what run.ts has
// after reading a file off disk, before either parser has looked at it.
export interface RawFile {
  path: string
  text: string
}

export interface DecideResult {
  exitCode: number
  lines: string[]
}

// ast-grep 0.45.1 accepts multi-document (`---`-separated) rule and fixture
// files, but `yaml`'s parse() throws `Source contains multiple documents` on
// them -- and since parseRuleFile/parseFixtureFile only receive text, an
// uncaught throw here would surface as a stack trace with no filename. This
// wraps a single file's parse so that failure becomes an ordinary Failure
// record instead, naming the file it came from.
function safeParse<T>(
  file: RawFile,
  parse: (path: string, text: string) => T,
): { parsed: T; failure?: undefined } | { parsed?: undefined; failure: Failure } {
  try {
    return { parsed: parse(file.path, file.text) }
  } catch (error) {
    return {
      failure: {
        check: 'parse',
        file: file.path,
        message: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

function partitionParsed<T>(
  files: RawFile[],
  parse: (path: string, text: string) => T,
): { parsed: T[]; failures: Failure[] } {
  const parsed: T[] = []
  const failures: Failure[] = []
  for (const file of files) {
    const result = safeParse(file, parse)
    if (result.failure) failures.push(result.failure)
    else parsed.push(result.parsed)
  }
  return { parsed, failures }
}

function formatLines(rules: RuleFile[], fixtures: FixtureFile[], failures: Failure[]): string[] {
  if (failures.length === 0) {
    return [`ast-grep rule check -- ${rules.length} rules, ${fixtures.length} fixtures, no failures.`]
  }
  return [
    `ast-grep rule check -- ${failures.length} failure(s):`,
    '',
    ...failures.flatMap((failure) => [`[${failure.check}] ${failure.file}`, `  ${failure.message}`]),
  ]
}

// The whole program's decision, as one pure function: parse every rule/
// fixture file (catching parse errors rather than throwing), run every check
// over what parsed, and turn the result into an exit code plus the exact
// lines to print. run.ts's job shrinks to gathering RawFile[] off disk
// (recursively, per sgconfig.yml) and handing them here -- which is what lets
// a test pin the exit code without touching the filesystem.
export function decide(
  ruleFiles: RawFile[],
  fixtureFiles: RawFile[],
  globHasMatch: (pattern: string) => boolean,
): DecideResult {
  const { parsed: rules, failures: ruleParseFailures } = partitionParsed(ruleFiles, parseRuleFile)
  const { parsed: fixtures, failures: fixtureParseFailures } = partitionParsed(fixtureFiles, parseFixtureFile)

  const failures = [...ruleParseFailures, ...fixtureParseFailures, ...checkAllRules(rules, fixtures, globHasMatch)]

  return {
    exitCode: failures.length === 0 ? 0 : 1,
    lines: formatLines(rules, fixtures, failures),
  }
}
