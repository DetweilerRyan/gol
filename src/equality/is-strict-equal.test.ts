import { describe, expect, it } from 'vitest'
import { isStrictEqual } from './is-strict-equal'

describe('isStrictEqual', () => {
  it('does not coerce strings', () => {
    // @ts-expect-error
    expect(isStrictEqual('1', 1)).toBe(false)
    // @ts-expect-error
    expect(isStrictEqual('0', 0)).toBe(false)
    // @ts-expect-error
    expect(isStrictEqual('true', true)).toBe(false)
    // @ts-expect-error
    expect(isStrictEqual('false', false)).toBe(false)
  })

  it('treats NaN as equal to itself, unlike ===', () => {
    expect(isStrictEqual(NaN, NaN)).toBe(true)
  })

  it('treats 0 and -0 as distinct, unlike ===', () => {
    expect(isStrictEqual(0, -0)).toBe(false)
  })
})
