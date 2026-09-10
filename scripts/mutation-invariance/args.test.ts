import { describe, expect, it } from 'vitest'
import { parseArgs } from './args.ts'

// The unknown-flag/missing-value/positional-argument rejection and the
// offending-argument/accepted-form message pairing are
// ../single-flag-arg.test.ts's own -- this describe covers only what this
// wrapper adds over parseSingleStringFlag: the `diff` flag name and the
// `--diff` -> `range` rename.
describe('parseArgs', () => {
  it('maps an absent --diff to {} and a given one to { range }', () => {
    // toStrictEqual, not toEqual: the ternary returns `{}` in this branch
    // specifically so the key is absent, not merely `undefined` -- toEqual
    // treats `{ range: undefined }` and `{}` as equal and would miss a
    // mutant that collapsed the ternary to always return `{ range }`.
    expect(parseArgs([])).toStrictEqual({})
    expect(parseArgs(['--diff', 'main...HEAD'])).toEqual({ range: 'main...HEAD' })
  })

  it('names --diff <range> as the accepted form when parseSingleStringFlag rejects the argument', () => {
    expect(() => parseArgs(['--nope', 'x'])).toThrow('The only accepted argument is --diff <range>.')
  })
})
