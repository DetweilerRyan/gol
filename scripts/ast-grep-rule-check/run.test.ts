import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadSgConfig, readYamlFilesRecursive, runCheck } from './run.ts'

const GOOD_RULE = 'id: no-foo\nseverity: warning\nrule:\n  pattern: foo\n'
const GOOD_FIXTURE = 'id: no-foo\nvalid:\n  - bar\ninvalid:\n  - foo\n'

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

function writeFile(root: string, relativePath: string, contents: string): void {
  const full = path.join(root, relativePath)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, contents)
}

describe('loadSgConfig', () => {
  it('reads ruleDirs (plural, arbitrary count) and testConfigs[].testDir off sgconfig.yml, not a hardcoded pair', () => {
    const root = tempRepo()
    writeFile(root, 'sgconfig.yml', 'ruleDirs:\n  - rules\n  - more-rules\ntestConfigs:\n  - testDir: rule-tests\n')
    const config = loadSgConfig(root)
    expect(config.ruleDirs).toEqual(['rules', 'more-rules'])
    expect(config.testDirs).toEqual(['rule-tests'])
  })
})

describe('readYamlFilesRecursive', () => {
  it("finds a rule nested in a subdirectory, matching ast-grep's own recursive scan of ruleDirs", () => {
    const root = tempRepo()
    writeFile(root, 'rules/top.yml', GOOD_RULE)
    writeFile(root, 'rules/nested/deep.yml', GOOD_RULE)
    const files = readYamlFilesRecursive(path.join(root, 'rules'), 'rules')
    expect(files.map((f) => f.path).sort()).toEqual(['rules/nested/deep.yml', 'rules/top.yml'])
  })

  it('returns nothing for an empty directory', () => {
    const root = tempRepo()
    mkdirSync(path.join(root, 'rules'), { recursive: true })
    expect(readYamlFilesRecursive(path.join(root, 'rules'), 'rules')).toEqual([])
  })

  it("skips __snapshots__ -- ast-grep test itself never counts a file under it as a fixture (measured against 0.45.1: 'Running 1 tests' whether or not a fixture-shaped file exists there)", () => {
    const root = tempRepo()
    writeFile(root, 'rule-tests/no-foo-test.yml', GOOD_FIXTURE)
    writeFile(root, 'rule-tests/__snapshots__/no-foo-snapshot.yml', 'id: no-foo\nsnapshots:\n  foo: {}\n')
    const files = readYamlFilesRecursive(path.join(root, 'rule-tests'), 'rule-tests')
    expect(files.map((f) => f.path)).toEqual(['rule-tests/no-foo-test.yml'])
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
