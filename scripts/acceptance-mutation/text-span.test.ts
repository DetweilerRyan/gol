import { describe, expect, it } from 'vitest'
import { parseFeature, type TableCell } from './gherkin-document.ts'
import { escapeTableCell, findCellSpan, spliceSpan } from './text-span.ts'

describe('spliceSpan', () => {
  it('replaces only the covered bytes, leaving the rest of the line untouched', () => {
    const text = 'a\nbcdef\ng'
    const result = spliceSpan(text, { line: 1, startColumn: 1, endColumn: 4 }, 'XY')
    expect(result).toBe('a\nbXYf\ng')
  })

  it('leaves every other line byte-identical', () => {
    const text = 'one\ntwo\nthree'
    const result = spliceSpan(text, { line: 2, startColumn: 0, endColumn: 3 }, 'THR')
    expect(result.split('\n')).toEqual(['one', 'two', 'THRee'])
  })

  it('inserts at a zero-width span without deleting anything', () => {
    const result = spliceSpan('ab', { line: 0, startColumn: 1, endColumn: 1 }, 'X')
    expect(result).toBe('aXb')
  })

  it('can shrink or grow the line when the replacement length differs from the span', () => {
    expect(spliceSpan('a bbbb c', { line: 0, startColumn: 2, endColumn: 6 }, 'X')).toBe('a X c')
    expect(spliceSpan('a b c', { line: 0, startColumn: 2, endColumn: 3 }, 'XXXX')).toBe('a XXXX c')
  })
})

describe('findCellSpan', () => {
  it('stops at the next unescaped pipe and trims trailing padding', () => {
    const line = '      | input   | output |'
    const span = findCellSpan(line, 3, 8)
    expect(line.slice(span.startColumn, span.endColumn)).toBe('input')
    expect(span).toEqual({ line: 3, startColumn: 8, endColumn: 13 })
  })

  it('treats an escaped pipe (\\|) as literal content, not a cell boundary', () => {
    const line = '      | esc\\|pe | six    |'
    const span = findCellSpan(line, 0, 8)
    expect(line.slice(span.startColumn, span.endColumn)).toBe('esc\\|pe')
  })

  it('treats an escaped backslash (\\\\) as a two-character skip, not a lone escape', () => {
    // "a\\|b" raw is a literal backslash followed by "|b" -- the escaped
    // backslash must consume its own pair so the very next character is read
    // as ordinary content, not as the second half of some other escape.
    const line = '      | a\\\\|b |'
    const span = findCellSpan(line, 0, 8)
    expect(line.slice(span.startColumn, span.endColumn)).toBe('a\\\\')
  })

  it('handles a zero-width (empty) cell, per the location probe below', () => {
    const line = '      |         | seven  |'
    const span = findCellSpan(line, 0, 16)
    expect(span).toEqual({ line: 0, startColumn: 16, endColumn: 16 })
    expect(line.slice(span.startColumn, span.endColumn)).toBe('')
  })
})

describe('escapeTableCell', () => {
  it('escapes a literal backslash before a literal pipe, so a double-escape cannot occur', () => {
    expect(escapeTableCell('a\\b')).toBe('a\\\\b')
    expect(escapeTableCell('a|b')).toBe('a\\|b')
    expect(escapeTableCell('a\\|b')).toBe('a\\\\\\|b')
  })

  it('leaves an already-safe value untouched', () => {
    expect(escapeTableCell('plain value')).toBe('plain value')
  })
})

// Shared drill-down for the two probes below: parse a one-scenario,
// one-Examples-table sample and hand back its raw lines plus the first data
// row's cells, so each probe states only what's specific to it (the sample
// text and the assertion) rather than repeating the walk down to a cell.
function firstRowCells(sample: string): { lines: string[]; cells: readonly TableCell[] } {
  const { doc, lines } = parseFeature(sample)
  const [scenario] = doc.feature!.children.map((c) => c.scenario!)
  const [examples] = scenario.examples
  return { lines, cells: examples.tableBody[0].cells }
}

// Pins the two facts findCellSpan's own comment relies on, straight from
// @cucumber/gherkin@39.1.0 (the same parser gherkin-document.ts wraps):
// TableCell.location.column is 1-based and points at the first character of
// the *unescaped* value (never at leading padding), and an empty cell's
// location points at the column immediately preceding the next `|`. If
// either fact ever changes upstream, findCellSpan's startColumn handling
// silently stops matching this parser's actual output -- this test is what
// would catch that.
describe('TableCell.location, as reported by the real parser', () => {
  it('points at the first character of the value, past any leading padding', () => {
    const { lines, cells } = firstRowCells(`Feature: F
  Scenario Outline: S
    Given <a>

    Examples:
      | a       | b    |
      | 2       | four |
`)
    const [cell] = cells
    expect(cell.location.column).toBe(9)
    const rawLine = lines[cell.location.line - 1]
    expect(rawLine[cell.location.column! - 1]).toBe('2')
  })

  it('points at the closing pipe for a fully empty cell, which findCellSpan reads as a zero-width span', () => {
    const { lines, cells } = firstRowCells(`Feature: F
  Scenario Outline: S
    Given <a>

    Examples:
      | a  | b     |
      |    | seven |
`)
    const [emptyCell] = cells
    const rawLine = lines[emptyCell.location.line - 1]
    expect(rawLine[emptyCell.location.column! - 1]).toBe('|')
  })
})
