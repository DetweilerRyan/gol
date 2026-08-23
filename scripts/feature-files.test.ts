import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { listFeatureFiles, selectFeatureFiles } from './feature-files.ts'
import { writeFile } from './test-support.ts'

describe('listFeatureFiles', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  function tempDir(): string {
    dir = mkdtempSync(path.join(os.tmpdir(), 'feature-files-'))
    return dir
  }

  it('lists every .feature file in the directory, sorted', () => {
    const featuresDir = tempDir()
    writeFile(featuresDir, 'zebra.feature', '')
    writeFile(featuresDir, 'alpha.feature', '')
    expect(listFeatureFiles(featuresDir)).toEqual(['alpha.feature', 'zebra.feature'])
  })

  it('ignores non-.feature files, including steps files sitting alongside them', () => {
    const featuresDir = tempDir()
    writeFile(featuresDir, 'alpha.feature', '')
    writeFile(featuresDir, 'alpha.steps.test.ts', '')
    writeFile(featuresDir, 'README.md', '')
    expect(listFeatureFiles(featuresDir)).toEqual(['alpha.feature'])
  })

  it('throws rather than silently returning an empty list -- an empty glob is a config bug, not a valid state', () => {
    const featuresDir = tempDir()
    writeFile(featuresDir, 'README.md', '')
    expect(() => listFeatureFiles(featuresDir)).toThrow(/no \.feature files/i)
  })
})

describe('selectFeatureFiles', () => {
  // Deterministic on any filesystem, unlike a real-directory test: an
  // already-unsorted input list is the only way to prove .sort() runs at
  // all, since a real readdirSync can happen to return alphabetical order
  // on some platforms even without it.
  it('sorts an unsorted input list rather than trusting the caller-supplied order', () => {
    expect(selectFeatureFiles(['zebra.feature', 'alpha.feature'], '/irrelevant')).toEqual([
      'alpha.feature',
      'zebra.feature',
    ])
  })
})
