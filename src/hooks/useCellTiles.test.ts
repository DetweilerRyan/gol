import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { anchorHolds, anchorOffsetPx, computeAnchor, ANCHOR_DRIFT_CELLS } from '../cellAnchor'
import type { Camera } from '../camera'
import { coveringTileRange, nextTileRange, tileRangeHolds, TILE_SPAN_CELLS, EVICT_LAG_TILES } from '../cellTiles'
import type { ElementSize } from './useElementSize'
import { useCellTiles } from './useCellTiles'

// offsetX -30 (rather than the production default -32) sidesteps a
// coincidence at -32/cellSize 20/width 1280: -32 + 1280/20 lands on an exact
// tile boundary, so any nonzero x-axis pan immediately crosses a tile and
// there is no fixture left to exercise "stays within the same tile" or
// "stays within hysteresis" against. -30 has no such coincidence, confirmed
// below by asserting each precondition via the real functions rather than
// assuming it.
const camera: Camera = { offsetX: -30, offsetY: -22.5, cellSize: 20 }
const size: ElementSize = { width: 1280, height: 900 }

describe('useCellTiles', () => {
  it('derives range, anchor, cellSize and pixel offset from coveringTileRange + computeAnchor + anchorOffsetPx on first render', () => {
    const { result } = renderHook(() => useCellTiles(camera, size))

    const range = coveringTileRange(camera, size.width, size.height, TILE_SPAN_CELLS)
    const anchor = computeAnchor(camera, TILE_SPAN_CELLS)
    const { xPx, yPx } = anchorOffsetPx(anchor, camera)

    expect(result.current).toEqual({
      range,
      anchorX: anchor.x,
      anchorY: anchor.y,
      cellSize: camera.cellSize,
      offsetXPx: xPx,
      offsetYPx: yPx,
    })
  })

  it('reuses the same range and anchor object identity across a sub-cell pan (only the pixel offset moves)', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    const subCellPan: Camera = { ...camera, offsetX: camera.offsetX + 0.5, offsetY: camera.offsetY + 0.5 }
    // Confirmed rather than assumed: a sub-cell pan must not move any tile
    // boundary on either axis.
    const initialRange = coveringTileRange(camera, size.width, size.height, TILE_SPAN_CELLS)
    const subCellRange = coveringTileRange(subCellPan, size.width, size.height, TILE_SPAN_CELLS)
    expect(subCellRange).toEqual(initialRange)

    rerender({ camera: subCellPan })

    expect(result.current.range).toBe(before.range)
    expect(result.current.anchorX).toBe(before.anchorX)
    expect(result.current.anchorY).toBe(before.anchorY)
    expect(result.current.offsetXPx).not.toBe(before.offsetXPx)
    expect(result.current.offsetYPx).not.toBe(before.offsetYPx)
  })

  it('reuses the same range object across a multi-cell pan that stays within tile eviction hysteresis', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    // Confirmed via tileRangeHolds below rather than assumed, so this test
    // fails loudly (not vacuously) if TILE_SPAN_CELLS or EVICT_LAG_TILES ever
    // change underneath it.
    const withinHysteresisPan: Camera = { ...camera, offsetX: camera.offsetX + 2 }
    const initialRange = coveringTileRange(camera, size.width, size.height, TILE_SPAN_CELLS)
    const required = coveringTileRange(withinHysteresisPan, size.width, size.height, TILE_SPAN_CELLS)
    expect(tileRangeHolds(initialRange, required, EVICT_LAG_TILES)).toBe(true)

    rerender({ camera: withinHysteresisPan })

    expect(result.current.range).toBe(before.range)
  })

  it.each<['x' | 'y', (c: Camera) => Camera]>([
    ['x', (c) => ({ ...c, offsetX: c.offsetX + 50 })],
    ['y', (c) => ({ ...c, offsetY: c.offsetY + 50 })],
  ])('rebuilds onto a fresh range once a pan crosses a tile boundary beyond hysteresis on the %s axis', (_, pan) => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    const crossingPan = pan(camera)
    const initialRange = coveringTileRange(camera, size.width, size.height, TILE_SPAN_CELLS)
    const required = coveringTileRange(crossingPan, size.width, size.height, TILE_SPAN_CELLS)
    expect(tileRangeHolds(initialRange, required, EVICT_LAG_TILES)).toBe(false)
    // Not exactly `required`: nextTileRange retains up to EVICT_LAG_TILES of
    // `initialRange` on the trailing side rather than replacing it outright
    // (see cellTiles.ts's axisRetained), so the hook's job here is to have
    // actually called nextTileRange -- pin that by comparing against it
    // directly rather than re-deriving the retained bound by hand.
    const expectedRange = nextTileRange(initialRange, crossingPan, size.width, size.height)
    expect(expectedRange).not.toEqual(required)

    rerender({ camera: crossingPan })

    expect(result.current.range).not.toBe(before.range)
    expect(result.current.range).toEqual(expectedRange)
  })

  // A rebuild's trailing edge retains up to EVICT_LAG_TILES on the side
  // `previous` lay -- the OPPOSITE side from the direction of travel (see
  // cellTiles.ts's axisRetained) -- so a pan that CONTINUES in the same
  // direction sees zero slack on its own (leading) side and rebuilds again
  // almost immediately, while a pan that REVERSES spends that trailing
  // slack and holds. This replaces a pre-fix test of the same name that
  // claimed the opposite -- under the old "replace with `required` exactly"
  // policy, either direction held the same amount of margin, since both
  // edges reset to zero margin on every rebuild; retention breaks that
  // symmetry, so the two directions now need pinning separately.
  it('after a rebuild, a REVERSING pan within EVICT_LAG_TILES holds the sticky range', () => {
    const stickyCamera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera: stickyCamera },
    })

    const crossingPan: Camera = { ...stickyCamera, offsetX: stickyCamera.offsetX + 50 }
    rerender({ camera: crossingPan })
    const rebuiltRange = result.current.range

    const reversingPan: Camera = { ...crossingPan, offsetX: crossingPan.offsetX - 2 }
    const required = coveringTileRange(reversingPan, size.width, size.height, TILE_SPAN_CELLS)
    expect(tileRangeHolds(rebuiltRange, required, EVICT_LAG_TILES)).toBe(true)
    // ...and the fresh covering set genuinely differs, so a hook that lost
    // its sticky anchor and recomputed from scratch every render would be
    // caught rather than passing by coincidence.
    expect(required).not.toEqual(rebuiltRange)

    rerender({ camera: reversingPan })

    expect(result.current.range).toBe(rebuiltRange)
  })

  // The companion case: CONTINUING in the same direction after a rebuild
  // spends the trailing tolerance the reversal above relies on, so it
  // rebuilds again rather than staying sticky.
  it('after a rebuild, a CONTINUING pan in the same direction rebuilds again rather than staying sticky', () => {
    const stickyCamera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera: stickyCamera },
    })

    const crossingPan: Camera = { ...stickyCamera, offsetX: stickyCamera.offsetX + 50 }
    rerender({ camera: crossingPan })
    const rebuiltRange = result.current.range

    const continuingPan: Camera = { ...crossingPan, offsetX: crossingPan.offsetX + 2 }
    const required = coveringTileRange(continuingPan, size.width, size.height, TILE_SPAN_CELLS)
    expect(tileRangeHolds(rebuiltRange, required, EVICT_LAG_TILES)).toBe(false)

    rerender({ camera: continuingPan })

    expect(result.current.range).not.toBe(rebuiltRange)
    expect(result.current.range).toEqual(nextTileRange(rebuiltRange, continuingPan, size.width, size.height))
  })

  it('rebuilds the range on a cellSize change (zoom) even when the pan offset itself is unchanged', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    // A big zoom-out (cellSize 20 -> 8) more than doubles the viewport's
    // extent in cells, which grows the covering tile set well beyond one
    // tile of hysteresis on every side.
    const zoomedOut: Camera = { ...camera, cellSize: 8 }
    const initialRange = coveringTileRange(camera, size.width, size.height, TILE_SPAN_CELLS)
    const required = coveringTileRange(zoomedOut, size.width, size.height, TILE_SPAN_CELLS)
    expect(tileRangeHolds(initialRange, required, EVICT_LAG_TILES)).toBe(false)

    rerender({ camera: zoomedOut })

    expect(result.current.cellSize).toBe(8)
    expect(result.current.range).not.toBe(before.range)
    expect(result.current.range).toEqual(required)
  })

  it('keeps the same anchor object across a pan that stays within ANCHOR_DRIFT_CELLS on both axes', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    // 100 cells of margin below the drift bound, so the ~2-cell offset
    // between `camera` and its own tile-aligned anchor (see computeAnchor)
    // can't push this over the edge and turn the test flaky.
    const withinDriftPan: Camera = {
      ...camera,
      offsetX: camera.offsetX + (ANCHOR_DRIFT_CELLS - 100),
      offsetY: camera.offsetY + (ANCHOR_DRIFT_CELLS - 100),
    }
    const initialAnchor = computeAnchor(camera, TILE_SPAN_CELLS)
    expect(anchorHolds(initialAnchor, withinDriftPan)).toBe(true)

    rerender({ camera: withinDriftPan })

    expect(result.current.anchorX).toBe(before.anchorX)
    expect(result.current.anchorY).toBe(before.anchorY)
  })

  it.each<['x' | 'y', (c: Camera) => Camera]>([
    ['x', (c) => ({ ...c, offsetX: c.offsetX + (ANCHOR_DRIFT_CELLS + 100) })],
    ['y', (c) => ({ ...c, offsetY: c.offsetY + (ANCHOR_DRIFT_CELLS + 100) })],
  ])('re-quantises the anchor once a pan drifts beyond ANCHOR_DRIFT_CELLS on the %s axis', (_, pan) => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera },
    })

    const beyondDriftPan = pan(camera)
    const initialAnchor = computeAnchor(camera, TILE_SPAN_CELLS)
    expect(anchorHolds(initialAnchor, beyondDriftPan)).toBe(false)

    rerender({ camera: beyondDriftPan })

    const rebasedAnchor = computeAnchor(beyondDriftPan, TILE_SPAN_CELLS)
    expect(result.current.anchorX).toBe(rebasedAnchor.x)
    expect(result.current.anchorY).toBe(rebasedAnchor.y)

    // The returned offset must correspond to the rebased anchor, never a
    // stale pairing with the pre-rebase one.
    const { xPx, yPx } = anchorOffsetPx(rebasedAnchor, beyondDriftPan)
    expect(result.current.offsetXPx).toBe(xPx)
    expect(result.current.offsetYPx).toBe(yPx)
  })

  it('keeps the re-quantised anchor as the sticky anchor: a later within-drift pan does not re-derive it', () => {
    // Regression for a mutant that no-ops the setAnchor(currentAnchor) call
    // inside useCellTiles: the *return value* of the render that re-quantises
    // is unaffected by that mutant (currentAnchor is used directly, never
    // anchor), so this needs a second render to observe -- the same shape as
    // the sticky-range regression test above, and the same shape
    // useCellLattice.test.ts used for its own sticky-anchor regression.
    // Without the state update, useCellTiles's `anchor` state is stuck at
    // the pre-rebase anchor forever, so every later render re-fails
    // anchorHolds against that stale anchor and recomputes computeAnchor
    // from scratch on every render -- still numerically correct for a lone
    // render, but it silently defeats the sticky anchor (re-quantising every
    // ANCHOR_DRIFT_CELLS instead of, worst case, every render), which is the
    // whole reason cellAnchor.ts exists.
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellTiles(camera, size), {
      initialProps: { camera },
    })

    const beyondDriftPan: Camera = { ...camera, offsetX: camera.offsetX + (ANCHOR_DRIFT_CELLS + 100) }
    rerender({ camera: beyondDriftPan })
    const rebasedAnchorX = result.current.anchorX
    const rebasedAnchorY = result.current.anchorY

    // Well within the *rebased* anchor's drift budget -- confirmed by
    // anchorHolds below rather than assumed -- and the freshly-computed
    // alternative is confirmed to actually differ, so this test would fail
    // loudly (not pass vacuously) if ANCHOR_DRIFT_CELLS or the floor
    // arithmetic ever changed underneath it.
    const withinNewDriftPan: Camera = { ...beyondDriftPan, offsetX: beyondDriftPan.offsetX + 100 }
    const rebasedAnchor = { x: rebasedAnchorX, y: rebasedAnchorY }
    expect(anchorHolds(rebasedAnchor, withinNewDriftPan)).toBe(true)
    const freshAnchorForThirdCamera = computeAnchor(withinNewDriftPan, TILE_SPAN_CELLS)
    expect(freshAnchorForThirdCamera.x).not.toBe(rebasedAnchorX)

    rerender({ camera: withinNewDriftPan })

    expect(result.current.anchorX).toBe(rebasedAnchorX)
    expect(result.current.anchorY).toBe(rebasedAnchorY)
  })

  it('produces a finite range from the 0x0 pre-measurement viewport', () => {
    const unmeasured: ElementSize = { width: 0, height: 0 }
    const { result } = renderHook(() => useCellTiles(camera, unmeasured))

    const range = coveringTileRange(camera, 0, 0, TILE_SPAN_CELLS)
    expect(result.current.range).toEqual(range)
    expect(range.minTileX).toBeLessThanOrEqual(range.maxTileX)
    expect(range.minTileY).toBeLessThanOrEqual(range.maxTileY)
  })
})
