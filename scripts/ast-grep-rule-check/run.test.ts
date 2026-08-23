import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadSgConfig, readYamlFilesRecursive, runCheck } from './run.ts'
import { writeFile } from '../test-support.ts'

const GOOD_RULE = 'id: no-foo\nseverity: warning\nrule:\n  pattern: foo\n'
const GOOD_FIXTURE = 'id: no-foo\nvalid:\n  - bar\ninvalid:\n  - foo\n'
// What `ast-grep test` writes into a snapshot directory: fixture-shaped enough
// that reading it as a fixture would produce failures, which is the point.
const SNAPSHOT = 'id: no-foo\nsnapshots:\n  foo: {}\n'

let repoRoot: string | undefined

afterEach(() => {
  if (repoRoot) rmSync(repoRoot, { recursive: true, force: true })
  repoRoot = undefined
})

function tempRepo(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ast-grep-rule-check-'))
  repoRoot = dir
  return dir
}

describe('loadSgConfig', () => {
  it('reads ruleDirs (plural, arbitrary count) and testConfigs[].testDir off sgconfig.yml, not a hardcoded pair', () => {
    const root = tempRepo()
    writeFile(root, 'sgconfig.yml', 'ruleDirs:\n  - rules\n  - more-rules\ntestConfigs:\n  - testDir: rule-tests\n')
    const config = loadSgConfig(root)
    expect(config.ruleDirs).toEqual(['rules', 'more-rules'])
    expect(config.testConfigs).toEqual([{ testDir: 'rule-tests', snapshotDir: '__snapshots__' }])
  })

  it("reads a testConfig's own snapshotDir, since ast-grep honours it and would store snapshots there instead", () => {
    const root = tempRepo()
    writeFile(
      root,
      'sgconfig.yml',
      'ruleDirs:\n  - rules\ntestConfigs:\n  - testDir: rule-tests\n    snapshotDir: snaps\n',
    )
    expect(loadSgConfig(root).testConfigs).toEqual([{ testDir: 'rule-tests', snapshotDir: 'snaps' }])
  })

  it('drops a testConfigs entry with no testDir string rather than reading fixtures from nowhere', () => {
    const root = tempRepo()
    writeFile(
      root,
      'sgconfig.yml',
      'ruleDirs:\n  - rules\ntestConfigs:\n  - snapshotDir: snaps\n  - testDir: rule-tests\n',
    )
    expect(loadSgConfig(root).testConfigs).toEqual([{ testDir: 'rule-tests', snapshotDir: '__snapshots__' }])
  })
})

describe('readYamlFilesRecursive', () => {
  // Table-driven because every scan case is the same three steps -- write a
  // file set into a fresh temp repo, scan one directory, pin the exact
  // relative paths found -- differing only in what's on disk and whether a
  // snapshot directory is named. Written as four separate `it` bodies these
  // were byte-identical in shape and tripped dry4ts at score 1.00.
  it.each([
    {
      name: "finds a rule nested in a subdirectory, matching ast-grep's own recursive scan of ruleDirs",
      files: { 'rules/top.yml': GOOD_RULE, 'rules/nested/deep.yml': GOOD_RULE },
      dir: 'rules',
      skipChildDir: undefined,
      expected: ['rules/nested/deep.yml', 'rules/top.yml'],
    },
    {
      // Measured against ast-grep 0.45.1: 'Running 1 tests' whether or not a
      // fixture-shaped file exists under the snapshot directory, so ast-grep
      // itself never counts one as a fixture and neither may this.
      name: 'skips the named snapshot directory, which ast-grep test never counts a file under as a fixture',
      files: { 'rule-tests/no-foo-test.yml': GOOD_FIXTURE, 'rule-tests/__snapshots__/no-foo-snapshot.yml': SNAPSHOT },
      dir: 'rule-tests',
      skipChildDir: '__snapshots__',
      expected: ['rule-tests/no-foo-test.yml'],
    },
    {
      name: 'skips only the direct child, not a same-named directory nested deeper -- that depth has no meaning to ast-grep',
      files: { 'rule-tests/nested/__snapshots__/deep-test.yml': GOOD_FIXTURE },
      dir: 'rule-tests',
      skipChildDir: '__snapshots__',
      expected: ['rule-tests/nested/__snapshots__/deep-test.yml'],
    },
    {
      name: 'skips nothing when no snapshot directory is named, so a ruleDirs scan sees every rule ast-grep scan does',
      files: { 'rules/__snapshots__/no-hidden.yml': GOOD_RULE },
      dir: 'rules',
      skipChildDir: undefined,
      expected: ['rules/__snapshots__/no-hidden.yml'],
    },
  ])('$name', ({ files, dir, skipChildDir, expected }) => {
    const root = tempRepo()
    for (const [relativePath, contents] of Object.entries(files)) writeFile(root, relativePath, contents)
    const found = readYamlFilesRecursive(path.join(root, dir), dir, skipChildDir)
    expect(found.map((file) => file.path).sort()).toEqual(expected)
  })

  it('returns nothing for an empty directory', () => {
    const root = tempRepo()
    mkdirSync(path.join(root, 'rules'), { recursive: true })
    expect(readYamlFilesRecursive(path.join(root, 'rules'), 'rules')).toEqual([])
  })
})

