import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readFixtureNames, readRawRules } from './run.ts'

function tree(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'vale-fixture-check-'))
  mkdirSync(path.join(root, 'vale-styles', 'Procedure'), { recursive: true })
  mkdirSync(path.join(root, 'vale-styles', 'fixtures'), { recursive: true })
  writeFileSync(path.join(root, 'vale-styles', 'Procedure', 'OneInstruction.yml'), 'scope: raw\n')
  writeFileSync(path.join(root, 'vale-styles', 'fixtures', 'OneInstruction.bad.md'), 'x\n')
  writeFileSync(path.join(root, 'vale-styles', 'fixtures', 'fixtures.vale.ini'), '[*.md]\n')
  return root
}

describe('readRawRules', () => {
  it('reads each style directory and tags every rule with the style it came from', () => {
    const rules = readRawRules(tree())
    expect(rules).toEqual([
      { style: 'Procedure', path: path.join('vale-styles', 'Procedure', 'OneInstruction.yml'), text: 'scope: raw\n' },
    ])
  })

  it('skips fixtures/, which holds the bait rather than a style', () => {
    expect(readRawRules(tree()).map((rule) => rule.style)).not.toContain('fixtures')
  })

  it('skips a non-YAML file sitting in a style directory', () => {
    const root = tree()
    writeFileSync(path.join(root, 'vale-styles', 'Procedure', 'README.md'), 'notes\n')
    expect(readRawRules(root)).toHaveLength(1)
  })

  it('reads a .yaml file as readily as a .yml one', () => {
    const root = tree()
    writeFileSync(path.join(root, 'vale-styles', 'Procedure', 'Other.yaml'), 'scope: list\n')
    expect(readRawRules(root)).toHaveLength(2)
  })
})

describe('readFixtureNames', () => {
  it('lists fixture basenames', () => {
    expect(readFixtureNames(tree())).toEqual(['OneInstruction.bad.md'])
  })

  it('excludes the harness config, which is not a fixture', () => {
    expect(readFixtureNames(tree())).not.toContain('fixtures.vale.ini')
  })
})
