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

  it('leaves id undefined when the fixture has no id: key', () => {
    const text = 'invalid:\n  - document.getElementById(x)\n'
    const fixture = parseFixtureFile('rule-tests/orphan-test.yml', text)
    expect(fixture.id).toBeUndefined()
  })

  it('leaves id undefined when the id: value is not a string (e.g. a bare YAML number)', () => {
    const text = 'id: 42\ninvalid:\n  - document.getElementById(x)\n'
    const fixture = parseFixtureFile('rule-tests/numeric-id-test.yml', text)
    expect(fixture.id).toBeUndefined()
  })

  it('parses a comment-only document without crashing, leaving every field empty', () => {
    // Same `?? {}` fallback as rule-file.ts's parseRuleFile -- yaml's parse()
    // returns null, not {}, for a document with no content.
    const fixture = parseFixtureFile('rule-tests/empty-test.yml', '# nothing here but a comment\n')
    expect(fixture.id).toBeUndefined()
    expect(fixture.hasInvalidCases).toBe(false)
  })

  it('derives filenameStem from the last path segment, whatever precedes it', () => {
    // See the equivalent rule-file.ts test: "the last slash wins" has to hold
    // for every string, including one containing a line terminator.
    const text = 'id: x\ninvalid:\n  - document.getElementById(x)\n'
    expect(parseFixtureFile('rule-tests/nested/dir/orphan-test.yml', text).filenameStem).toBe('orphan-test')
    expect(parseFixtureFile('a\nb/orphan-test.yml', text).filenameStem).toBe('orphan-test')
  })

  it('strips only a trailing .yml/.yaml extension, not one appearing mid-filename', () => {
    // Distinguishes the `$`-anchored extension regex from an unanchored one --
    // see the equivalent rule-file.ts test for the full explanation.
    const text = 'id: x\ninvalid:\n  - document.getElementById(x)\n'
    const fixture = parseFixtureFile('rule-tests/no.yaml-thing-test.yml', text)
    expect(fixture.filenameStem).toBe('no.yaml-thing-test')
  })
})
