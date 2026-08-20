import { describe, expect, it } from 'vitest'
import { buildReport, type FileAnalysis } from './report.ts'

// Shaped like fta-cli's real --json output for src/gameOfLife.ts, including
// the empty file_name it returns for a single-file path, plus the `file` field
// run.ts adds.
const SAMPLE_RESULT: FileAnalysis = {
  file: 'src/gameOfLife.ts',
  file_name: '',
  cyclo: 11,
  halstead: {
    uniq_operators: 21,
    uniq_operands: 74,
    total_operators: 199,
    total_operands: 413,
    program_length: 612,
    vocabulary_size: 95,
    volume: 4020.7516322985402,
    difficulty: 55.810810810810814,
    effort: 224401.4086674726,
    time: 12466.7449259707,
    bugs: 1.3402505440995134,
  },
  line_count: 245,
  fta_score: 59.159159323850076,
  assessment: 'Could be better',
}

describe('buildReport', () => {
  it('includes a row for every result, with the file name and assessment verbatim', () => {
    const report = buildReport([SAMPLE_RESULT])
    expect(report).toContain('src/gameOfLife.ts')
    expect(report).toContain('Could be better')
  })

  it('rounds Halstead volume/difficulty/effort/FTA score to 1 decimal and bugs to 2', () => {
    const report = buildReport([SAMPLE_RESULT])
    expect(report).toContain('4020.8')
    expect(report).toContain('55.8')
    expect(report).toContain('224401.4')
    expect(report).toContain('1.34')
    expect(report).toContain('59.2')
  })

  it('labels every column it prints', () => {
    const report = buildReport([SAMPLE_RESULT])
    for (const title of ['File', 'CC', 'Volume', 'Difficulty', 'Effort', 'Bugs', 'FTA', 'Assessment']) {
      expect(report).toContain(title)
    }
  })

  it('reports the file-level cyclomatic complexity from FTA, not per-function', () => {
    const report = buildReport([SAMPLE_RESULT])
    expect(report).toContain('11')
  })

  it('right-pads every column to the widest value or header, whichever is longer', () => {
    const report = buildReport([SAMPLE_RESULT])
    const lines = report.split('\n')
    const headerIndex = lines.findIndex((line) => line.startsWith('File'))
    const headerLine = lines[headerIndex]
    const separatorLine = lines[headerIndex + 1]
    expect(headerLine.length).toBe(separatorLine.length)
  })

  it('states up front that the report is advisory, not a CI gate', () => {
    const report = buildReport([SAMPLE_RESULT])
    expect(report).toContain('advisory')
  })

  it('renders one row per input result, in the given order', () => {
    const second = { ...SAMPLE_RESULT, file: 'src/viewport.ts', assessment: 'OK' }
    const report = buildReport([SAMPLE_RESULT, second])
    const gameOfLifeIndex = report.indexOf('src/gameOfLife.ts')
    const viewportIndex = report.indexOf('src/viewport.ts')
    expect(gameOfLifeIndex).toBeGreaterThan(-1)
    expect(viewportIndex).toBeGreaterThan(gameOfLifeIndex)
  })
})
