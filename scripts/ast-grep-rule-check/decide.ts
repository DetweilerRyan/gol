// The whole program's decision as one pure function: parse every rule/fixture
// file (catching parse errors rather than throwing), run every check in
// checks.ts over what parsed, and turn the result into an exit code plus the
// exact lines to print. run.ts's job shrinks to gathering RawFile[] off disk
// (recursively, per sgconfig.yml) and handing them to decide() here -- which
// is what lets a test pin the exit code without touching the filesystem.
//
// Split out of checks.ts: this file is the orchestration (parsing, batching
// parse failures, formatting output) around the nine checks, not a check
// itself -- keeping it separate keeps checks.ts a flat list of the checks
// CLAUDE.md describes, one per exported function.

import { checkAllRules, type Failure, type GlobHasMatch } from './checks.ts'
import { parseFixtureFile, type FixtureFile } from './fixture-file.ts'
import { parseRuleFile, type RuleFile } from './rule-file.ts'

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

// One rule or fixture file's parse: either the value it parsed to, or the
// Failure explaining why it didn't. Named rather than spelled inline at
// safeParse and partitionParsed both -- which also keeps those signatures to
// one line each, sidestepping crap4ts's multi-line-signature artifact (see
// CLAUDE.md's note on it, since a future edit that wraps one of these will
// make a fully covered function report 0%).
type ParseResult<T> = { parsed: T; failure?: undefined } | { parsed?: undefined; failure: Failure }

// parseRuleFile/parseFixtureFile's shared shape: a relative path plus raw
// text in, a parsed record out. Both safeParse and partitionParsed take one.
type ParseFn<T> = (path: string, text: string) => T

// ast-grep 0.45.1 accepts multi-document (`---`-separated) rule and fixture
// files, but `yaml`'s parse() throws `Source contains multiple documents` on
// them -- and since parseRuleFile/parseFixtureFile only receive text, an
// uncaught throw here would surface as a stack trace with no filename. This
// wraps a single file's parse so that failure becomes an ordinary Failure
// record instead, naming the file it came from.
function safeParse<T>(file: RawFile, parse: ParseFn<T>): ParseResult<T> {
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

// The parsed values and the parse failures a batch of raw files produced.
type PartitionResult<T> = { parsed: T[]; failures: Failure[] }

function partitionParsed<T>(files: RawFile[], parse: ParseFn<T>): PartitionResult<T> {
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

export function decide(ruleFiles: RawFile[], fixtureFiles: RawFile[], globHasMatch: GlobHasMatch): DecideResult {
  const { parsed: rules, failures: ruleParseFailures } = partitionParsed(ruleFiles, parseRuleFile)
  const { parsed: fixtures, failures: fixtureParseFailures } = partitionParsed(fixtureFiles, parseFixtureFile)

  const failures = [...ruleParseFailures, ...fixtureParseFailures, ...checkAllRules(rules, fixtures, globHasMatch)]

  return {
    exitCode: failures.length === 0 ? 0 : 1,
    lines: formatLines(rules, fixtures, failures),
  }
}
