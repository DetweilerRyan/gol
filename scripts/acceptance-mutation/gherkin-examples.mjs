// Finds `Examples:` tables in raw Gherkin text and produces mutated copies
// of the full file with exactly one example cell changed -- mirroring the
// Acceptance Pipeline Specification's restriction that acceptance mutation
// touches only example cell values, never step text, keywords, or headers.

function splitTableRow(line) {
  const trimmed = line.trim()
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map((cell) => cell.trim())
}

export function findExamplesTables(featureText) {
  const lines = featureText.split(/\r?\n/)
  const tables = []

  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*Examples:\s*$/.test(lines[i])) continue

    let headerLine = i + 1
    while (headerLine < lines.length && lines[headerLine].trim() === '') headerLine++
    if (headerLine >= lines.length || !lines[headerLine].trim().startsWith('|')) continue

    const header = splitTableRow(lines[headerLine])
    const rows = []
    let rowLine = headerLine + 1
    while (rowLine < lines.length && lines[rowLine].trim().startsWith('|')) {
      rows.push({ lineIndex: rowLine, cells: splitTableRow(lines[rowLine]) })
      rowLine++
    }

    tables.push({ header, headerLineIndex: headerLine, rows })
  }

  return tables
}

export function listMutableCells(featureText) {
  const cells = []
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

export function renderTableRow(cells) {
  return `      | ${cells.join(' | ')} |`
}

export function applyMutation(featureText, cell, mutatedValue) {
  const lines = featureText.split(/\r?\n/)
  const originalRow = splitTableRow(lines[cell.lineIndex])
  const mutatedRow = originalRow.map((value, i) => (i === cell.columnIndex ? mutatedValue : value))
  lines[cell.lineIndex] = renderTableRow(mutatedRow)
  return lines.join('\n')
}