describe('runCheck', () => {
  it('sees a rule nested in a ruleDirs subdirectory and its matching fixture, exiting 0', () => {
    const root = tempRepo()
    writeFile(root, 'sgconfig.yml', 'ruleDirs:\n  - rules\ntestConfigs:\n  - testDir: rule-tests\n')
    writeFile(root, 'rules/nested/no-foo.yml', GOOD_RULE)
    writeFile(root, 'rule-tests/no-foo-test.yml', GOOD_FIXTURE)
    const result = runCheck(root)
    expect(result.exitCode).toBe(0)
  })

  it('still checks a rule stored under a ruleDirs subdirectory named __snapshots__ -- ast-grep scan runs that rule, so exempting it here would hide it from every check', () => {
    const root = tempRepo()
    writeFile(root, 'sgconfig.yml', 'ruleDirs:\n  - rules\ntestConfigs:\n  - testDir: rule-tests\n')
    writeFile(root, 'rules/__snapshots__/no-foo.yml', GOOD_RULE)
    mkdirSync(path.join(root, 'rule-tests'), { recursive: true })
    const result = runCheck(root)
    expect(result.exitCode).toBe(1)
    expect(result.lines.some((line) => line.includes('rules/__snapshots__/no-foo.yml'))).toBe(true)
  })

  it("ignores snapshots under a testConfig's custom snapshotDir, not just the default-named one", () => {
    const root = tempRepo()
    writeFile(
      root,
      'sgconfig.yml',
      'ruleDirs:\n  - rules\ntestConfigs:\n  - testDir: rule-tests\n    snapshotDir: snaps\n',
    )
    writeFile(root, 'rules/no-foo.yml', GOOD_RULE)
    writeFile(root, 'rule-tests/no-foo-test.yml', GOOD_FIXTURE)
    writeFile(root, 'rule-tests/snaps/no-foo-snapshot.yml', SNAPSHOT)
    const result = runCheck(root)
    expect(result.exitCode).toBe(0)
  })

  it('fails when the configured rules directory is empty', () => {
    const root = tempRepo()
    writeFile(root, 'sgconfig.yml', 'ruleDirs:\n  - rules\ntestConfigs:\n  - testDir: rule-tests\n')
    mkdirSync(path.join(root, 'rules'), { recursive: true })
    mkdirSync(path.join(root, 'rule-tests'), { recursive: true })
    const result = runCheck(root)
    expect(result.exitCode).toBe(1)
    expect(result.lines.join('\n')).toContain('no rule files were found')
  })

  it('reports a multi-document rule file as a named parse failure rather than crashing', () => {
    const root = tempRepo()
    writeFile(root, 'sgconfig.yml', 'ruleDirs:\n  - rules\ntestConfigs:\n  - testDir: rule-tests\n')
    writeFile(root, 'rules/no-foo.yml', `${GOOD_RULE}---\nid: no-bar\nseverity: warning\n`)
    mkdirSync(path.join(root, 'rule-tests'), { recursive: true })
    const result = runCheck(root)
    expect(result.exitCode).toBe(1)
    expect(result.lines.some((line) => line.includes('[parse] rules/no-foo.yml'))).toBe(true)
  })

  it('reports a stale allow-unresolved-files marker once its glob resolves', () => {
    const root = tempRepo()
    writeFile(root, 'sgconfig.yml', 'ruleDirs:\n  - rules\ntestConfigs:\n  - testDir: rule-tests\n')
    writeFile(
      root,
      'rules/no-foo.yml',
      '# ast-grep-rule-check: allow-unresolved-files fixture arrives later\n' +
        "id: no-foo\nseverity: warning\nfiles:\n  - 'rule-tests/no-foo-test.yml'\nrule:\n  pattern: foo\n",
    )
    writeFile(root, 'rule-tests/no-foo-test.yml', GOOD_FIXTURE)
    const result = runCheck(root)
    expect(result.exitCode).toBe(1)
    expect(result.lines.some((line) => line.includes('[stale-allow-unresolved-files]'))).toBe(true)
  })
})
