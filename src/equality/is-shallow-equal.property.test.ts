import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { isShallowEqual } from './is-shallow-equal'

// Covers Date/Map/Set alongside the arbitrary's default primitives, arrays,
// and plain objects, so the property runs also exercise every container
// kind structurallyEqual dispatches on.
const anyValue = fc.anything({ withDate: true, withMap: true, withSet: true })

const primitiveValue = fc.oneof(fc.integer(), fc.string(), fc.boolean(), fc.constant(null), fc.constant(undefined))
// A record that is shallow by construction -- every value is a primitive,
// so a shallow clone (structural copy of the top level only) is guaranteed
// to be shallowly equal to the original.
const shallowRecord = fc.dictionary(fc.string(), primitiveValue)

describe('isShallowEqual (property)', () => {
  it.prop([anyValue])('is reflexive', (x) => {
    expect(isShallowEqual(x, x)).toBe(true)
  })

  // The property that makes the asymmetric-mismatch defect class (e.g. the
  // Date-vs-{} bug fixed in this restructure) structurally impossible to
  // regress: any future change that special-cases one operand's kind over
  // the other's will fail this before it can ship.
  it.prop([anyValue, anyValue])('is symmetric', (a, b) => {
    expect(isShallowEqual(a, b)).toBe(isShallowEqual(b, a))
  })

  it.prop([shallowRecord])('is true for a structurally-cloned shallow record', (record) => {
    const clone = { ...record }
    expect(isShallowEqual(record, clone)).toBe(true)
  })
})
