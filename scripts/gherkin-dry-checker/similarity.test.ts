import { describe, expect, it } from 'vitest'
import { jaccardSimilarity, slotPlaceholders, tokenize } from './similarity.ts'

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

  // Spelled out in full rather than sampled: the stopword list is data, and a
  // word silently dropping out of it quietly changes every similarity score in
  // the report without failing anything else.
  it('drops every word in the stopword list', () => {
    const everyStopword =
      'a an the is are was were be been being to of in on at by with and or that this it its i my ' +
      'should would has have had do does did for from up down'
    expect(tokenize(everyStopword)).toEqual([])
  })

  it('strips a multi-character placeholder name, not just its first character', () => {
    expect(tokenize('the blinker at <row_index> and <col>')).toEqual(['blinker'])
  })

  it('replaces a placeholder with a separator rather than splicing its neighbours together', () => {
    expect(tokenize('blinker<x>row')).toEqual(['blinker', 'row'])
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
