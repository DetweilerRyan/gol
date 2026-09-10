import { describe, expect, it } from 'vitest'
import { parseArgs } from './args.ts'

describe('parseArgs', () => {
  it('returns {} when no arguments are given', () => {
    expect(parseArgs([])).toEqual({})
  })

  it('parses --diff <range> into { range }', () => {
    expect(parseArgs(['--diff', 'main...HEAD'])).toEqual({ range: 'main...HEAD' })
  })

  it('throws, naming the accepted form, on an unknown flag', () => {
    expect(() => parseArgs(['--nope', 'x'])).toThrow('The only accepted argument is --diff <range>.')
  })

  it('throws on a bare positional argument', () => {
    expect(() => parseArgs(['main...HEAD'])).toThrow('The only accepted argument is --diff <range>.')
  })

  it('throws when --diff is given with no value', () => {
    expect(() => parseArgs(['--diff'])).toThrow('The only accepted argument is --diff <range>.')
  })
})
