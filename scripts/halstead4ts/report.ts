// Formats FTA's per-file analysis results into a plain-text table, mirroring
// crap4ts's table so the two reports read consistently when run back to
// back. Pure/no I/O so it's unit-testable without shelling out to the fta
// binary -- see run.ts for the part that actually calls it.

import type { AnalyzedFile } from 'fta-cli'

// One row of the report: fta-cli's own per-file analysis plus the repo-relative
// path run.ts fills in (fta-cli leaves file_name empty when handed a single
// file rather than a directory to walk).
export interface FileAnalysis extends AnalyzedFile {
  file: string
}

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

function buildRow(result: FileAnalysis): string[] {
  return [
    result.file,
    String(result.cyclo),
    formatNumber(result.halstead.volume, 1),
    formatNumber(result.halstead.difficulty, 1),
    formatNumber(result.halstead.effort, 1),
    formatNumber(result.halstead.bugs, 2),
    formatNumber(result.fta_score, 1),
    result.assessment,
  ]
}

const HEADER = ['File', 'CC', 'Volume', 'Difficulty', 'Effort', 'Bugs', 'FTA', 'Assessment']

export function buildReport(results: FileAnalysis[]): string {
  const rows = results.map(buildRow)
  const widths = HEADER.map((title, i) => Math.max(title.length, ...rows.map((row) => row[i].length)))
  const formatRow = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ')

  const lines = [
    'Halstead complexity report (FTA) -- advisory, not a CI gate',
    '',
    formatRow(HEADER),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...rows.map(formatRow),
  ]
  return lines.join('\n')
}
