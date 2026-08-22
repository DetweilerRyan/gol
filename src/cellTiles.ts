import type { Camera } from './camera'

// The tile-virtualized mounting policy: which world tiles are mounted, and
// when that set changes. Replaces cellLattice.ts's coverage half -- the
// lattice rebased a fixed-size window of render *slots* under a moving
// camera; a tile range instead mounts world-anchored tiles directly, so a
// retained tile survives a pan untouched (world coordinates never change for
// a tile that stays mounted -- see CellTile.tsx's header once it lands).
// Precision bounding (the float32 concern the lattice's origin also used to
// carry) moves to the sibling module cellAnchor.ts (step 2), which is why
// this module stores no cellSize and does not import worldToScreen.

// Cell span per tile side, derived (not guessed) in the ratified
// tile-virtualized-cells design from four independent min-zoom/1920x1080
// measurements of reports/perf/latest.md @ 5042ab3 (2026-08-22):
// c_rerender (retained-cell re-render cost) = 5.35-5.81 us/cell across two
// viewports and two zoom levels, and c_remount (warm mount+unmount cost, from
// the zoom-shift-wheel scenarios, which remount every cell today) =
// 12.7-15.4 us/cell. Modelling a pan's strip-event cost as
// F(S) = c_cell * enteringCells(S) + c_tile * tileCount(S), with
// c_cell ~= 14us and c_tile ~= 1us (a memo-hit component call plus one keyed
// reconciliation slot), gives a minimum near S=3-4 cells per tile side and a
// budget breach (>16.7ms, the 60fps frame budget) at S=8 and S=16:
//
//   S   tiles   entering(x)   F(S) at min-zoom/1920x1080
//   3   3,726   414           9.53ms
//   4   2,135   560           9.98ms   <- chosen
//   6     984   864          13.08ms
//   8     558 1,152          16.69ms  (zero margin against the 16.7ms budget)
//  16     160 2,560          36.00ms  (also breaches the mounted-count guard)
//
// S=4 is the minimax choice across the one constant that stays a guess
// (c_tile): it is the only span that stays inside budget across the whole
// plausible range of c_tile (1-3us), where S=3 fails once tiles are dear and
// S=6/S=8 fail once cells are dear. A single named constant so retuning is a
// one-line change -- see cellTiles.test.ts's table-driven test, which pins
// the exact mounted/tile/entering-strip counts this constant was chosen
// against, so a future change to it fails loudly rather than drifting.
export const TILE_SPAN_CELLS = 4

// How many tiles of margin a retained range may carry beyond the covering
// set, on any one side, before nextTileRange rebuilds it exactly. This is
// EVICTION HYSTERESIS, not admission overscan, and the two are easy to
// conflate with prior art (e.g. TanStack Virtual's `overscan`) -- worth
// stating plainly since the first reader to meet that library will otherwise
// assume EVICT_LAG_TILES is the same knob and "fix" it:
//
//   - overscan is an ADMISSION margin: always mount N extra tiles beyond the
//     covering set, symmetrically, on every render. Permanent cost, buys
//     tolerance for a scroll/pan that outruns the render.
//   - EVICT_LAG_TILES is EVICTION hysteresis: admit exactly the covering set,
//     but tolerate up to this many stale tiles on a side before rebuilding.
//     Transient cost only (see tileRangeHolds), buys freedom from boundary
//     thrash at a tile edge.
//
// They are composable but this design adopts hysteresis only -- the strip
// cost above already fits inside one frame, so there is nothing for an
// admission margin to buy here. It is a one-line change if that ever stops
// being true: 1 tile of *symmetric* overscan on every side costs 252x148 =
// 37,296 mounted at min-zoom/1920x1080 (+4.0% over today's 35,856) -- the
// same figure this module's worst-case four-sided-lag bound reaches (see
// cellTiles.test.ts). A *directional* margin was considered and rejected:
// the leading side would have to flip on every drag reversal, paying a full
// strip admission on the new leading edge plus an eviction on the old one --
// a double strip event exactly on the gesture users perform most.
export const EVICT_LAG_TILES = 1

export interface TileRange {
  minTileX: number // inclusive tile indices
  minTileY: number
  maxTileX: number
  maxTileY: number
  spanCells: number // carried so consumers never re-import the constant
}

// The tile index containing a world coordinate. Math.floor rather than
// Math.trunc so negative coordinates round toward negative infinity, the
// same convention slotWorldCoordinate/cellKey already use elsewhere in this
// codebase -- tile -1 covers world cells [-spanCells, -1], not [-spanCells +
// 1, 0].
export function tileIndexOf(worldCoordinate: number, spanCells: number): number {
  return Math.floor(worldCoordinate / spanCells)
}

// The world coordinate a tile index's own origin cell (its top/left corner)
// sits at, along one axis. The inverse half of tileIndexOf.
export function tileOriginCell(tileIndex: number, spanCells: number): number {
  return tileIndex * spanCells
}

