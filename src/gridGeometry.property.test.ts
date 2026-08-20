import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { computeMajorGridlines, computeVisibleRange, isMajorGridline, type VisibleRange } from './gridGeometry'
import { cameraArbitrary as camera } from './test-support/arbitraries'

const worldCoord = fc.integer({ min: -10_000, max: 10_000 })

describe('computeVisibleRange (property)', () => {
  const viewportDimension = fc.integer({ min: 0, max: 4000 })

  it.prop([camera, viewportDimension, viewportDimension])(
    'always produces a well-formed, non-inverted range',
    (cam, width, height) => {
      const range = computeVisibleRange(cam, width, height)
      expect(range.minX).toBeLessThanOrEqual(range.maxX)
      expect(range.minY).toBeLessThanOrEqual(range.maxY)
    },
  )

  it.prop([camera, viewportDimension, viewportDimension])(
    'is always wide/tall enough to cover the requested viewport size in cells',
    (cam, width, height) => {
      const range = computeVisibleRange(cam, width, height)
      expect(range.maxX - range.minX).toBeGreaterThanOrEqual(width / cam.cellSize)
      expect(range.maxY - range.minY).toBeGreaterThanOrEqual(height / cam.cellSize)
    },
  )
})

describe('isMajorGridline (property)', () => {
  it.prop([worldCoord])('is periodic with period 10', (n) => {
    expect(isMajorGridline(n + 10)).toBe(isMajorGridline(n))
    expect(isMajorGridline(n - 10)).toBe(isMajorGridline(n))
  })

  it.prop([fc.integer({ min: -10_000, max: 10_000 })])('is true for every exact multiple of 10', (n) => {
    expect(isMajorGridline(n * 10)).toBe(true)
  })
})

describe('computeMajorGridlines (property)', () => {
  const rangeEndpoint = fc.integer({ min: -500, max: 500 })

  function bruteForceGridlines(min: number, max: number): number[] {
    const lines: number[] = []
    for (let i = min; i <= max; i++) {
      if (isMajorGridline(i)) lines.push(i)
    }
    return lines
  }

  it.prop([rangeEndpoint, rangeEndpoint, rangeEndpoint, rangeEndpoint])(
    'matches a brute-force scan of every coordinate in range, on both axes',
    (a, b, c, d) => {
      const range: VisibleRange = {
        minX: Math.min(a, b),
        maxX: Math.max(a, b),
        minY: Math.min(c, d),
        maxY: Math.max(c, d),
      }
      const gridlines = computeMajorGridlines(range)
      expect(gridlines.x).toEqual(bruteForceGridlines(range.minX, range.maxX))
      expect(gridlines.y).toEqual(bruteForceGridlines(range.minY, range.maxY))
    },
  )

  it.prop([rangeEndpoint, rangeEndpoint])('every returned gridline is within range and a multiple of 10', (a, b) => {
    const range: VisibleRange = { minX: Math.min(a, b), maxX: Math.max(a, b), minY: 0, maxY: 0 }
    for (const x of computeMajorGridlines(range).x) {
      expect(x).toBeGreaterThanOrEqual(range.minX)
      expect(x).toBeLessThanOrEqual(range.maxX)
      expect(isMajorGridline(x)).toBe(true)
    }
  })
})
