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
import { findCellSpan } from './text-span.ts'

const KIND = 'examples-cell' as const

// The seed key stays exactly `${featureFileName}:${rowIndex}:${columnName}`
// -- byte-identical to the pre-refactor key mutant-plan.ts used to build
// itself. rowIndex is per-table, not per-file (cell-life-and-death's second
// Examples table restarts at 0), which is what makes uniqueness rest on the
// two tables never sharing a column name -- true today, not re-verified
// here; replicating the old key exactly is the point, not improving it.
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

// --- Rendering (step 3: row-rewrite, byte-identical to the pre-refactor
// applyMutation; see mutant-parity-jig.test.ts) -----------------------------
//
// This whole section is deliberately temporary. It exists only so the site
// abstraction lands with zero change to the mutant bytes this program has
// already produced, which is what mutant-parity-jig.test.ts pins. The next
// step replaces it with a direct spliceSpan + escapeTableCell call that
// needs none of the row-reconstruction below, because a splice needs only
// the site's own span -- not its siblings, and not a column index.

function splitTableRow(line: string): string[] {
  const trimmed = line.trim()
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map((cell) => cell.trim())
}

function renderTableRow(cells: string[]): string {
  return `      | ${cells.join(' | ')} |`
}

// The old applyMutation took a MutableCell carrying its own columnIndex
// directly; a MutationSite deliberately doesn't, so this reconstructs it by
// counting `|` characters before the span's own start column. Ignores
// escaping the same way the old splitTableRow already did (a raw split on
// every `|`), which is fine only because no real feature file today
// contains an escaped pipe -- and irrelevant the moment step 4 deletes this
// whole section.
function columnIndexAtStart(line: string, startColumn: number): number {
  let pipes = 0
  for (let i = 0; i < startColumn; i++) {
    if (line[i] === '|') pipes++
  }
  return pipes - 1
}

export function renderExamplesCellSite(featureText: string, site: MutationSite, mutatedValue: string): string {
  const lines = featureText.split(/\r?\n/)
  const rawLine = lines[site.span.line]
  const originalRow = splitTableRow(rawLine)
  const columnIndex = columnIndexAtStart(rawLine, site.span.startColumn)
  const mutatedRow = originalRow.map((value, i) => (i === columnIndex ? mutatedValue : value))
  lines[site.span.line] = renderTableRow(mutatedRow)
  return lines.join('\n')
}
