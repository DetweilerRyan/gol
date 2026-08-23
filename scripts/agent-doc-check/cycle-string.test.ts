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

  it('finds more than one mention in the same text', () => {
    const text = 'first: product → coder → cleaner. second: architect → hardener → product.'
    const found = findCycleMentions(text, ROLES)
    expect(found).toEqual([
      { text: 'product → coder → cleaner', line: 1 },
      { text: 'architect → hardener → product', line: 1 },
    ])
  })
})
