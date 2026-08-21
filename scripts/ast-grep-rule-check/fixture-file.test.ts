import { describe, expect, it } from 'vitest'
import { parseFixtureFile } from './fixture-file.ts'

describe('parseFixtureFile', () => {
  it('reads id and detects invalid: cases on a well-formed fixture', () => {
    const text = 'id: no-dom-in-domain\nvalid:\n  - const x = 1\ninvalid:\n  - document.getElementById(x)\n'
    const fixture = parseFixtureFile('rule-tests/no-dom-in-domain-test.yml', text)
    expect(fixture.id).toBe('no-dom-in-domain')
    expect(fixture.hasInvalidCases).toBe(true)
  })

  it('derives filenameStem from the path, stripping the .yml extension', () => {
    const text = 'id: no-dom-in-domain\ninvalid:\n  - document.getElementById(x)\n'
    const fixture = parseFixtureFile('rule-tests/no-dom-in-domain-test.yml', text)
    expect(fixture.filenameStem).toBe('no-dom-in-domain-test')
  })

  it('reports hasInvalidCases: false for a fixture with only valid: cases', () => {
    const text = 'id: no-dom-in-domain\nvalid:\n  - const x = 1\n'
    const fixture = parseFixtureFile('rule-tests/no-dom-in-domain-test.yml', text)
    expect(fixture.hasInvalidCases).toBe(false)
  })

  it('reports hasInvalidCases: false for an empty invalid: list', () => {
    const text = 'id: no-dom-in-domain\nvalid:\n  - const x = 1\ninvalid: []\n'
    const fixture = parseFixtureFile('rule-tests/no-dom-in-domain-test.yml', text)
    expect(fixture.hasInvalidCases).toBe(false)
  })

  it('reports hasInvalidCases: false when there is no invalid: key at all', () => {
    const text = 'id: no-dom-in-domain\n'
    const fixture = parseFixtureFile('rule-tests/no-dom-in-domain-test.yml', text)
    expect(fixture.hasInvalidCases).toBe(false)
  })
})
