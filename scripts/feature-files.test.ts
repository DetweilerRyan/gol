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

  it('finds .feature files nested in subdirectories, not just the top level', () => {
    const featuresDir = tempDir()
    writeFile(featuresDir, 'zebra/zebra.feature', '')
    writeFile(featuresDir, 'alpha.feature', '')
    expect(listFeatureFiles(featuresDir)).toEqual(['alpha.feature', 'zebra/zebra.feature'])
  })

  it('throws naming the path when the features directory itself does not exist, rather than reporting it as empty', () => {
    // The exact "Features directory not found" wording, not just the path
    // substring: globSync returns [] for a missing directory exactly like it
    // does for an empty real one, so selectFeatureFiles' own "No .feature
    // files found in <path>" message also happens to contain the missing
    // path -- a bare path-substring assertion can't tell the two apart.
    const missing = path.join(os.tmpdir(), 'feature-files-does-not-exist')
    expect(() => listFeatureFiles(missing)).toThrow(`Features directory not found: ${missing}`)
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

  // Once listFeatureFiles glob-prefilters to '**/*.feature', nothing calling
  // through it exercises the '.endsWith(.feature)' predicate any more --
  // glob's own pattern already excludes everything else. Call
  // selectFeatureFiles directly with a mixed, nested, unsorted input so the
  // filter and the sort are both still pinned on their own.
  it('filters non-.feature entries and sorts the rest, including nested relative paths', () => {
    expect(
      selectFeatureFiles(['zebra/zebra.feature', 'notes.txt', 'alpha.feature', 'zebra.steps.test.ts'], '/irrelevant'),
    ).toEqual(['alpha.feature', 'zebra/zebra.feature'])
  })
})
