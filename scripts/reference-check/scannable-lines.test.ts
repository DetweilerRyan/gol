import { describe, expect, it } from 'vitest'
import { scannableLinesOf } from './scannable-lines.ts'

describe('scannableLinesOf (source surface)', () => {
  it('keeps a `//` comment line and drops a code line', () => {
    const text = ['// see src/cellTiles.ts', 'const x = readFile("src/cellTiles.ts")'].join('\n')
    const lines = scannableLinesOf(text, 'source')
    expect(lines).toEqual([{ lineNumber: 1, text: '// see src/cellTiles.ts' }])
  })

  it('keeps a `#` comment line (yml/yaml)', () => {
    expect(scannableLinesOf('# see rules/no-foo.yml', 'source')).toEqual([
      { lineNumber: 1, text: '# see rules/no-foo.yml' },
    ])
  })

  it('keeps a `*` JSDoc-continuation comment line', () => {
    expect(scannableLinesOf(' * see src/cellTiles.ts', 'source')).toEqual([
      { lineNumber: 1, text: ' * see src/cellTiles.ts' },
    ])
  })

  it('keeps an opening `/*` line', () => {
    expect(scannableLinesOf('/* see src/cellTiles.ts', 'source')).toEqual([
      { lineNumber: 1, text: '/* see src/cellTiles.ts' },
    ])
  })

  it('strips a URL before the line is handed back, so a permalink filename never reaches the tokenizer', () => {
    const lines = scannableLinesOf(
      '// see https://github.com/x/immer/blob/main/src/plugins/mapset.ts for context',
      'source',
    )
    expect(lines[0].text).not.toContain('mapset.ts')
  })

  it('drops an allow-marker line entirely, not merely exempting its token', () => {
    const text = [
      '// reference-check: allow cellLattice.ts -- deleted, kept as a search key',
      '// unrelated comment',
    ].join('\n')
    const lines = scannableLinesOf(text, 'source')
    expect(lines).toEqual([{ lineNumber: 2, text: '// unrelated comment' }])
  })
})

describe('scannableLinesOf (doc surface)', () => {
  it('keeps every line, including prose with no comment leader', () => {
    const text = ['# Heading', 'Some prose about src/cellTiles.ts.'].join('\n')
    expect(scannableLinesOf(text, 'doc')).toEqual([
      { lineNumber: 1, text: '# Heading' },
      { lineNumber: 2, text: 'Some prose about src/cellTiles.ts.' },
    ])
  })

  it('drops an HTML allow-marker line even on the doc surface', () => {
    const text = ['prose', '<!-- reference-check: allow src/a.ts -- hypothetical path -->'].join('\n')
    expect(scannableLinesOf(text, 'doc')).toEqual([{ lineNumber: 1, text: 'prose' }])
  })
})
