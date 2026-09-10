import { describe, expect, it } from 'vitest'
import { parseSingleStringFlag } from './single-flag-arg.ts'

describe('parseSingleStringFlag', () => {
  it('returns undefined when the flag is absent', () => {
    expect(parseSingleStringFlag([], 'feature', '--feature <name>')).toBeUndefined()
  })

  it('captures the value following the flag', () => {
    expect(parseSingleStringFlag(['--feature', 'camera-pan-and-zoom'], 'feature', '--feature <name>')).toBe(
      'camera-pan-and-zoom',
    )
  })

  it('captures the value from the --flag=value form', () => {
    expect(parseSingleStringFlag(['--diff=main...HEAD'], 'diff', '--diff <range>')).toBe('main...HEAD')
  })

  // Message text past the offending-argument/accepted-form pairing is
  // node:util's own, not ours -- assert that pairing (naming what was wrong
  // *and* what's valid) rather than pinning Node's exact wording, which
  // would make the suite brittle against a runtime upgrade for no benefit.
  it('throws when the flag is the last argument with no value, naming the flag and the accepted form', () => {
    expect(() => parseSingleStringFlag(['--feature'], 'feature', '--feature <name>')).toThrow(
      /(?=.*--feature)(?=.*--feature <name>)/,
    )
  })

  it('throws naming a bare positional argument and the accepted form, rather than silently ignoring it', () => {
    expect(() => parseSingleStringFlag(['infinite-grid'], 'feature', '--feature <name>')).toThrow(
      /(?=.*infinite-grid)(?=.*--feature <name>)/,
    )
  })

  it('throws naming an unrecognized flag and the accepted form, rather than silently ignoring it', () => {
    expect(() => parseSingleStringFlag(['--nope'], 'feature', '--feature <name>')).toThrow(
      /(?=.*--nope)(?=.*--feature <name>)/,
    )
  })

  it('throws naming the first unrecognized argument, not a later one, alongside the accepted form', () => {
    expect(() =>
      parseSingleStringFlag(['--other', 'x', '--feature', 'infinite-grid'], 'feature', '--feature <name>'),
    ).toThrow(/(?=.*--other)(?=.*--feature <name>)/)
  })
})
