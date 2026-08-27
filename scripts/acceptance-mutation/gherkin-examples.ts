// Finds `Examples:` tables in raw Gherkin text and produces mutated copies
// of the full file with exactly one example cell changed -- mirroring the
// Acceptance Pipeline Specification's restriction that acceptance mutation
// touches only example cell values, never step text, keywords, or headers.
//
// Table location is delegated to gherkin-document.ts's AST adapter rather
// than scanned line-by-line -- see that module for why (the same parser
// playwright-bdd executes mutants with). This module's own job is narrower
// now: walk the AST down to Examples tables, and re-render one row at a time
// when applying a mutation (still line-based here; a later step moves
// `applyMutation` to a byte-span splice, but the public shape below --
// `ExamplesRow`/`ExamplesTable`/`MutableCell` and this module's four
// exported functions -- is unaffected by that internal swap).
import { listScenarios, parseFeature, type Examples } from './gherkin-document.ts'

// One `| a | b |` data row of an Examples table, tagged with the 0-based line
// index it occupies in the original feature text so a mutant can rewrite that
// single line and leave the rest of the file byte-identical.
export interface ExamplesRow {
  lineIndex: number
  cells: string[]
}

export interface ExamplesTable {
  header: string[]
  headerLineIndex: number
  rows: ExamplesRow[]
}

// A single mutable example cell. `rowIndex`/`columnIndex` are positions within
// the table (used for the mutation seed key and the report), while `lineIndex`
// is the absolute line in the feature file that `applyMutation` rewrites.
export interface MutableCell {
  rowIndex: number
  columnIndex: number
  columnName: string
  lineIndex: number
  value: string
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim()
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map((cell) => cell.trim())
}

// An Examples node with no `tableHeader` at all -- heading followed by
// nothing, by end of file, or by non-table prose -- is not a table, the same
// way the old line-scanner's `findHeaderLine` returning null meant "skip
// this heading". A *titled* `Examples: named` heading is unaffected either
// way; only the presence of a table under it decides whether it is mutable.
function toExamplesTable(examples: Examples): ExamplesTable | null {
  if (!examples.tableHeader) return null
  return {
    header: examples.tableHeader.cells.map((cell) => cell.value),
    headerLineIndex: examples.tableHeader.location.line - 1,
    rows: examples.tableBody.map((row) => ({
      lineIndex: row.location.line - 1,
      cells: row.cells.map((cell) => cell.value),
    })),
  }
}

export function findExamplesTables(featureText: string): ExamplesTable[] {
  const { doc } = parseFeature(featureText)
  const tables: ExamplesTable[] = []
  for (const scenario of listScenarios(doc)) {
    for (const examples of scenario.examples) {
      const table = toExamplesTable(examples)
      if (table) tables.push(table)
    }
  }
  return tables
}

export function listMutableCells(featureText: string): MutableCell[] {
  const cells: MutableCell[] = []
  for (const table of findExamplesTables(featureText)) {
    table.rows.forEach((row, rowIndex) => {
      row.cells.forEach((value, columnIndex) => {
        cells.push({
          rowIndex,
          columnIndex,
          columnName: table.header[columnIndex],
          lineIndex: row.lineIndex,
          value,
        })
      })
    })
  }
  return cells
}

export function renderTableRow(cells: string[]): string {
  return `      | ${cells.join(' | ')} |`
}

export function applyMutation(featureText: string, cell: MutableCell, mutatedValue: string): string {
  const lines = featureText.split(/\r?\n/)
  const originalRow = splitTableRow(lines[cell.lineIndex])
  const mutatedRow = originalRow.map((value, i) => (i === cell.columnIndex ? mutatedValue : value))
  lines[cell.lineIndex] = renderTableRow(mutatedRow)
  return lines.join('\n')
}
