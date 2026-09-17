import { describe, expect, it } from 'vitest'
import { findCycleMentions } from './cycle-string.ts'

const ROLES = new Set(['product', 'coder', 'cleaner', 'architect', 'hardener'])

describe('findCycleMentions', () => {
  it('finds the full six-link cycle chain', () => {
    const found = findCycleMentions('the cycle: product → coder → cleaner → architect → hardener → product here', ROLES)
    expect(found).toEqual([{ text: 'product → coder → cleaner → architect → hardener → product', line: 1 }])
  })

  it('ignores an arrow chain built from words that are not known roles', () => {
    expect(findCycleMentions('the layering: framework-free → hook → component', ROLES)).toEqual([])
  })

  it('ignores an arrow chain of known-role-shaped words used for something else, e.g. component names', () => {
    expect(findCycleMentions('Grid → GridCells → CellTile → Cell', ROLES)).toEqual([])
  })

  it('ignores a two-role chain (a single arrow), not just zero-role chains', () => {
    expect(findCycleMentions('catalog → model', new Set(['catalog', 'model']))).toEqual([])
  })

  it('reports the 1-based line number for a mention on a later line', () => {
    const text = 'line one\nproduct → coder → cleaner\n'
    expect(findCycleMentions(text, ROLES)).toEqual([{ text: 'product → coder → cleaner', line: 2 }])
  })

  it('returns an empty array when no known roles are given', () => {
    expect(findCycleMentions('product → coder → cleaner', new Set())).toEqual([])
  })

  it('short-circuits on an empty role set rather than building an alternation that matches bare arrows', () => {
    // With no roles, the empty-alternation regex this would otherwise build
    // (`(?:)`) is not fully inert -- it still matches three or more bare
    // arrows with no role words at all, e.g. "a→→→b". The size-0 guard is
    // what stops that from being reported as a cycle mention.
    expect(findCycleMentions('a→→→b', new Set())).toEqual([])
  })

  it('escapes a role name that contains a regex-special character', () => {
    // A role name is normally plain letters, but escapeRegExp's job is to
    // make that safe regardless -- an unescaped `.` would match any
    // character, silently widening what counts as a cycle mention.
    const roles = new Set(['a.b', 'x', 'y'])
    expect(findCycleMentions('a.b → x → y', roles)).toEqual([{ text: 'a.b → x → y', line: 1 }])
    expect(findCycleMentions('aab → x → y', roles)).toEqual([])
  })

  it('finds more than one mention in the same text', () => {
    const text = 'first: product → coder → cleaner. second: architect → hardener → product.'
    const found = findCycleMentions(text, ROLES)
    expect(found).toEqual([
      { text: 'product → coder → cleaner', line: 1 },
      { text: 'architect → hardener → product', line: 1 },
    ])
  })

  it('ignores a mode-bearing pipeline sequence, since a parenthetical on any link marks it as a sequence rather than a cycle mention', () => {
    const text = 'product (SPECIFY) → coder → cleaner → architect (REVIEW) → hardener → product (VERIFY)'
    expect(findCycleMentions(text, ROLES)).toEqual([])
  })

  it('ignores a mode-bearing chain even when only one link carries a parenthetical', () => {
    expect(findCycleMentions('architect (REVIEW) → hardener → product', ROLES)).toEqual([])
  })

  it('does not extract a bare 3-role sub-chain hiding inside a longer mode-bearing sequence', () => {
    // "coder → cleaner → architect" is a bare 3-role sub-chain of the text
    // below, but it must not be reported: the surrounding mode-bearing chain
    // is matched greedily as one unit, so the bare sub-chain is never
    // considered as a separate match.
    const text = 'product (SPECIFY) → coder → cleaner → architect (REVIEW) → hardener → product (VERIFY)'
    expect(findCycleMentions(text, ROLES)).toEqual([])
  })

  it('reports only the bare chain when a line holds both a bare chain and a mode-bearing chain', () => {
    const text =
      'the cycle: product → coder → cleaner → architect → hardener → product. ' +
      'the pipeline: product (SPECIFY) → coder → cleaner → architect (REVIEW) → hardener → product (VERIFY).'
    expect(findCycleMentions(text, ROLES)).toEqual([
      { text: 'product → coder → cleaner → architect → hardener → product', line: 1 },
    ])
  })
})