// The identity a mounted tile is keyed by. World-based, unlike the lattice's
// slotIndex -- see GridCells.tsx's keying comment once it's rewritten in
// step 5a for why that inversion is correct here.
export function tileKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`
}

// The exact minimal set of tiles needed to fully cover the viewport under
// the given camera -- no admission margin (see EVICT_LAG_TILES above).
// Mirrors computeLattice's floor/ceil edge convention (gridGeometry.ts's
// computeVisibleRange uses the same pair), except the trailing edge is
// clamped to never fall short of the leading edge: a 0-width/0-height
// viewport (Grid's pre-measurement render) would otherwise invert into an
// empty or negative range, and Grid.test.tsx's "renders a small cell grid
// immediately on mount" test depends on cell (0, 0) existing at size {0, 0}.
export function coveringTileRange(camera: Camera, widthPx: number, heightPx: number, spanCells: number): TileRange {
  const leftCell = Math.floor(camera.offsetX)
  const topCell = Math.floor(camera.offsetY)
  const rightCell = Math.max(leftCell, Math.ceil(camera.offsetX + widthPx / camera.cellSize) - 1)
  const bottomCell = Math.max(topCell, Math.ceil(camera.offsetY + heightPx / camera.cellSize) - 1)

  return {
    minTileX: tileIndexOf(leftCell, spanCells),
    maxTileX: tileIndexOf(rightCell, spanCells),
    minTileY: tileIndexOf(topCell, spanCells),
    maxTileY: tileIndexOf(bottomCell, spanCells),
    spanCells,
  }
}

// Whether `previous` may stay mounted rather than being rebuilt onto
// `required`: it must still fully contain `required` (never a hole in the
// viewport), and it must not exceed `required` by more than `evictLagTiles`
// tiles on any one of the four sides. A oscillating camera therefore costs at
// most one rebuild per boundary crossing, since the leading and trailing
// edges (Math.ceil vs Math.floor above) flip at least one cell apart -- a
// rebuild always lands on the momentarily-wider covering set, and the
// required set then moves strictly inside it until it grows past the margin
// again.
export function tileRangeHolds(previous: TileRange, required: TileRange, evictLagTiles: number): boolean {
  const containsX = previous.minTileX <= required.minTileX && previous.maxTileX >= required.maxTileX
  const containsY = previous.minTileY <= required.minTileY && previous.maxTileY >= required.maxTileY
  if (!containsX || !containsY) return false

  return (
    required.minTileX - previous.minTileX <= evictLagTiles &&
    previous.maxTileX - required.maxTileX <= evictLagTiles &&
    required.minTileY - previous.minTileY <= evictLagTiles &&
    previous.maxTileY - required.maxTileY <= evictLagTiles
  )
}

// The sticky-range rule: keep the existing tile range while it still holds
// (tileRangeHolds against the freshly-required covering set), and rebuild
// onto exactly that covering set otherwise. Pure, and deliberately here
// rather than inline in useCellTiles (step 3), for the same reason
// cellLattice.ts's nextLattice is pure and stands alone -- two properties the
// hook's setState-during-render pattern depends on are properties of this
// function alone rather than of React (see cellTiles.property.test.ts):
//
//   1. It returns `previous` BY REFERENCE when it holds. That reference
//      identity is what the hook's `current !== range` guard tests, so an
//      implementation returning a structurally-equal copy would make the
//      hook call setState on every render forever.
//   2. Applying it to its own result is a no-op. That is the
//      no-infinite-loop guarantee: the hook's second render re-runs this
//      against the range the first render just stored, and gets that same
//      object back.
//
// No cellSize parameter, deliberately: a zoom needs no special case here.
// Zooming out grows the covering set, so containment fails and this rebuilds;
// zooming in shrinks it, so the lag test fails once the shrink exceeds
// EVICT_LAG_TILES and this rebuilds too. The range stores no cellSize at all.
export function nextTileRange(previous: TileRange, camera: Camera, widthPx: number, heightPx: number): TileRange {
  const required = coveringTileRange(camera, widthPx, heightPx, previous.spanCells)
  return tileRangeHolds(previous, required, EVICT_LAG_TILES) ? previous : required
}

// The total number of cells mounted by every tile in the range -- Guard 1 of
// the tile-virtualized-cells design (see cellTiles.test.ts's table-driven
// test for the exact figures this was chosen against).
export function tileRangeCellCount(range: TileRange): number {
  const tilesX = range.maxTileX - range.minTileX + 1
  const tilesY = range.maxTileY - range.minTileY + 1
  return tilesX * range.spanCells * tilesY * range.spanCells
}

// The number of cells a single entering strip (one tile wide/tall, running
// the full length of the opposite axis) admits when a pan crosses exactly
// one tile boundary along `axis`. Guard 2 of the design -- the quantity the
// strip-event cost model (F(S) in this module's header) is built from.
export function enteringStripCellCount(range: TileRange, axis: 'x' | 'y'): number {
  const tilesX = range.maxTileX - range.minTileX + 1
  const tilesY = range.maxTileY - range.minTileY + 1
  return axis === 'x' ? range.spanCells * (tilesY * range.spanCells) : range.spanCells * (tilesX * range.spanCells)
}
