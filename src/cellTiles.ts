import type { Camera } from './camera'

// The tile-virtualized mounting policy: which world tiles are mounted, and
// when that set changes. Replaces cellLattice.ts's coverage half -- the
// lattice rebased a fixed-size window of render *slots* under a moving
// camera; a tile range instead mounts world-anchored tiles directly, so a
// retained tile survives a pan untouched (world coordinates never change for
// a tile that stays mounted -- see CellTile.tsx's header for the resulting
// "no prop may change per pan tick" invariant).
// Precision bounding (the float32 concern the lattice's origin also used to
// carry) moves to the sibling module cellAnchor.ts (step 2), which is why
// this module stores no cellSize and does not import worldToScreen.

// Cell span per tile side. The design below this comment (ratified
// tile-virtualized-cells design, derived from reports/perf/latest.md @
// 5042ab3, 2026-08-22) chose S=4 from an F(S) = c_cell * enteringCells(S) +
// c_tile * tileCount(S) model built on a *pre-tiling* calibration -- the
// zoom-shift-wheel scenarios it read c_remount from didn't remount at all
// under the lattice that predated this module (GridCells.tsx keyed by
// slotIndex, so a rebase re-rendered slots against a new origin; it never
// unmounted them). That made every constant in that model's S-table (which
// stood in this comment until 2026-08-23; see git history) wrong by roughly
// 7-10x, and it stayed here uncorrected until the full perf run below
// caught it.
//
// CORRECTED (2026-08-23, commit 5060452, full perf run against this landed
// module): the actual per-admitted-cell cost, measured post-tiling where
// admission genuinely does mount+unmount DOM, is
//
//   c_strip ~= 125-145us of task time (~76us of that is script) per admitted
//   cell at ~19,680 mounted, cross-validated between two unrelated
//   scenarios -- pan-min-zoom-empty (TaskDuration/move 41.7ms,
//   ScriptDuration/move 13.1ms, 1280x900) and wobble-tile-boundary-thrash
//   (TaskDuration/move 76.2ms, ScriptDuration/move 33.3ms, 896 DOM-node
//   churn/move, 1280x900) -- agreeing to within 4%.
//
// That cost is not constant: at 33,184 mounted (1920x1080, same scenario
// pair) it rises to ~239us/admitted cell. The old F(S) has no term for a
// mounted-count-dependent unit cost, so treat that rise as DIRECTIONAL only
// -- it's two points against what would need to be at least a two-parameter
// law, and the 1920x1080 sample is confounded with 1.8x the paint area of
// the 1280x900 one. A real re-tuning of S needs more than two points.
//
// What tiling actually bought, measured rather than modelled: it did NOT
// reduce JavaScript. Cells touched per rep fell ~21x (whole viewport
// -> admitted strip only) while per-cell cost rose ~19x, so
// ScriptDuration/move at min zoom, 1280x900 is essentially unchanged
// (14.0ms pre-tiling -> 13.1ms post, reports/perf history). The measured
// 38% p95 improvement (pan-min-zoom-empty, 1280x900) came from
// RecalcStyleDuration/move roughly halving (17.4ms -> 8.4ms), because a
// retained tile no longer restyles on a pan tick.
//
// The 16.7ms/frame acceptance criterion (60fps) was MISSED at this setting,
// not waived: pan-min-zoom-empty p95 measures 66.7ms at 1280x900 -- 8 frame
// intervals at this harness's actual 120Hz refresh (frameIntervalsMs
// quantizes to 8.33ms here; state frame-interval gates in quanta, since
// "16.7ms" silently means "2 quanta" on this box and something else on a
// 60Hz one). It is also unreachable by ANY S under this design: the best
// modelled value, at S=2 (~40% cheaper per the entering-cell count, c_tile
// still unmeasured), is ~40ms -- still 2.3-2.9x over budget. TILE_SPAN_CELLS
// stays 4 as landed; it is NOT known to be optimal, and the experiment that
// would settle it (run the wobble-tile-boundary family at S=2 and S=4 and
// compare) is pending, not run. The lever that actually closes the gap is
// mounted count, not strip size: an empty grid at min zoom mounts 19,680
// buttons, but at default zoom only 3,264 mount and every scenario already
// sits inside budget with zero long tasks. The 16.7ms goal isn't softened --
// it moves to whichever slice addresses mounted count at min zoom.
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
//     Transient cost only, and one-sided -- it buys freedom from boundary
//     thrash at the TRAILING edge, not at the leading one. Read
//     tileRangeHolds' comment before assuming it prevents thrash generally;
//     it does not, and cellTiles.property.test.ts pins the case where it
//     doesn't.
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

// The identity a mounted tile is keyed by. World-based, unlike the old
// lattice's slotIndex -- see GridCells.tsx's keying comment for why that
// inversion is correct here.
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

// One axis's half of tileRangeHolds below: does [previousMin, previousMax]
// still contain [requiredMin, requiredMax], and if so, by no more than
// evictLagTiles on either side? Private -- tileRangeHolds is the only
// exported contract; this exists only to give the X and Y checks (identical
// in shape, applied to different fields of TileRange) a single body instead
// of two, which is also what keeps tileRangeHolds itself under the CRAP
// threshold.
function axisHolds(
  previousMin: number,
  previousMax: number,
  requiredMin: number,
  requiredMax: number,
  evictLagTiles: number,
): boolean {
  if (previousMin > requiredMin || previousMax < requiredMax) return false
  return requiredMin - previousMin <= evictLagTiles && previousMax - requiredMax <= evictLagTiles
}

// Whether `previous` may stay mounted rather than being rebuilt onto
// `required`: it must still fully contain `required` (never a hole in the
// viewport), and it must not exceed `required` by more than `evictLagTiles`
// tiles on any one of the four sides.
//
// NOTE THE ASYMMETRY, because the ratified design got this wrong and the
// architect review corrected it: this tolerates `previous` being WIDER than
// required, and can never tolerate it being narrower (a narrower range is a
// hole -- an invisible, unclickable band at the leading edge). So the
// hysteresis protects the TRAILING edge only. The design argued the stronger
// claim that a boundary wobble costs at most one rebuild, on the grounds
// that the leading and trailing edges (Math.ceil vs Math.floor above) flip
// at least one cell apart so a rebuild always lands on the momentarily-wider
// covering set. That is false: at a viewport width just past a whole number
// of tiles, both edges cross within the same sub-cell step, the covering set
// SHIFTS instead of widening, neither position's range contains the other's,
// and every step of the oscillation rebuilds. See the deterministic
// counterexample in cellTiles.property.test.ts's 'eviction hysteresis'
// block, which also names the escape hatch (rebuild onto `previous` clamped
// to within evictLagTiles of `required`, rather than onto `required`
// exactly) if the perf run ever shows the thrash mattering.
export function tileRangeHolds(previous: TileRange, required: TileRange, evictLagTiles: number): boolean {
  return (
    axisHolds(previous.minTileX, previous.maxTileX, required.minTileX, required.maxTileX, evictLagTiles) &&
    axisHolds(previous.minTileY, previous.maxTileY, required.minTileY, required.maxTileY, evictLagTiles)
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
