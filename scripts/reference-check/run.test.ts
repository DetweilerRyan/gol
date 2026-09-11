import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { initGitRepo, writeFile } from '../test-support.ts'
import { buildFileIndex, gatherCheckInput, listRepoPaths, runCheck } from './run.ts'

let repoRoot: string | undefined

afterEach(() => {
  if (repoRoot) rmSync(repoRoot, { recursive: true, force: true })
  repoRoot = undefined
})

function tempRepo(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'reference-check-'))
  repoRoot = dir
  return dir
}

describe('listRepoPaths', () => {
  it('reports a tracked file and an untracked-not-ignored file, but not a gitignored one', () => {
    const root = tempRepo()
    initGitRepo(root)
    writeFile(root, '.gitignore', 'ignored.ts\n')
    writeFile(root, 'src/tracked.ts', '// tracked')
    writeFile(root, 'src/untracked.ts', '// untracked')
    writeFile(root, 'ignored.ts', '// ignored')
    execFileSync('git', ['add', '.gitignore', 'src/tracked.ts'], { cwd: root })
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root })

    const paths = listRepoPaths(root)
    expect(paths).toContain('src/tracked.ts')
    expect(paths).toContain('src/untracked.ts')
    expect(paths).not.toContain('ignored.ts')
  })
})

describe('buildFileIndex', () => {
  it('resolves a basename that exists in the given path list', () => {
    const root = tempRepo()
    writeFile(root, 'src/cellTiles.ts', 'export function nextTileRange() {}\n')
    const index = buildFileIndex(root, ['src/cellTiles.ts'])
    expect(index.hasBasename('cellTiles.ts')).toBe(true)
    expect(index.hasBasename('doesNotExist.ts')).toBe(false)
    expect(index.size).toBe(1)
  })

  it('finds a symbol as a whole word inside the basename-matched file', () => {
    const root = tempRepo()
    writeFile(root, 'src/cellTiles.ts', 'export function nextTileRange() {}\n')
    const index = buildFileIndex(root, ['src/cellTiles.ts'])
    expect(index.containsSymbol('cellTiles.ts', 'nextTileRange')).toBe(true)
    expect(index.containsSymbol('cellTiles.ts', 'pairTargets')).toBe(false)
  })

  it('does not match a symbol as a mere substring of a longer identifier', () => {
    const root = tempRepo()
    writeFile(root, 'src/cellTiles.ts', 'export function nextTileRangeExtended() {}\n')
    const index = buildFileIndex(root, ['src/cellTiles.ts'])
    expect(index.containsSymbol('cellTiles.ts', 'nextTileRange')).toBe(false)
  })
})

describe('gatherCheckInput', () => {
  it('reads only files inside the scan scope, tagged with the right surface', () => {
    const root = tempRepo()
    writeFile(root, 'src/cellTiles.ts', '// a comment')
    writeFile(root, 'CLAUDE.md', 'some prose')
    writeFile(root, 'coverage/index.ts', '// out of scope')
    const input = gatherCheckInput(root, ['src/cellTiles.ts', 'CLAUDE.md', 'coverage/index.ts'])
    expect(input.files.map((file) => [file.path, file.surface]).sort()).toEqual([
      ['CLAUDE.md', 'doc'],
      ['src/cellTiles.ts', 'source'],
    ])
  })
})

describe('runCheck', () => {
  it('exits 0 on a repo with no dangling references', () => {
    const root = tempRepo()
    initGitRepo(root)
    writeFile(root, 'src/cellTiles.ts', '// this file cites itself: src/cellTiles.ts\n')
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root })

    const result = runCheck(root)
    expect(result.exitCode).toBe(0)
  })

  it('exits 1 and names the dead token when a comment cites a file that does not exist', () => {
    const root = tempRepo()
    initGitRepo(root)
    writeFile(root, 'src/cellTiles.ts', '// see cellLattice.ts for the old policy\n')
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root })

    const result = runCheck(root)
    expect(result.exitCode).toBe(1)
    expect(result.lines.join('\n')).toContain('cellLattice.ts')
  })
})
