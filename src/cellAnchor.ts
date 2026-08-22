import { worldToScreen, type Camera } from './camera'

// The tile-virtualized design's precision-bounding module: nothing here
// decides which tiles are mounted (that's cellTiles.ts) -- this module's only
// job is keeping (worldCoordinate - anchor) x cellSize small enough that the
// compositor's float32 transform matrix stays exact. Split from cellTiles.ts
// because the two change for unrelated reasons: a reader asking "why is
// there an anchor" should not have to read tiling policy, and vice versa.
// spanCells is a parameter here, never an import from cellTiles.ts, so the
// two stay independent -- the ratified DAG is cellTiles.ts -> camera.ts and
// cellAnchor.ts -> camera.ts, neither importing the other.
//
// Under cellLattice.ts (the module this design replaces), the lattice origin
// did double duty: it was both the coverage anchor (rebased whenever the
// viewport threatened to outgrow it) AND the precision anchor (kept every
// on-screen pixel position small). Splitting coverage out to cellTiles.ts's
// TileRange means this module's anchor only has to satisfy the precision
// half, so it can re-quantise far less often -- once per ANCHOR_DRIFT_CELLS
// of camera travel, instead of every few cells of pan.

// How far the camera's world offset may drift from the anchor, on either
// axis, before nextAnchor re-quantises. Chosen against the float32
// integer-exactness cliff at 2**24 (~16.78M), which is where a compositor
// transform stops representing every pixel offset exactly: at
// MAX_CELL_SIZE (60px/cell), ANCHOR_DRIFT_CELLS * 60 = 245,760px, a 68x
// margin below 2**24. (An earlier draft of this design proposed ~260,000
// CELLS as the bound -- 260,000 * 60 ~= 15.6M px, which sits ON the cliff
// rather than safely below it; ANCHOR_DRIFT_CELLS corrects that.) One
// re-anchor forces a full re-render of every mounted cell (~180-200ms at min
// zoom), so this is a rare hitch traded against never happening in an
// ordinary session, not a per-pan cost the way EVICT_LAG_TILES is.
export const ANCHOR_DRIFT_CELLS = 4096

export interface Anchor {
  x: number // world coordinates, tile-aligned (see computeAnchor)
  y: number
}

// A fresh anchor near the camera's current offset, tile-aligned to spanCells
// so it lines up with the tile grid cellTiles.ts mounts against -- the same
// floor-toward-negative-infinity convention as cellTiles.ts's tileIndexOf /
// tileOriginCell pair, duplicated here rather than imported (see this
// module's header on why the two stay independent).
export function computeAnchor(camera: Camera, spanCells: number): Anchor {
  return {
    x: Math.floor(camera.offsetX / spanCells) * spanCells,
    y: Math.floor(camera.offsetY / spanCells) * spanCells,
  }
}

// Whether `anchor` still bounds the camera's current offset within
// ANCHOR_DRIFT_CELLS on both axes -- the precision-bounding half of the
// no-infinite-loop guarantee nextAnchor depends on (see its own comment).
export function anchorHolds(anchor: Anchor, camera: Camera): boolean {
  return (
    Math.abs(camera.offsetX - anchor.x) <= ANCHOR_DRIFT_CELLS &&
    Math.abs(camera.offsetY - anchor.y) <= ANCHOR_DRIFT_CELLS
  )
}

// The sticky-anchor rule: keep the existing anchor while it still holds
// (anchorHolds against the current camera), and re-quantise onto a fresh one
// otherwise. Pure, and deliberately here rather than inline in useCellTiles
// (step 3), for the same reason cellLattice.ts's nextLattice -- and
// cellTiles.ts's nextTileRange -- are pure and stand alone: two properties
// the hook's setState-during-render pattern depends on are properties of
// this function alone rather than of React (see cellAnchor.property.test.ts):
//
//   1. It returns `previous` BY REFERENCE when it holds. That reference
//      identity is what the hook's `current !== anchor` guard tests, so an
//      implementation returning a structurally-equal copy would make the
//      hook call setState on every render forever.
//   2. Applying it to its own result is a no-op. That is the
//      no-infinite-loop guarantee: the hook's second render re-runs this
//      against the anchor the first render just stored, and gets that same
//      object back.
//
// useCellTiles (step 3) applies this guarantee twice per render -- once here
// and once via nextTileRange -- since the two stickiness mechanisms are
// independent (see this module's header).
export function nextAnchor(previous: Anchor, camera: Camera, spanCells: number): Anchor {
  return anchorHolds(previous, camera) ? previous : computeAnchor(camera, spanCells)
}

// The pixel offset of the anchor's own world position under the current
// camera -- this is what a transformed layer wrapping every mounted cell
// applies as its own translate, so panning moves that one offset instead of
// every cell's own position. This is latticeOffsetPx, renamed: deliberately
// just worldToScreen -- screenToWorld (used to resolve taps and hover back
// to a world cell) must agree with wherever the anchor visually painted, and
// worldToScreen is the one function both this and screenToWorld are already
// inverses of -- reimplementing the arithmetic here would risk that identity
// drifting out of sync with camera.ts.
export function anchorOffsetPx(anchor: Anchor, camera: Camera): { xPx: number; yPx: number } {
  const { x, y } = worldToScreen(camera, anchor.x, anchor.y)
  return { xPx: x, yPx: y }
}

// The pixel offset of a world coordinate along one axis, relative to the
// anchor -- independent of camera.offsetX/offsetY, which is what lets a pan
// avoid re-rendering a retained cell's position at all. Scalar in, scalar
// out -- kept separate from returning an {x, y} pair so the hot per-cell
// render loop stays allocation-free and callers pass React Compiler
// primitive props rather than a fresh object every render. Together with
// anchorOffsetPx this is the worldToScreen round trip: anchorOffsetPx(anchor,
// camera) + cellOffsetPx(worldCoordinate, anchorCoordinate, cellSize) equals
// worldToScreen(camera, worldCoordinate) exactly (see
// cellAnchor.property.test.ts) -- the same identity slotPixelPosition +
// latticeOffsetPx used to guarantee, now split across anchor and per-cell
// offset instead of lattice origin and slot index.
export function cellOffsetPx(worldCoordinate: number, anchorCoordinate: number, cellSize: number): number {
  return (worldCoordinate - anchorCoordinate) * cellSize
}
