import { describe, expect, it } from 'vitest'
import { jaccardSimilarity, slotPlaceholders, tokenize } from './similarity.mjs'

describe('slotPlaceholders', () => {
  it('replaces distinct placeholder names with ordered generic slots', () => {
    expect(slotPlaceholders('the player is in room <destination_room>')).toBe('the player is in room <_1>')
  })

  it('normalizes two differently-named placeholders to the same shape', () => {
    const a = slotPlaceholders('the player is in room <destination_room>')
    const b = slotPlaceholders('the player is in room <expected_player_room>')
    expect(a).toBe(b)
  })

  it('assigns the same slot to a repeated placeholder name', () => {
    expect(slotPlaceholders('<x> plus <x> is double <x>')).toBe('<_1> plus <_1> is double <_1>')
  })

  it('leaves text with no placeholders unchanged', () => {
    expect(slotPlaceholders('a plain step')).toBe('a plain step')
  })
})

describe('tokenize', () => {
  it('lowercases and splits on non-alphanumeric characters', () => {
    expect(tokenize('I toggle the Cell at (2, 3)')).toEqual(['toggle', 'cell', '2', '3'])
  })

  it('removes placeholders entirely rather than tokenizing their names', () => {
    expect(tokenize('a horizontal blinker centered at (<x>, <y>)')).toEqual(['horizontal', 'blinker', 'centered'])
  })

  it('drops stopwords', () => {
    expect(tokenize('the cell should end up alive')).toEqual(['cell', 'end', 'alive'])
  })

  it('returns an empty array for an empty string', () => {
    expect(tokenize('')).toEqual([])
  })
})

describe('jaccardSimilarity', () => {
  it('is 1 for identical token sets', () => {
    expect(jaccardSimilarity(['a', 'b'], ['a', 'b'])).toBe(1)
  })

  it('is 0 for disjoint token sets', () => {
    expect(jaccardSimilarity(['a', 'b'], ['c', 'd'])).toBe(0)
  })

  it('is 0 for two empty token sets', () => {
    expect(jaccardSimilarity([], [])).toBe(0)
  })

  it('computes shared over union for partial overlap', () => {
    // shared: {b, c} = 2, union: {a, b, c, d} = 4
    expect(jaccardSimilarity(['a', 'b', 'c'], ['b', 'c', 'd'])).toBeCloseTo(0.5)
  })

  it('ignores duplicate tokens within one side (set semantics)', () => {
    expect(jaccardSimilarity(['a', 'a', 'b'], ['a', 'b'])).toBe(1)
  })
})
