import { describe, expect, it } from 'vitest'
import { displaySite } from './report-format.ts'

describe('displaySite', () => {
  it('strips the feature-name prefix when the seedKey carries one', () => {
    expect(displaySite('cell-life-and-death.feature', 'cell-life-and-death.feature:0:state')).toBe('0:state')
  })

  it('leaves the seedKey untouched when it does not start with the given feature prefix', () => {
    expect(displaySite('cell-life-and-death.feature', 'other-feature.feature:0:state')).toBe(
      'other-feature.feature:0:state',
    )
  })

  it('leaves the seedKey untouched when it matches the feature name with no trailing colon', () => {
    expect(displaySite('cell-life-and-death.feature', 'cell-life-and-death.feature')).toBe(
      'cell-life-and-death.feature',
    )
  })

  it('strips only the first occurrence of the prefix, not a repeated one', () => {
    expect(
      displaySite('cell-life-and-death.feature', 'cell-life-and-death.feature:cell-life-and-death.feature:0:state'),
    ).toBe('cell-life-and-death.feature:0:state')
  })
})
