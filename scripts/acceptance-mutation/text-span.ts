// Byte-level location and splicing over raw feature text, independent of any
// particular Gherkin node kind. This module knows nothing about Examples
// tables, scenarios, or steps -- it is the shared primitive a mutation site
// finder (examples-cell-sites.ts, and later a step-text/DocString sibling)
// uses to say exactly which bytes of the original file a mutant may touch,
// and the shared primitive a renderer uses to touch only those bytes.
//
// Deliberately parser-free: a TextSpan is plain line/column numbers, so this
// module never imports @cucumber/gherkin or @cucumber/messages (see
// rules/no-cucumber-parser-outside-adapter.yml, which scopes to
// gherkin-document.ts and would not even reach this file).

// A half-open range within one line of a FeatureDocument's `lines` array:
// `line` is the same 0-based index gherkin-document.ts's own convention uses
// (AST locations are 1-based; callers subtract 1 once, at the adapter
// boundary, and hand this module 0-based numbers throughout), and
// [startColumn, endColumn) is 0-based and exclusive on the end, so a
// zero-width span (startColumn === endColumn) is a valid insertion point
// rather than a special case.
export interface TextSpan {
  line: number
  startColumn: number
  endColumn: number
}

// Replaces exactly the bytes covered by `span` with `replacement`, leaving
// every other byte of `text` -- including every other line, and the
// untouched portion of the mutated line itself -- byte-identical. This is
// the whole reason a site abstraction is worth having: a renderer that only
// ever calls this needs no knowledge of the table (or step, or DocString)
// the span came from, and can never accidentally touch a sibling cell's
// column padding.
//
// Re-splits `text` on the same \r?\n gherkin-document.ts's own FeatureDocument
// uses, and re-joins with a bare '\n' -- matching the old line-based
// applyMutation's own behavior (see mutant-parity-jig.test.ts), not a new
// choice made here.
export function spliceSpan(text: string, span: TextSpan, replacement: string): string {
  const lines = text.split(/\r?\n/)
  const line = lines[span.line]
  lines[span.line] = line.slice(0, span.startColumn) + replacement + line.slice(span.endColumn)
  return lines.join('\n')
}

// Locates the raw (still-escaped) span of one table cell's content, given the
// 0-based column its *unescaped* value starts at -- exactly what
// TableCell.location reports (see gherkin-document.ts's re-exported
// `Location`), converted to 0-based by the caller. Gherkin escapes `|` inside
// a cell as `\|` and a literal backslash as `\\`; both consume two raw
// characters and must never be mistaken for the cell boundary, which is why
// this scans rather than just searching for the next `|`.
//
// The scan stops at the first *unescaped* `|` (or end of line, for a
// malformed table no caller here is expected to hand this), then trims
// trailing whitespace -- @cucumber/gherkin's own location already points past
// any *leading* whitespace (see the probe in text-span.test.ts), so only the
// trailing padding before the next `|` needs trimming here.
export function findCellSpan(line: string, lineIndex: number, startColumn: number): TextSpan {
  let i = startColumn
  while (i < line.length && line[i] !== '|') {
    i += line[i] === '\\' ? 2 : 1
  }
  let end = Math.min(i, line.length)
  while (end > startColumn && /\s/.test(line[end - 1])) end--
  return { line: lineIndex, startColumn, endColumn: end }
}

// The write side of the same escaping convention findCellSpan's scan reads:
// a literal backslash has to be escaped first (`\` -> `\\`), or a pipe
// escaped in the same pass would itself contain a backslash that a second
// pass would then re-escape -- the classic double-escape bug. Order matters;
// changing it is not a style choice.
export function escapeTableCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
}
