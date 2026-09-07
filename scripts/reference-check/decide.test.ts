import { describe, expect, it } from 'vitest'
import type { FileIndex } from './checks.ts'
import { decide } from './decide.ts'

function fakeIndex(hasBasename: (basename: string) => boolean = () => true): FileIndex {
  return { hasBasename, containsSymbol: () => true, size: 1 }
}

describe('decide', () => {
  it('exits 0 with a summary line reporting files scanned and references found', () => {
    const input = { files: [{ path: 'a.ts', surface: 'source' as const, text: '// see cellTiles.ts' }] }
    const result = decide(input, fakeIndex())
    expect(result.exitCode).toBe(0)
    expect(result.lines[0]).toBe('reference-check -- 1 file(s) scanned, 1 reference(s) found, no failures.')
  })

  it('exits 1 and reports each failure when a reference does not resolve', () => {
    const input = { files: [{ path: 'a.ts', surface: 'source' as const, text: '// see cellLattice.ts' }] }
    const result = decide(
      input,
      fakeIndex(() => false),
    )
    expect(result.exitCode).toBe(1)
    expect(result.lines.join('\n')).toContain('file-reference-resolves')
  })

  it('formats the failure header, a blank separator, then one two-line block per failure', () => {
    const input = { files: [{ path: 'a.ts', surface: 'source' as const, text: '// see cellLattice.ts' }] }
    const result = decide(
      input,
      fakeIndex(() => false),
    )
    expect(result.lines[0]).toBe('reference-check -- 1 file(s) scanned, 1 reference(s) found, 1 failure(s):')
    expect(result.lines[1]).toBe('')
    expect(result.lines[2]).toContain('[file-reference-resolves]')
  })
})
