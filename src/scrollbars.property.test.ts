import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import type { ContentBounds } from './gameOfLife'
import { computeScrollbarMetrics, computeThumbGeometry, panCameraByScrollbarDrag } from './scrollbars'
import { cameraArbitrary as camera, pixelArbitrary as pixel } from './test-support/arbitraries'

const viewportDimension = fc.integer({ min: 1, max: 4000 })
const boundsCoord = fc.integer({ min: -2000, max: 2000 })

// Half-open bounds, matching what computeContentBounds actually produces:
// max is always at least min + 1, and null stands for an empty grid.
const contentBounds: fc.Arbitrary<ContentBounds | null> = fc.oneof(
  fc.constant(null),
  fc.tuple(boundsCoord, boundsCoord, boundsCoord, boundsCoord).map(([a, b, c, d]) => ({
    minX: Math.min(a, b),
    maxX: Math.max(a, b) + 1,
    minY: Math.min(c, d),
    maxY: Math.max(c, d) + 1,
  })),
)

describe('computeScrollbarMetrics (property)', () => {
  // The union-with-viewport extent exists precisely so both ratios stay
  // renderable with no special-casing, whatever the camera and content are
  // doing -- including panned entirely away from every live cell. A unit test
  // can only pin that down one camera position at a time.
  it.prop([camera, contentBounds, viewportDimension, viewportDimension])(
    'always yields a thumb ratio in (0, 1] and an offset ratio in [0, 1], on both axes',
    (cam, bounds, width, height) => {
      const metrics = computeScrollbarMetrics(cam, bounds, width, height)
      for (const axis of [metrics.horizontal, metrics.vertical]) {
        expect(axis.thumbRatio).toBeGreaterThan(0)
        expect(axis.thumbRatio).toBeLessThanOrEqual(1)
        expect(axis.thumbOffsetRatio).toBeGreaterThanOrEqual(0)
        expect(axis.thumbOffsetRatio).toBeLessThanOrEqual(1)
      }
    },
  )

  it.prop([camera, viewportDimension, viewportDimension])(
    'fills both tracks exactly when there is no content, for any camera',
    (cam, width, height) => {
      expect(computeScrollbarMetrics(cam, null, width, height)).toEqual({
        horizontal: { thumbRatio: 1, thumbOffsetRatio: 0 },
        vertical: { thumbRatio: 1, thumbOffsetRatio: 0 },
      })
    },
  )
})

describe('computeThumbGeometry (property)', () => {
  const ratio = fc.float({ min: 0, max: 1, noNaN: true })
  const trackLengthPx = fc.integer({ min: 0, max: 4000 })

  it.prop([ratio, ratio, trackLengthPx])(
    'the thumb never extends past the track, in either length or offset',
    (thumbRatio, thumbOffsetRatio, track) => {
      const { lengthPx, offsetPx } = computeThumbGeometry({ thumbRatio, thumbOffsetRatio }, track)
      expect(lengthPx).toBeLessThanOrEqual(track)
      expect(offsetPx).toBeGreaterThanOrEqual(0)
      // +epsilon guards against float rounding in offsetRatio * (track - lengthPx), not a real slack in the invariant.
      expect(offsetPx + lengthPx).toBeLessThanOrEqual(track + 1e-9)
    },
  )
})

describe('panCameraByScrollbarDrag (property)', () => {
  const axis = fc.constantFrom<'x' | 'y'>('x', 'y')
  const thumbRatio = fc.float({ min: Math.fround(0.001), max: 1, noNaN: true })

  it.prop([camera, axis, pixel, thumbRatio])(
    'only ever moves the dragged axis, leaving the other offset and the zoom level alone',
    (cam, dragAxis, deltaTrackPx, ratio) => {
      const next = panCameraByScrollbarDrag(cam, dragAxis, deltaTrackPx, ratio)
      expect(next.cellSize).toBe(cam.cellSize)
      expect(dragAxis === 'x' ? next.offsetY : next.offsetX).toBe(dragAxis === 'x' ? cam.offsetY : cam.offsetX)
    },
  )

  it.prop([camera, axis, pixel, thumbRatio])(
    'is reversible: dragging back by the same distance restores the original offset',
    (cam, dragAxis, deltaTrackPx, ratio) => {
      const there = panCameraByScrollbarDrag(cam, dragAxis, deltaTrackPx, ratio)
      const back = panCameraByScrollbarDrag(there, dragAxis, -deltaTrackPx, ratio)
      expect(back.offsetX).toBeCloseTo(cam.offsetX)
      expect(back.offsetY).toBeCloseTo(cam.offsetY)
    },
  )

  it.prop([camera, axis, pixel])('is a no-op for any non-positive thumb ratio', (cam, dragAxis, deltaTrackPx) => {
    expect(panCameraByScrollbarDrag(cam, dragAxis, deltaTrackPx, 0)).toBe(cam)
    expect(panCameraByScrollbarDrag(cam, dragAxis, deltaTrackPx, -1)).toBe(cam)
  })
})
