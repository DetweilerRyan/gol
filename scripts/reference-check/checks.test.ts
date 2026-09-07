import { describe, expect, it } from 'vitest'
import {
  checkAll,
  checkAnyFilesScanned,
  checkAnyReferencesFound,
  checkCitedSymbolExists,
  checkFileReferenceResolves,
  checkNoFileLineReferences,
  checkStaleAllowMarker,
  type FileIndex,
  type ScannedFile,
} from './checks.ts'

// A literal FileIndex, mirroring ast-grep-rule-check's GlobHasMatch
// precedent (see run.ts) -- no filesystem, so a test can pin exactly which
// basenames and symbols exist without touching disk.
function fakeIndex(bySymbol: Record<string, string[]> = {}): FileIndex {
  return {
    hasBasename: (basename) => basename in bySymbol,
    containsSymbol: (basename, symbol) => (bySymbol[basename] ?? []).includes(symbol),
    size: Object.keys(bySymbol).length,
  }
}

function sourceFile(path: string, text: string): ScannedFile {
  return { path, surface: 'source', text }
}

function docFile(path: string, text: string): ScannedFile {
  return { path, surface: 'doc', text }
}

describe('checkFileReferenceResolves', () => {
  it('passes when the referenced file resolves', () => {
    const index = fakeIndex({ 'cellTiles.ts': [] })
    const failures = checkFileReferenceResolves([sourceFile('a.ts', '// see src/cellTiles.ts')], index)
    expect(failures).toEqual([])
  })

  it('fails when the referenced file does not resolve', () => {
    const index = fakeIndex()
    const failures = checkFileReferenceResolves([sourceFile('a.ts', '// see cellLattice.ts')], index)
    expect(failures).toEqual([
      { check: 'file-reference-resolves', file: 'a.ts', message: expect.stringContaining('cellLattice.ts') },
    ])
  })

  it('ignores a reference on a non-comment source line', () => {
    const index = fakeIndex()
    const failures = checkFileReferenceResolves([sourceFile('a.ts', 'const path = "cellLattice.ts"')], index)
    expect(failures).toEqual([])
  })

  it('checks every line of a doc file, not only comment-prefixed ones', () => {
    const index = fakeIndex()
    const failures = checkFileReferenceResolves([docFile('CLAUDE.md', 'See cellLattice.ts for the policy.')], index)
    expect(failures).toHaveLength(1)
  })

  it('suppresses the failure when a same-file allow marker excuses that basename', () => {
    const index = fakeIndex()
    const text = [
      '// reference-check: allow cellLattice.ts -- deleted, kept as a search key',
      '// see cellLattice.ts',
    ].join('\n')
    expect(checkFileReferenceResolves([sourceFile('a.ts', text)], index)).toEqual([])
  })

  it('does not suppress the failure when the allow marker has no reason', () => {
    const index = fakeIndex()
    const text = ['// reference-check: allow cellLattice.ts', '// see cellLattice.ts'].join('\n')
    expect(checkFileReferenceResolves([sourceFile('a.ts', text)], index)).toHaveLength(1)
  })

  it('does not suppress a different, unrelated basename in the same file', () => {
    const index = fakeIndex()
    const text = ['// reference-check: allow cellLattice.ts -- deleted', '// see otherDead.ts'].join('\n')
    const failures = checkFileReferenceResolves([sourceFile('a.ts', text)], index)
    expect(failures.map((failure) => failure.message).join()).toContain('otherDead.ts')
  })
})

describe('checkCitedSymbolExists', () => {
  it('passes when the symbol appears in the cited file', () => {
    const index = fakeIndex({ 'cellTiles.ts': ['nextTileRange'] })
    const failures = checkCitedSymbolExists([sourceFile('a.ts', "// cellTiles.ts's nextTileRange")], index)
    expect(failures).toEqual([])
  })

  it('fails when the symbol does not appear in the cited file', () => {
    const index = fakeIndex({ 'discovery.ts': [] })
    const failures = checkCitedSymbolExists([sourceFile('a.ts', "// discovery.ts's pairTargets")], index)
    expect(failures).toEqual([
      { check: 'cited-symbol-exists', file: 'a.ts', message: expect.stringContaining('pairTargets') },
    ])
  })

  it('leaves an unresolved file to file-reference-resolves instead of double-reporting it', () => {
    const index = fakeIndex()
    expect(checkCitedSymbolExists([sourceFile('a.ts', "// cellLattice.ts's pairTargets")], index)).toEqual([])
  })

  it('suppresses the failure when a same-file allow marker excuses the cited file', () => {
    const index = fakeIndex({ 'discovery.ts': [] })
    const text = [
      '// reference-check: allow discovery.ts -- symbol renamed, tracked separately',
      "// discovery.ts's pairTargets",
    ].join('\n')
    expect(checkCitedSymbolExists([sourceFile('a.ts', text)], index)).toEqual([])
  })
})

