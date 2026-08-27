// The one mutation-site finder/renderer pair this program has today: every
// data cell of every `Examples:` table reachable from a feature (directly
// under a Scenario Outline, or nested inside a Rule -- listScenarios already
// resolves that), mirroring the Acceptance Pipeline Specification's
// restriction that acceptance mutation touches only example cell values,
// never step text, keywords, or headers.
//
// This is the file a future step-text/DocString mutator is meant to sit
// beside, never inside: mutation-sites.ts's SITE_FINDERS/SITE_RENDERERS
// records are what wire a new file like this one in, and nothing here
// exports anything a second finder would need to import.
import { listScenarios, type Examples, type GherkinDocument, type TableRow } from './gherkin-document.ts'
import type { MutationSite } from './mutation-sites.ts'
import { escapeTableCell, findCellSpan, spliceSpan } from './text-span.ts'

const KIND = 'examples-cell' as const

// The seed key stays exactly `${featureFileName}:${rowIndex}:${columnName}`
// -- byte-identical to the pre-refactor key mutant-plan.ts used to build
// itself. rowIndex is per-table, not per-file (cell-life-and-death's second
// Examples table restarts at 0), which is what makes uniqueness rest on the
// two tables never sharing a column name. That's no longer merely assumed:
// mutation-sites.ts's listMutationSites calls assertUniqueSeedKeys as its
// last step, over every site of every kind, and throws naming the
// colliding keys and lines if it's ever violated.
//
// A content-addressed key (hashing the row, or the row plus column, instead
// of using its position) was considered and rejected, measured against
// cell-life-and-death.feature: deleting a row moves 9 of 25 mutant values
// under this positional key vs 0 of 25 content-addressed -- a real
// advantage -- but editing a single cell moves only 1 of 28 values here vs
// 3 of 28 content-addressed, because a row hash covers every sibling cell
// in that row, not just the edited one. Cell edits are the commoner
// `product` action; the prune case moves the count either way, which is all
// anything downstream compares (nothing persists a mutant list for a
// before/after diff to run against); and two identical rows -- see
// mutation-sites.test.ts's "does not throw on two identical rows" case --
// would hash alike and collapse two distinct sites into one mutant,
// reintroducing the exact collision content-addressing was meant to close.
// A hash would also make the seedKey unreadable as the report's own `Site`
// column. Positional stays the design; this comment is what stops the
// option being re-proposed once its idea file is gone.
//
// One of those reasons is a fact about today rather than a principle, so
// re-open this on exactly that trigger: if this program ever persists a
// mutant list (the way gherkin-dry-checker writes reports/gherkin-dry/report.json),
// a before/after diff across a prune becomes something a reader can
// actually run, and the 9-of-25 row above turns from a curiosity into a
// real cost -- at which point the prune stability content-addressing buys
// is worth re-weighing. The other objections are unaffected and
// content-addressing still has to answer them: two identical rows would
// still collapse into one mutant, and the `Site` column would still be a
// hash.
function seedKeyFor(featureFileName: string, rowIndex: number, columnName: string): string {
  return `${featureFileName}:${rowIndex}:${columnName}`
}

// An Examples node with no `tableHeader` at all -- heading followed by
// nothing, by end of file, or by non-table prose -- is not a table. A
// *titled* `Examples: named` heading is unaffected either way; only the
// presence of a table under it decides whether its rows are mutable.
function sitesForTable(examples: Examples, lines: string[], featureFileName: string): MutationSite[] {
  if (!examples.tableHeader) return []
  const header = examples.tableHeader.cells.map((cell) => cell.value)
  const sites: MutationSite[] = []
  examples.tableBody.forEach((row: TableRow, rowIndex: number) => {
    const lineIndex = row.location.line - 1
    const rawLine = lines[lineIndex]
    row.cells.forEach((cell, columnIndex) => {
      const startColumn = (cell.location.column ?? 1) - 1
      sites.push({
        kind: KIND,
        seedKey: seedKeyFor(featureFileName, rowIndex, header[columnIndex]),
        value: cell.value,
        span: findCellSpan(rawLine, lineIndex, startColumn),
      })
    })
  })
  return sites
}

export function findExamplesCellSites(doc: GherkinDocument, lines: string[], featureFileName: string): MutationSite[] {
  const sites: MutationSite[] = []
  for (const scenario of listScenarios(doc)) {
    for (const examples of scenario.examples) {
      sites.push(...sitesForTable(examples, lines, featureFileName))
    }
  }
  return sites
}

// Splices the mutated value directly into the site's own span, escaping it
// first the same way Gherkin itself escapes a table cell on the way in (see
// text-span.ts's findCellSpan for the read side of the same convention).
// This touches exactly the bytes the span covers -- never a sibling cell,
// never the row's column padding, never a second line -- which is the whole
// point of carrying a byte-precise span on the site instead of a row index:
// a full-table AST re-render would re-pad every cell to the new widest
// value (measured by architect: more than one line changes for every one of
// the 55 real mutants, one as high as 10, wherever Pulsar's own row is
// touched), where this changes exactly the one line the span lives on, and
// nothing else on it beyond the span itself.
export function renderExamplesCellSite(featureText: string, site: MutationSite, mutatedValue: string): string {
  return spliceSpan(featureText, site.span, escapeTableCell(mutatedValue))
}
