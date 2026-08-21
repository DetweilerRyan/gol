#!/usr/bin/env tsx
// Semantic checker over rules/*.yml + rule-tests/*.yml: the properties that
// make a rule's own "was it ever actually shown to fire" claim checkable --
// see checks.ts for what each check asserts and why.
//
// THIS ONE IS A GATE, unlike gherkin-dry-checker and halstead4ts. Those two
// are advisory because their output needs judgment (similarity heuristics, an
// unpublished score formula); every check here is a binary fact, so this
// process exits non-zero on any failure rather than always exiting 0.
//
// Rule files are discovered by globbing rules/*.yml, not by a hand-maintained
// list like gherkin-dry-checker's FEATURE_FILES -- a hand list would defeat
// the point: a new rule silently missing from it is exactly the drift this
// checker exists to catch.

import { globSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkAllRules, type Failure } from './checks.ts'
import { parseFixtureFile } from './fixture-file.ts'
import { parseRuleFile } from './rule-file.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')
const RULES_DIR = path.join(REPO_ROOT, 'rules')
const RULE_TESTS_DIR = path.join(REPO_ROOT, 'rule-tests')

function readYamlFiles(dir: string, relativeDir: string): { path: string; text: string }[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => ({
      path: `${relativeDir}/${name}`,
      text: readFileSync(path.join(dir, name), 'utf8'),
    }))
}

function printFailures(failures: Failure[]): void {
  console.log(`ast-grep rule check -- ${failures.length} failure(s):\n`)
  for (const failure of failures) {
    console.log(`[${failure.check}] ${failure.file}\n  ${failure.message}`)
  }
}

function main(): void {
  const rules = readYamlFiles(RULES_DIR, 'rules').map(({ path: filePath, text }) => parseRuleFile(filePath, text))
  const fixtures = readYamlFiles(RULE_TESTS_DIR, 'rule-tests').map(({ path: filePath, text }) =>
    parseFixtureFile(filePath, text),
  )
  const globHasMatch = (pattern: string): boolean => globSync(pattern, { cwd: REPO_ROOT }).length > 0

  const failures = checkAllRules(rules, fixtures, globHasMatch)

  if (failures.length === 0) {
    console.log(`ast-grep rule check -- ${rules.length} rules, ${fixtures.length} fixtures, no failures.`)
    process.exit(0)
  }

  printFailures(failures)
  process.exit(1)
}

main()
