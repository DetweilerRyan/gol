import { describe, expect, it } from 'vitest'
import { checkNonEmpty } from './gate-report.ts'

describe('checkNonEmpty', () => {
  it('reports one failure carrying check/file/message when the list is empty', () => {
    expect(checkNonEmpty([], 'rules-found', '(none)', 'no rule files were found')).toEqual([
      { check: 'rules-found', file: '(none)', message: 'no rule files were found' },
    ])
  })

  it('passes when the list has at least one item', () => {
    expect(checkNonEmpty(['a rule'], 'rules-found', '(none)', 'no rule files were found')).toEqual([])
  })
})
