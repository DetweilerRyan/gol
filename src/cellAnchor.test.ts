import { describe, expect, it } from 'vitest'
import type { Camera } from './camera'
import {
  ANCHOR_DRIFT_CELLS,
  anchorHolds,
  anchorOffsetPx,
  cellOffsetPx,
  computeAnchor,
  nextAnchor,
  type Anchor,
} from './cellAnchor'

describe('computeAnchor', () => {
  it('floors a positive fractional offset to the tile-aligned boundary below it', () => {
    expect(computeAnchor({ offsetX: 10.7, offsetY: 0, cellSize: 20 }, 4)).toEqual({ x: 8, y: 0 })
  })

  it('floors a negative fractional offset toward negative infinity, not toward zero', () => {
    // floor(-10.7 / 4) = floor(-2.675) = -3 -> -12, not floor(-2.675) truncated to -2 -> -8.
    expect(computeAnchor({ offsetX: -10.7, offsetY: 0, cellSize: 20 }, 4)).toEqual({ x: -12, y: 0 })
  })

  it('leaves an exact tile-boundary offset unchanged, on both sides of zero', () => {
    expect(computeAnchor({ offsetX: 8, offsetY: -8, cellSize: 20 }, 4)).toEqual({ x: 8, y: -8 })
  })

  it('computes x and y independently', () => {
    expect(computeAnchor({ offsetX: 13, offsetY: -13, cellSize: 20 }, 4)).toEqual({ x: 12, y: -16 })
  })
})

describe('anchorHolds', () => {
  const anchor: Anchor = { x: 8, y: -12 }

  it('holds when the camera sits exactly on the anchor', () => {
    expect(anchorHolds(anchor, { offsetX: 8, offsetY: -12, cellSize: 20 })).toBe(true)
  })

  it('holds at exactly ANCHOR_DRIFT_CELLS of drift in the positive direction', () => {
    expect(anchorHolds(anchor, { offsetX: anchor.x + ANCHOR_DRIFT_CELLS, offsetY: anchor.y, cellSize: 20 })).toBe(true)
  })

  it('holds at exactly ANCHOR_DRIFT_CELLS of drift in the negative direction', () => {
    expect(anchorHolds(anchor, { offsetX: anchor.x - ANCHOR_DRIFT_CELLS, offsetY: anchor.y, cellSize: 20 })).toBe(true)
  })

  it('fails just past ANCHOR_DRIFT_CELLS of drift in the positive direction', () => {
    expect(anchorHolds(anchor, { offsetX: anchor.x + ANCHOR_DRIFT_CELLS + 1, offsetY: anchor.y, cellSize: 20 })).toBe(
      false,
    )
  })

  it('fails just past ANCHOR_DRIFT_CELLS of drift in the negative direction', () => {
    expect(anchorHolds(anchor, { offsetX: anchor.x - ANCHOR_DRIFT_CELLS - 1, offsetY: anchor.y, cellSize: 20 })).toBe(
      false,
    )
  })

  it('fails on a y-axis breach even when x sits exactly on the anchor', () => {
    // Distinct from the x-only cases above so a comparator wired to the wrong
    // axis (or an implementation that only ever checks x) cannot pass both.
    expect(anchorHolds(anchor, { offsetX: anchor.x, offsetY: anchor.y + ANCHOR_DRIFT_CELLS + 1, cellSize: 20 })).toBe(
      false,
    )
  })

  it('holds at exactly ANCHOR_DRIFT_CELLS of drift on the y-axis', () => {
    // Mirrors the x-axis exact-boundary cases above -- without it, the y-axis
    // comparison's `<=` could regress to `<` (rejecting the boundary itself)
    // with every other case here still passing.
    expect(anchorHolds(anchor, { offsetX: anchor.x, offsetY: anchor.y + ANCHOR_DRIFT_CELLS, cellSize: 20 })).toBe(true)
  })
})

describe('nextAnchor', () => {
  const spanCells = 4
  const previous: Anchor = { x: 8, y: -12 }

  it('keeps the previous anchor by reference exactly when it still holds', () => {
    const camera: Camera = { offsetX: previous.x + 10, offsetY: previous.y - 10, cellSize: 20 }
    expect(nextAnchor(previous, camera, spanCells)).toBe(previous)
  })

  it('re-quantises onto a fresh, tile-aligned anchor when drift exceeds ANCHOR_DRIFT_CELLS', () => {
    const camera: Camera = { offsetX: previous.x + ANCHOR_DRIFT_CELLS + 100, offsetY: previous.y, cellSize: 20 }
    const next = nextAnchor(previous, camera, spanCells)
    expect(next).not.toBe(previous)
    expect(next).toEqual(computeAnchor(camera, spanCells))
  })

  it('is idempotent by reference -- applying it to its own result cannot re-quantise again', () => {
    const camera: Camera = { offsetX: previous.x + ANCHOR_DRIFT_CELLS + 100, offsetY: previous.y, cellSize: 20 }
    const first = nextAnchor(previous, camera, spanCells)
    expect(nextAnchor(first, camera, spanCells)).toBe(first)
  })
})

describe('anchorOffsetPx', () => {
  it('matches worldToScreen applied to the anchor world coordinates', () => {
    const anchor: Anchor = { x: 8, y: -12 }
    const camera: Camera = { offsetX: 3, offsetY: -5, cellSize: 20 }
    // worldToScreen: (worldX - offsetX) * cellSize, (worldY - offsetY) * cellSize
    expect(anchorOffsetPx(anchor, camera)).toEqual({
      xPx: (anchor.x - camera.offsetX) * camera.cellSize,
      yPx: (anchor.y - camera.offsetY) * camera.cellSize,
    })
  })
})

describe('cellOffsetPx', () => {
  it('subtracts the anchor coordinate before scaling, distinguishing it from addition', () => {
    // anchorCoordinate deliberately nonzero: at anchorCoordinate = 0,
    // (w - a) and (w + a) coincide, which would let a sign-flipped
    // implementation pass unnoticed.
    expect(cellOffsetPx(10, 3, 2)).toBe(14) // (10 - 3) * 2
  })

  it('handles a negative world coordinate relative to a positive anchor', () => {
    expect(cellOffsetPx(-5, 3, 2)).toBe(-16) // (-5 - 3) * 2
  })

  it('handles a negative anchor coordinate', () => {
    expect(cellOffsetPx(5, -3, 2)).toBe(16) // (5 - (-3)) * 2
  })

  it('is zero exactly when the world coordinate equals the anchor', () => {
    expect(cellOffsetPx(7, 7, 20)).toBe(0)
  })
})
