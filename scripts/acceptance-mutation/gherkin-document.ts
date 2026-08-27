// The sole @cucumber/* importer in this program -- see
// rules/no-cucumber-parser-outside-adapter.yml, which enforces exactly this
// from the other direction. Every other module in scripts/acceptance-mutation
// deals in the AST node types re-exported below, or in MutationSite/TextSpan
// (a later step), and never imports @cucumber/gherkin or @cucumber/messages
// directly.
//
// The coupling this module owns is real, not incidental: @cucumber/gherkin is
// the parser that locates spans in a feature file, and it is also the parser
// `playwright-bdd` (via bddgen) uses to turn a written mutant .feature back
// into the spec run.ts actually executes. Both are the same deduped copy of
// @cucumber/gherkin@39.1.0 today (see package.json) -- a mutant this module
// locates a span in is guaranteed to be read back the same way at generation
// time, because there is exactly one parser in the dependency graph. A second
// importer, or a second major version, would break that guarantee silently.
//
// Parser construction (AstBuilder + GherkinClassicTokenMatcher) is the
// library's own low-level API -- there is no single "parse a string" export.
// generateMessages/Query, which playwright-bdd's own loader uses, additionally
// computes pickles (compiled, tag-resolved test cases) and Cucumber message
// envelopes, neither of which this program needs; the raw Parser gives back a
// GherkinDocument directly with locations already resolved, so it's used
// here instead.
import { AstBuilder, Errors, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type * as messages from '@cucumber/messages'

// Re-exported so a consumer never needs its own @cucumber/messages import to
// name an AST node type -- widen this list rather than let a consumer reach
// around the adapter (see the ast-grep rule's own note).
export type {
  Background,
  DataTable,
  DocString,
  Examples,
  Feature,
  FeatureChild,
  GherkinDocument,
  Location,
  Rule,
  RuleChild,
  Scenario,
  Step,
  TableCell,
  TableRow,
  Tag,
} from '@cucumber/messages'

// @cucumber/gherkin's own parse errors -- GherkinException and its
// subclasses (ParserException, CompositeParserException, ...), which the
// library groups under one `Errors` namespace rather than exporting
// individually. Re-exported by name here so a caller can narrow a caught
// error (`instanceof CompositeParserException`) without importing
// @cucumber/gherkin itself.
export const { CompositeParserException, GherkinException, ParserException } = Errors

// A parsed feature file: the original text (so a caller can re-render without
// re-reading the file), the same text split into lines (matching the
// 0-based-`lineIndex` convention the rest of this program already uses,
// derived once here rather than by every caller), and the raw AST.
export interface FeatureDocument {
  text: string
  lines: string[]
  doc: messages.GherkinDocument
}

// Parses one feature file's text into its AST. Throws (an @cucumber/gherkin
// GherkinException, most commonly CompositeParserException) on malformed
// Gherkin -- deliberately not caught here. This module locates spans, it does
// not decide what to do when a file can't be parsed at all; that decision
// belongs to the caller, which has the target name to attach to the error
// (see run.ts).
export function parseFeature(text: string): FeatureDocument {
  const newId = IdGenerator.incrementing()
  const parser = new Parser(new AstBuilder(newId), new GherkinClassicTokenMatcher())
  const doc = parser.parse(text)
  return { text, lines: text.split(/\r?\n/), doc }
}

// Every Scenario node reachable from a feature -- both directly under the
// Feature and nested inside a Rule -- with its own steps, examples, and
// location intact. Returned as the real AST nodes rather than a
// cells-only projection: a future mutator over step text or a DocString
// needs the same steps a cell mutator needs the same Examples tables for, and
// a projection down to just cells here would mean re-parsing to get anything
// else back out.
//
// A Rule's own children live one level deeper than a Feature's -- split out
// so listScenarios' own cyclomatic complexity stays low without changing
// what either function does.
function scenariosInRule(rule: messages.Rule): messages.Scenario[] {
  const scenarios: messages.Scenario[] = []
  for (const ruleChild of rule.children) {
    if (ruleChild.scenario) scenarios.push(ruleChild.scenario)
  }
  return scenarios
}

// A Background carries no Scenario of its own and contributes nothing here.
// Rule nesting is the one place a walk over this AST cannot be "correct by
// accident" the way the old line-scanner incidentally was for Rule: blocks
// (it never looked for the keyword at all) -- recursing into
// `child.rule.children` (via scenariosInRule above) is the deliberate
// replacement for that accident.
export function listScenarios(doc: messages.GherkinDocument): messages.Scenario[] {
  const scenarios: messages.Scenario[] = []
  for (const child of doc.feature?.children ?? []) {
    if (child.scenario) scenarios.push(child.scenario)
    if (child.rule) scenarios.push(...scenariosInRule(child.rule))
  }
  return scenarios
}
