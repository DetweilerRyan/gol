import { describe, expect, it } from 'vitest'
import { parseValeFindings } from './vale-output.ts'

describe('parseValeFindings', () => {
  it('reads file and rule from a --output=line finding', () => {
    const out = 'vale-styles/fixtures/OneInstruction.bad.md:1:14:Procedure.OneInstruction:Two instructions chained.'
    expect(parseValeFindings(out)).toEqual([
      { file: 'vale-styles/fixtures/OneInstruction.bad.md', rule: 'Procedure.OneInstruction' },
    ])
  })

  it('keeps a message containing its own colons -- the split is bounded, not greedy', () => {
    const out = 'a.md:1:1:JsDoc.DeadIndexical:names a referent: it died with the session'
    expect(parseValeFindings(out)).toEqual([{ file: 'a.md', rule: 'JsDoc.DeadIndexical' }])
  })

  it('drops blank lines, summaries and diagnostics rather than reading them as findings', () => {
    const out = ['', '✖ 0 errors, 17 warnings and 0 suggestions in 26 files.', 'unknown flag: --nope'].join('\n')
    expect(parseValeFindings(out)).toEqual([])
  })

  it('returns nothing for output vale never produced -- the case run.ts guards separately', () => {
    expect(parseValeFindings('')).toEqual([])
  })

  it('reads several findings in report order', () => {
    const out = ['a.md:1:1:X.One:m', 'b.ts:9:4:Y.Two:m'].join('\n')
    expect(parseValeFindings(out).map((finding) => finding.rule)).toEqual(['X.One', 'Y.Two'])
  })
})

// Mutation-driven cases: a dropped anchor or a dropped trim leaves the parser
// reporting findings for files vale never named.
describe('parseValeFindings, shapes a looser parser would accept', () => {
  it('anchors the path, so a line with text before it is not read as a finding', () => {
    expect(parseValeFindings('note: a.md:1:1:X.One:m')).toEqual([{ file: 'note: a.md', rule: 'X.One' }])
  })

  it('reads an indented finding line, since output may be wrapped', () => {
    expect(parseValeFindings('   a.md:1:1:X.One:m')).toEqual([{ file: 'a.md', rule: 'X.One' }])
  })

  it('needs a multi-digit line number, not a single digit', () => {
    expect(parseValeFindings('a.md:123:45:X.One:m')).toEqual([{ file: 'a.md', rule: 'X.One' }])
  })

  it('needs both a style and a rule half, so a bare word is not a rule id', () => {
    expect(parseValeFindings('a.md:1:1:NotARuleId:m')).toEqual([])
  })
})
