// Finds `Examples:` tables in raw Gherkin text and produces mutated copies
// of the full file with exactly one example cell changed -- mirroring the
// Acceptance Pipeline Specification's restriction that acceptance mutation
// touches only example cell values, never step text, keywords, or headers.

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

// Locates the `| a | b |` header row belonging to an `Examples:` heading,
// skipping any blank lines between the two. Returns null when the heading has
// no table under it at all (end of file, or a non-table line) -- a malformed
// outline we skip rather than fail on.
function findHeaderLine(lines: string[], examplesLineIndex: number): number | null {
  let headerLine = examplesLineIndex + 1
  while (headerLine < lines.length && lines[headerLine].trim() === '') headerLine++
  if (headerLine >= lines.length || !lines[headerLine].trim().startsWith('|')) return null
  return headerLine
}

function readTableAt(lines: string[], headerLineIndex: number): ExamplesTable {
  const rows: ExamplesRow[] = []
  let rowLine = headerLineIndex + 1
  while (rowLine < lines.length && lines[rowLine].trim().startsWith('|')) {
    rows.push({ lineIndex: rowLine, cells: splitTableRow(lines[rowLine]) })
    rowLine++
  }
  return { header: splitTableRow(lines[headerLineIndex]), headerLineIndex, rows }
}

export function findExamplesTables(featureText: string): ExamplesTable[] {
  const lines = featureText.split(/\r?\n/)
  const tables: ExamplesTable[] = []

  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*Examples:\s*$/.test(lines[i])) continue
    const headerLine = findHeaderLine(lines, i)
    if (headerLine === null) continue
    tables.push(readTableAt(lines, headerLine))
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
