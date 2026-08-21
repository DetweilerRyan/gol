import { describe, expect, it } from 'vitest'
import { filenameStemOf, fixtureStemForRuleId, ruleIdForFixtureStem } from './filenames.ts'

describe('filenameStemOf', () => {
  it('strips the directory and the .yml extension', () => {
    expect(filenameStemOf('rules/no-dom-in-domain.yml')).toBe('no-dom-in-domain')
  })

  it('strips a .yaml extension too', () => {
    expect(filenameStemOf('rules/no-dom-in-domain.yaml')).toBe('no-dom-in-domain')
  })

  it('keeps the last path segment, whatever precedes it', () => {
    // Pins down "the last slash wins" for every string, not just for the
    // single-segment `rules/<name>.yml` that readdirSync happens to produce:
    // an earlier line terminator must not stop the directory strip. This is
    // exactly where the previously-used `/^.*\//` regex disagreed with its
    // unanchored form, since `.` never matches a newline.
    expect(filenameStemOf('rules/nested/dir/no-dom-in-domain.yml')).toBe('no-dom-in-domain')
    expect(filenameStemOf('a\nb/no-dom-in-domain.yml')).toBe('no-dom-in-domain')
  })

  it('strips only a trailing .yml/.yaml extension, not one appearing mid-filename', () => {
    // Distinguishes the `$`-anchored extension regex from an unanchored one:
    // an unanchored regex would strip the *first* ".yaml"/".yml" it finds,
    // which for this filename is the one in the middle, not the real suffix.
    expect(filenameStemOf('rules/no.yaml-thing-test.yml')).toBe('no.yaml-thing-test')
  })

  it('leaves a path with no extension and no directory untouched', () => {
    expect(filenameStemOf('no-dom-in-domain')).toBe('no-dom-in-domain')
  })
})

describe('fixtureStemForRuleId / ruleIdForFixtureStem', () => {
  it('maps a rule id to the fixture filename stem the convention requires', () => {
    expect(fixtureStemForRuleId('no-dom-in-domain')).toBe('no-dom-in-domain-test')
  })

  it('maps that fixture stem back to the same rule id -- the two directions must stay inverse', () => {
    expect(ruleIdForFixtureStem(fixtureStemForRuleId('no-dom-in-domain'))).toBe('no-dom-in-domain')
  })

  it('strips the suffix only at the end, not at the first occurrence anywhere in the stem', () => {
    // 'no-test-thing' does not *end* in '-test', so it names a rule of exactly
    // that name. An unanchored strip would instead delete the '-test' it finds
    // mid-string and claim the fixture tests 'no-thing'.
    expect(ruleIdForFixtureStem('no-test-thing')).toBe('no-test-thing')
    expect(ruleIdForFixtureStem('no-test-thing-test')).toBe('no-test-thing')
  })
})
