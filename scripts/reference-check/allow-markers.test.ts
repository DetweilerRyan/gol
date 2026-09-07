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
