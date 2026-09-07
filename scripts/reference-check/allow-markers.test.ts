import { describe, expect, it } from 'vitest'
import { extractAllowMarkers, isAllowMarkerLine, isCommentLine } from './allow-markers.ts'

describe('isCommentLine', () => {
  it('recognises //, #, *, and /* leaders after leading whitespace', () => {
    expect(isCommentLine('// x')).toBe(true)
    expect(isCommentLine('# x')).toBe(true)
    expect(isCommentLine('  * x')).toBe(true)
    expect(isCommentLine('/* x')).toBe(true)
  })

  it('is false for a code line, including one that starts with a string literal', () => {
    expect(isCommentLine('const x = "// not a comment"')).toBe(false)
    expect(isCommentLine("  '// reference-check: allow foo.ts',")).toBe(false)
  })
})

describe('isAllowMarkerLine', () => {
  it('recognises the marker inside a `//` comment', () => {
    expect(isAllowMarkerLine('// reference-check: allow cellLattice.ts -- deleted, kept as a search key')).toBe(true)
  })

  it('recognises the marker inside a `#` comment', () => {
    expect(isAllowMarkerLine('# reference-check: allow no-foo.yml -- placeholder path')).toBe(true)
  })

  it('recognises the marker inside a `*` JSDoc continuation line', () => {
    expect(isAllowMarkerLine(' * reference-check: allow Cache.ts -- renamed, tracked separately')).toBe(true)
  })

  it('recognises the marker inside an HTML comment', () => {
    expect(isAllowMarkerLine('<!-- reference-check: allow src/a.ts -- hypothetical path -->')).toBe(true)
  })

  it('is false for an ordinary comment line', () => {
    expect(isAllowMarkerLine('// this file has nothing to do with any marker')).toBe(false)
  })
})

describe('extractAllowMarkers', () => {
  it('extracts the token and reason from a `//` marker on the source surface', () => {
    const markers = extractAllowMarkers(
      '// reference-check: allow cellLattice.ts -- deleted by slice/collapse-dead-cell-layer\n',
      'source',
    )
    expect(markers).toEqual([{ token: 'cellLattice.ts', reason: 'deleted by slice/collapse-dead-cell-layer', line: 1 }])
  })

  it('keeps a reason that itself contains " -- " rather than truncating at the first occurrence', () => {
    const markers = extractAllowMarkers(
      '// reference-check: allow src/a.ts -- hypothetical --mutate argument, not a real path\n',
      'source',
    )
    expect(markers[0].reason).toBe('hypothetical --mutate argument, not a real path')
  })

  it('strips a trailing HTML comment closer from the reason', () => {
    const markers = extractAllowMarkers('<!-- reference-check: allow src/a.ts -- hypothetical path -->\n', 'doc')
    expect(markers[0].reason).toBe('hypothetical path')
  })

  it('strips a trailing block-comment closer from the reason', () => {
    const markers = extractAllowMarkers('/* reference-check: allow src/a.ts -- hypothetical path */\n', 'source')
    expect(markers[0].reason).toBe('hypothetical path')
  })

  // Mutation regression: stripTrailingCommentCloser's two regexes are
  // `\s*$` (zero-or-more *whitespace*), not `\S*$` (non-whitespace) --
  // easy to conflate, and every other fixture here happens to have the
  // closer sitting at the true end of the raw line, where the two read
  // identically. Whitespace trailing the closer itself is what tells them
  // apart.
  it('strips a trailing HTML/block comment closer even when whitespace trails it', () => {
    expect(
      extractAllowMarkers('<!-- reference-check: allow src/a.ts -- hypothetical path -->  \n', 'doc')[0].reason,
    ).toBe('hypothetical path')
    expect(
      extractAllowMarkers('/* reference-check: allow src/a.ts -- hypothetical path */  \n', 'source')[0].reason,
    ).toBe('hypothetical path')
  })

  // Mutation regression: both regexes are anchored to the end of the
  // reason (`$`) so only the *real* trailing closer is stripped -- a
  // reason that itself mentions the closer's punctuation earlier (a
  // renamed-to arrow, a stray `*/`) must survive.
  it('strips only the real trailing closer, not an earlier occurrence inside the reason', () => {
    expect(extractAllowMarkers('<!-- reference-check: allow src/a.ts -- renamed A --> B -->\n', 'doc')[0].reason).toBe(
      'renamed A --> B',
    )
    expect(extractAllowMarkers('/* reference-check: allow src/a.ts -- see A */ B */\n', 'source')[0].reason).toBe(
      'see A */ B',
    )
  })

  // Mutation regression: every other fixture here uses exactly one space
  // at each of the marker grammar's four whitespace positions (after the
  // `:`, before the token, and on both sides of `--`), which reads
  // identically whether the regex requires "one" (`\s`) or "one or more"
  // (`\s+`/`\s*`) at that spot. Doubling the whitespace everywhere at once
  // is what actually exercises the `+`/`*` quantifiers rather than the
  // literal characters around them.
  it('tolerates extra whitespace at every position in the marker grammar', () => {
    const markers = extractAllowMarkers('// reference-check:  allow  foo.ts  --  reason with extra spacing\n', 'source')
    expect(markers).toEqual([{ token: 'foo.ts', reason: 'reason with extra spacing', line: 1 }])
  })

  it('reports a null reason when the marker carries none', () => {
    const markers = extractAllowMarkers('// reference-check: allow cellLattice.ts\n', 'source')
    expect(markers[0].reason).toBeNull()
  })

  it('reports one marker per matching line, in line order', () => {
    const text = [
      '// reference-check: allow foo.ts -- first reason',
      'const x = 1',
      '// reference-check: allow bar.ts -- second reason',
    ].join('\n')
    const markers = extractAllowMarkers(text, 'source')
    expect(markers.map((marker) => marker.token)).toEqual(['foo.ts', 'bar.ts'])
    expect(markers.map((marker) => marker.line)).toEqual([1, 3])
  })

  it('returns nothing when the text carries no marker', () => {
    expect(extractAllowMarkers('// just a normal comment\n', 'source')).toEqual([])
  })

  // Regression: dogfooding this checker against its own test suite found
  // that a .test.ts fixture string shaped like a marker -- test *data*, not
  // a real comment -- was being read as a live opt-out, because the first
  // version of this function scanned every raw line rather than only
  // comment lines on the source surface.
  it('ignores a marker-shaped string literal on a non-comment source line', () => {
    const text = "  const fixture = '// reference-check: allow cellLattice.ts -- not a real marker'\n"
    expect(extractAllowMarkers(text, 'source')).toEqual([])
  })

  it('still recognises a marker-shaped line on the doc surface even with no comment leader', () => {
    // Markdown prose has no universal "this is a comment" leader, so every
    // line is a candidate on the doc surface -- see scannableLinesOf.
    const markers = extractAllowMarkers('reference-check: allow foo.ts -- prose-only marker\n', 'doc')
    expect(markers).toEqual([{ token: 'foo.ts', reason: 'prose-only marker', line: 1 }])
  })
})
