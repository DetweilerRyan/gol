import { useState } from 'react'
import { computeAnchor, nextAnchor, anchorOffsetPx, type Anchor } from '../cellAnchor'
import { coveringTileRange, nextTileRange, TILE_SPAN_CELLS, type TileRange } from '../cellTiles'
import type { Camera } from '../camera'
import type { ElementSize } from './useElementSize'

export interface CellTilesView {
  range: TileRange
  anchorX: number
  anchorY: number
  cellSize: number
  offsetXPx: number
  offsetYPx: number
}

// Thin adapter over cellTiles.ts and cellAnchor.ts: replaces
// useCellLattice.ts now that mounting coverage and precision bounding are two
// independent concerns (see cellAnchor.ts's header) instead of one lattice
// origin doing both jobs. Holds two sticky anchors -- a TileRange (via
// useState) and an Anchor (via a second, independent useState) -- and
// delegates every actual rule to nextTileRange/nextAnchor; this hook decides
// nothing about tiling or precision itself.
//
// Both coverage checks run during render, not in a useEffect, for the same
// reason useCellLattice.ts's did: nextTileRange/nextAnchor each return either
// the stored value (by reference, if it still holds) or a freshly computed
// one, and whichever it is gets stored back with the matching setState *and*
// is the same value the returned offset/range are derived from. Calling
// setState during render like this is the documented "adjusting state when a
// prop changes" pattern -- React discards this render's output and
// re-renders immediately with the new state, before anything commits to the
// DOM, so no frame ever paints tiles or an offset derived from a stale range
// or anchor. Deferring either rebase to a useEffect would commit one frame
// first, painting cells positioned for a range/anchor the transformed layer
// hasn't caught up to yet.
//
// Neither check can loop, and both guarantees belong to the pure modules
// rather than to this hook -- there are now two independent loop-freedom
// guarantees where useCellLattice.ts's header only had to argue one, since
// coverage and precision bounding no longer share a single origin:
//
//   - nextTileRange applied to its own result returns that same object by
//     reference (cellTiles.property.test.ts's idempotence property, which
//     rests on a freshly computed range always covering the camera/viewport
//     it was computed for), so the second render's `currentRange !== range`
//     guard is false.
//   - nextAnchor applied to its own result returns that same object by
//     reference for the identical reason (cellAnchor.property.test.ts), so
//     the second render's `currentAnchor !== anchor` guard is also false.
//
// range is returned as an object, unlike useCellLattice.ts's flattened
// scalars -- a deliberate reversal, not a regression of that hook's
// discipline. That flattening existed so Grid held no object identity from
// the hook; here, reference stability is instead a property-tested contract
// of nextTileRange itself (the same guarantee this hook's own loop-freedom
// above already rests on), so the returned TileRange is exactly as
// memo-stable as a scalar would be, and bundling its four bounds together
// stops a caller reconstructing an inconsistent range from separately-drawn
// fields.
export function useCellTiles(camera: Camera, size: ElementSize): CellTilesView {
  const [range, setRange] = useState<TileRange>(() =>
    coveringTileRange(camera, size.width, size.height, TILE_SPAN_CELLS),
  )
  const [anchor, setAnchor] = useState<Anchor>(() => computeAnchor(camera, TILE_SPAN_CELLS))

  const currentRange = nextTileRange(range, camera, size.width, size.height)
  if (currentRange !== range) {
    setRange(currentRange)
  }

  const currentAnchor = nextAnchor(anchor, camera, TILE_SPAN_CELLS)
  if (currentAnchor !== anchor) {
    setAnchor(currentAnchor)
  }

  const { xPx: offsetXPx, yPx: offsetYPx } = anchorOffsetPx(currentAnchor, camera)

  return {
    range: currentRange,
    anchorX: currentAnchor.x,
    anchorY: currentAnchor.y,
    cellSize: camera.cellSize,
    offsetXPx,
    offsetYPx,
  }
}