describe('checkNoFileLineReferences', () => {
  it('fails on a source file.ts:NN reference even when it resolves', () => {
    const failures = checkNoFileLineReferences([sourceFile('a.ts', '// see features/steps/pattern-library.ts:58')])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('no-file-line-references')
  })

  it('does not scan a doc file at all', () => {
    expect(checkNoFileLineReferences([docFile('CLAUDE.md', 'See features/steps/pattern-library.ts:58.')])).toEqual([])
  })

  it('suppresses the failure when a same-file allow marker excuses that basename', () => {
    const text = [
      '// reference-check: allow pattern-library.ts -- intentional example',
      '// see features/steps/pattern-library.ts:58',
    ].join('\n')
    expect(checkNoFileLineReferences([sourceFile('a.ts', text)])).toEqual([])
  })
})

describe('checkStaleAllowMarker', () => {
  it('passes for a marker whose token still appears live and unresolved', () => {
    const index = fakeIndex()
    const text = [
      '// reference-check: allow cellLattice.ts -- deleted, kept as a search key',
      '// see cellLattice.ts',
    ].join('\n')
    expect(checkStaleAllowMarker([sourceFile('a.ts', text)], index)).toEqual([])
  })

  it('fails when the excused token now resolves', () => {
    const index = fakeIndex({ 'cellLattice.ts': [] })
    const text = [
      '// reference-check: allow cellLattice.ts -- deleted, kept as a search key',
      '// see cellLattice.ts',
    ].join('\n')
    const failures = checkStaleAllowMarker([sourceFile('a.ts', text)], index)
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('now resolves')
  })

  it('fails when the token no longer appears anywhere else in the file', () => {
    const index = fakeIndex()
    const failures = checkStaleAllowMarker(
      [sourceFile('a.ts', '// reference-check: allow cellLattice.ts -- deleted, kept as a search key')],
      index,
    )
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('no other scannable line')
  })

  it('fails when the marker has no reason at all', () => {
    const index = fakeIndex()
    const text = ['// reference-check: allow cellLattice.ts', '// see cellLattice.ts'].join('\n')
    const failures = checkStaleAllowMarker([sourceFile('a.ts', text)], index)
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('no reason')
  })

  it('passes for a file with no marker at all', () => {
    expect(checkStaleAllowMarker([sourceFile('a.ts', '// nothing to see here')], fakeIndex())).toEqual([])
  })
})

describe('checkAnyFilesScanned', () => {
  it('fails on an empty file list', () => {
    expect(checkAnyFilesScanned([])).toEqual([
      { check: 'reference-check-inert', file: '(none)', message: expect.stringContaining('no files were scanned') },
    ])
  })

  it('passes when at least one file was scanned', () => {
    expect(checkAnyFilesScanned([sourceFile('a.ts', '// x')])).toEqual([])
  })
})

describe('checkAnyReferencesFound', () => {
  it('fails when no file carries a candidate token', () => {
    const failures = checkAnyReferencesFound([sourceFile('a.ts', '// nothing referenceable here')])
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('no candidate file-reference tokens')
  })

  it('passes when at least one candidate token exists', () => {
    expect(checkAnyReferencesFound([sourceFile('a.ts', '// see cellLattice.ts')])).toEqual([])
  })
})

describe('checkAll', () => {
  it('runs every check and aggregates their failures', () => {
    const index = fakeIndex()
    const failures = checkAll({ files: [sourceFile('a.ts', '// see cellLattice.ts')] }, index)
    expect(failures.some((failure) => failure.check === 'file-reference-resolves')).toBe(true)
  })

  it('reports reference-check-inert instead of a clean run when nothing was scanned', () => {
    const failures = checkAll({ files: [] }, fakeIndex())
    expect(failures.some((failure) => failure.check === 'reference-check-inert')).toBe(true)
  })
})
