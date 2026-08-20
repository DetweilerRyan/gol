import { describe, expect, it } from 'vitest'
import { DEFAULT_CELL_SIZE, type Camera } from './camera'
import type { ContentBounds } from './gameOfLife'
import { computeScrollbarMetrics, computeThumbGeometry, panCameraByScrollbarDrag } from './scrollbars'

const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

describe('computeScrollbarMetrics', () => {
  it('fills the entire track on both axes when there is no content', () => {
    const metrics = computeScrollbarMetrics(camera, null, 800, 600)
    expect(metrics).toEqual({
      horizontal: { thumbRatio: 1, thumbOffsetRatio: 0 },
      vertical: { thumbRatio: 1, thumbOffsetRatio: 0 },
    })
  })

  it('still fills the track when content is smaller than the viewport', () => {
    const bounds: ContentBounds = { minX: 5, maxX: 6, minY: 5, maxY: 6 }
    const metrics = computeScrollbarMetrics(camera, bounds, 800, 600)
    expect(metrics.horizontal.thumbRatio).toBe(1)
    expect(metrics.vertical.thumbRatio).toBe(1)
  })

  it('shrinks only the horizontal thumb when content is wider than the viewport', () => {
    // Content spans 200 world units * 20px cellSize = 4000px wide, 2 units tall.
    const bounds: ContentBounds = { minX: 0, maxX: 200, minY: 0, maxY: 2 }
    const metrics = computeScrollbarMetrics(camera, bounds, 800, 600)
    expect(metrics.horizontal.thumbRatio).toBeCloseTo(800 / 4000)
    expect(metrics.vertical.thumbRatio).toBe(1)
  })

  it('keeps the thumb offset ratio within [0, 1] when panned far from all content', () => {
    const panned: Camera = { offsetX: 500, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
    const bounds: ContentBounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    const metrics = computeScrollbarMetrics(panned, bounds, 800, 600)
    expect(metrics.horizontal.thumbOffsetRatio).toBe(1)
    expect(metrics.horizontal.thumbRatio).toBeLessThan(1)
  })

  it('bottoms the offset ratio out at 0 when content sits entirely off the opposite edge', () => {
    // Content entirely to the RIGHT of the viewport this time (opposite of the case above).
    const bounds: ContentBounds = { minX: 500, maxX: 501, minY: 0, maxY: 1 }
    const metrics = computeScrollbarMetrics(camera, bounds, 800, 600)
    expect(metrics.horizontal.thumbOffsetRatio).toBe(0)
  })
})

describe('computeThumbGeometry', () => {
  it('sizes and positions the thumb proportionally to the track in the normal case', () => {
    const geometry = computeThumbGeometry({ thumbRatio: 0.5, thumbOffsetRatio: 0.5 }, 800)
    expect(geometry.lengthPx).toBe(400)
    expect(geometry.offsetPx).toBe(200)
  })

  it('clamps the thumb up to MIN_THUMB_PX when the ratio would make it too small to grab', () => {
    const geometry = computeThumbGeometry({ thumbRatio: 0.01, thumbOffsetRatio: 1 }, 800)
    expect(geometry.lengthPx).toBe(24)
    expect(geometry.offsetPx).toBe(776)
  })

  it('clamps the thumb down to the track length when MIN_THUMB_PX would exceed a small track', () => {
    const geometry = computeThumbGeometry({ thumbRatio: 1, thumbOffsetRatio: 0 }, 20)
    expect(geometry.lengthPx).toBe(20)
    expect(geometry.offsetPx).toBe(0)
  })
})

describe('panCameraByScrollbarDrag', () => {
  it('increases offsetX when dragging the horizontal thumb, the opposite sign from drag-to-pan', () => {
    const next = panCameraByScrollbarDrag(camera, 'x', 50, 1)
    expect(next.offsetX).toBeGreaterThan(camera.offsetX)
    expect(next.offsetY).toBe(camera.offsetY)
  })

  it('increases offsetY when dragging the vertical thumb', () => {
    const next = panCameraByScrollbarDrag(camera, 'y', 50, 1)
    expect(next.offsetY).toBeGreaterThan(camera.offsetY)
  })

  it('scales the offset delta inversely with thumbRatio', () => {
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 1).offsetX).toBeCloseTo(2.5)
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 0.5).offsetX).toBeCloseTo(5)
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 0.25).offsetX).toBeCloseTo(10)
  })

  it('is a no-op when thumbRatio is zero or negative', () => {
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 0)).toBe(camera)
    expect(panCameraByScrollbarDrag(camera, 'x', 50, -1)).toBe(camera)
  })

  it('preserves cellSize', () => {
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 1).cellSize).toBe(camera.cellSize)
  })
})
