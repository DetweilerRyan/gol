// Formats FTA's per-file analysis results into a plain-text table, mirroring
// crap4ts's table so the two reports read consistently when run back to
// back. Pure/no I/O so it's unit-testable without shelling out to the fta
// binary -- see run.ts for the part that actually calls it.

import type { AnalyzedFile } from 'fta-cli'

// One row of the report: fta-cli's own per-file analysis plus the repo-relative
// path run.ts fills in (fta-cli leaves file_name empty when handed a single
// file rather than a directory to walk). `analysis` is null when fta-cli
// returns no result at all -- it does this for any file under its size floor
// (measured: <=6 code lines skipped, 7 analyzed; comment lines don't count)
// rather than erroring, so run.ts can't just dereference the result.
export interface FileResult {
  file: string
  analysis: AnalyzedFile | null
}

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

const NOT_SCORED_ASSESSMENT = 'not scored (under FTA size floor)'

function buildRow(result: FileResult): string[] {
  if (result.analysis === null) {
    return [result.file, '-', '-', '-', '-', '-', '-', NOT_SCORED_ASSESSMENT]
  }
  const { analysis } = result
  return [
    result.file,
    String(analysis.cyclo),
    formatNumber(analysis.halstead.volume, 1),
    formatNumber(analysis.halstead.difficulty, 1),
    formatNumber(analysis.halstead.effort, 1),
    formatNumber(analysis.halstead.bugs, 2),
    formatNumber(analysis.fta_score, 1),
    analysis.assessment,
  ]
}

const HEADER = ['File', 'CC', 'Volume', 'Difficulty', 'Effort', 'Bugs', 'FTA', 'Assessment']

export function buildReport(results: FileResult[]): string {
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
