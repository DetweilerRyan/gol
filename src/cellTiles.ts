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
// set, on any one side, before nextTileRange rebuilds. This is EVICTION
// HYSTERESIS, not admission overscan, and the two are easy to conflate with
// prior art (e.g. TanStack Virtual's `overscan`) -- worth stating plainly
// since the first reader to meet that library will otherwise assume
// EVICT_LAG_TILES is the same knob and "fix" it:
//
//   - overscan is an ADMISSION margin: always mount N extra tiles beyond the
//     covering set, symmetrically, on every render. Permanent cost, buys
//     tolerance for a scroll/pan that outruns the render.
//   - EVICT_LAG_TILES is EVICTION hysteresis: mount at most this many stale
//     tiles beyond the covering set on a side, retained from `previous`
//     rather than admitted fresh, before rebuilding evicts them. Transient
//     cost only, and one-sided -- it buys freedom from boundary thrash at
//     the TRAILING edge, not at the leading one; tileRangeHolds' own
//     containment check cannot bound a same-boundary wobble by itself (see
//     its comment), only nextTileRange's retention policy below does. The
//     residual limit that's still true after the fix: an oscillation
//     spanning two or more tile boundaries still rebuilds once per
//     reversal. Read "two or more tile boundaries" as a fact about the
//     REALIZED tile indices, not about the pan distance a caller asked for
//     -- float rounding can turn a one-span request into a two-tile shift.
//     See nextTileRange's own comment for both halves of that, and for why
//     it is disclosed rather than fixed.
//
// They are composable but this design adopts hysteresis only, and admission
// overscan was considered and rejected on measurement, not on the (false)
// "already fits inside one frame" premise this paragraph used to state --
// see this slice's own commit history for the corrected numbers. Two
// independent reasons: symmetric overscan at any useful tolerance raises
// steady-state mounted count permanently (a *directional* margin fares no
// better -- the leading side would have to flip on every drag reversal,
// paying a full strip admission on the new leading edge plus an eviction on
// the old one, exactly the gesture users perform most), and it batches
// rebuild work against a frame-interval p95 gate, which is precisely the
// wrong trade against a per-frame worst case. Retention (nextTileRange's
// actual policy, below) gets the same reversal-proofing for zero admitted
// tiles: PER AXIS, it can only ever keep a bound `previous` already held,
// never mount a genuinely new one (see nextTileRange's own comment for why
// that's stated per-axis rather than as a 2D-set claim -- a diagonal
// rebuild's corner tile is genuinely new even though neither axis admitted
// anything on its own).
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
// hysteresis protects the TRAILING edge only, and this predicate alone
// cannot make a boundary wobble cost at most one rebuild -- the original
// design argument for that (leading/trailing edges always flip at least one
// cell apart) is false: at a viewport width just past a whole number of
// tiles, both edges cross within the same sub-cell step, the covering set
// SHIFTS instead of widening, and neither position's range contains the
// other's. What actually bounds a same-boundary wobble to one rebuild is
// nextTileRange's retention policy below (composing `previous` and
// `required` via axisRetained rather than replacing `previous` outright),
// not this containment check by itself.
export function tileRangeHolds(previous: TileRange, required: TileRange, evictLagTiles: number): boolean {
  return (
    axisHolds(previous.minTileX, previous.maxTileX, required.minTileX, required.maxTileX, evictLagTiles) &&
    axisHolds(previous.minTileY, previous.maxTileY, required.minTileY, required.maxTileY, evictLagTiles)
  )
}

// One axis's half of the rebuild target nextTileRange composes below:
// rather than replacing `previous` with `required` outright, retain as much of `previous` as
// `evictLagTiles` allows on each side. axisHolds' private sibling, same
// reason -- one body for X and Y, so the asymmetric argument order (the
// leading/min side clamps DOWN toward requiredMin, the trailing/max side
// clamps UP toward requiredMax) lives in exactly one place.
function axisRetained(
  previousMin: number,
  previousMax: number,
  requiredMin: number,
  requiredMax: number,
  evictLagTiles: number,
): { min: number; max: number } {
  const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high)
  return {
    min: clamp(previousMin, requiredMin - evictLagTiles, requiredMin),
    max: clamp(previousMax, requiredMax, requiredMax + evictLagTiles),
  }
}

// The sticky-range rule: keep `previous` BY REFERENCE while it holds
// (tileRangeHolds against the freshly-required covering set), and otherwise
// rebuild onto the EVICT_LAG_TILES-clamped union of `previous` and
// `required` -- composing axisRetained over X and Y -- rather than onto
// `required` exactly. Three things follow by
// construction, not by argument: the result always contains `required` (no
// hole -- axisRetained's min can only move DOWN to requiredMin, never past
// it, and symmetrically for max); it never exceeds `required` by more than
// evictLagTiles per side (so idempotence-by-reference, the no-infinite-loop
// guarantee below, is now a theorem of the clamp rather than a coincidence
// of `required` covering itself); and it never mounts a per-axis bound
// `previous` didn't already hold (each clamp's own bounds are built from
// `previous` and `required` alone -- there is no third value it could admit
// from). That last property is what makes this retention, not admission
// overscan: see EVICT_LAG_TILES' header for why that distinction is the
// whole point of this design.
//
// This is also what actually bounds a same-tile-boundary wobble to one
// rebuild (tileRangeHolds' NOTE-THE-ASYMMETRY comment explains why that
// predicate alone can't): after the first rebuild, the trailing edge in
// whichever direction the wobble reverses toward carries up to one tile of
// slack, so the reversal still holds. THAT BOUND IS OVER THE REALS, and the
// residual below is where the distinction stops being pedantic.
//
// THE RESIDUAL LIMIT, disclosed rather than fixed: an oscillation whose
// REALIZED tile indices swing by two or more tiles still rebuilds on every
// reversal, because a single tile of lag cannot cover a two-tile swing.
// A swing gets there two ways, and the second is easy to miss:
//
//   1. By real travel. At cellSize 8.192 a two-tile swing is a 65px sweep
//      each way -- deliberate panning, whose churn is proportional to the
//      distance actually covered.
//   2. By float rounding, at an amplitude of exactly one span. `offset +
//      TILE_SPAN_CELLS` rounds ONTO a tile boundary when `offset` sits
//      within half an ulp below one, and Math.floor then jumps two tile
//      indices rather than one: floor(-Number.MIN_VALUE) is -1, but
//      floor(-Number.MIN_VALUE + 4) is 4. Nothing is wrong with the
//      guarantee -- the exact amplitude there is 4 + 5e-324, genuinely more
//      than one span -- but any prose (or test) that states the bound over a
//      REQUESTED float amplitude is claiming more than this function
//      delivers. cellTiles.property.test.ts's bounded-wobble block states
//      its precondition on the realized covering sets for exactly that
//      reason, after the requested-amplitude form made that block ~13%
//      flaky; it pins the band on both axes and both signs.
//
// Neither case moves EVICT_LAG_TILES off 1. The band in (2) is ulp-wide
// (~2e-16 cells at the origin) and unreachable through the UI -- qa swept
// pointer phase 0-32px against amplitudes of 1, 2, 3, 5 and 8px through the
// real app and found zero sustained churn -- and (1) is real panning. See
// cellTiles.property.test.ts's 'eviction hysteresis' block.
//
// Pure, and deliberately here rather than inline in useCellTiles, for the
// same reason cellLattice.ts's nextLattice was -- two properties the hook's
// setState-during-render pattern depends on are properties of this function
// alone rather than of React (see cellTiles.property.test.ts):
//
//   1. It returns `previous` BY REFERENCE when it holds. That reference
//      identity is what the hook's `current !== range` guard tests, so an
//      implementation returning a structurally-equal copy would make the
//      hook call setState on every render forever.
//   2. Applying it to its own result is a no-op. That is the
//      no-infinite-loop guarantee: the hook's second render re-runs this
//      against the range the first render just stored, and gets that same
//      object back. Since the fix it is a theorem of axisRetained's clamp
//      rather than a coincidence of `required` covering itself.
//
// No cellSize parameter, deliberately: a zoom needs no special case here.
// Zooming out grows the covering set, so containment fails and this
// rebuilds; zooming in shrinks it, so the lag test fails once the shrink
// exceeds EVICT_LAG_TILES and this rebuilds too. The range stores no
// cellSize at all.
//
// TWO COSTS RETENTION ADDS, both measured on this slice's perf run and both
// disclosed here rather than left for the next reader to rediscover. The
// ratified design predicted neither -- it analysed the pan strip only, and
// its "(a) leaves rebuild frequency and worst-event admission identical"
// arithmetic was simply wrong, even though the p95 prediction it supported
// did hold. Neither moves any mounted-count BOUND: the four-sided worst
// case is unchanged, because the pre-fix policy already tolerated the same
// EVICT_LAG_TILES of drift per side before rebuilding. What both move is
// the TIME-AVERAGED mounted count, by keeping that drift right after a
// rebuild instead of resetting it to zero.
//
//   1. A monotone pan can rebuild up to TWICE per TILE_SPAN_CELLS of
//      travel, not once. An exact-replace rebuild reset BOTH edges to
//      `required`, so whichever edge triggered gave the other a free reset
//      and the two stayed synchronized; axisRetained tightens only the edge
//      that actually failed, so the leading and trailing edges desynchronize
//      and each pays its own cadence (cellTiles.property.test.ts's
//      monotone-pan bound derives the exact 2*floor(T/span)+1 from this).
//      This is not the regression it looks like: the extra events are
//      EVICTION-ONLY (containment held, only the margin failed, so the clamp
//      moves the failing bound toward `required` and admits nothing), so the
//      per-admitted-cell calibration above is untouched and the same total
//      admission is merely split into smaller events -- which is the right
//      direction for a frame-interval p95 gate, and why pan-min-zoom-empty
//      held unchanged at both viewports across the fix -- 66.7ms -> 66.7ms
//      at 1280x900, 133.4ms -> 133.3ms at 1920x1080.
//   2. A zoom-IN rebuild retains a full four-sided ring; a zoom-OUT rebuild
//      does not. Zooming out grows `required` past `previous` on every side,
//      so both clamps collapse to `required` and retention is exactly
//      equivalent to exact-replace. Zooming in shrinks it, so both clamps
//      bind and the result carries EVICT_LAG_TILES on all four sides. Since
//      a zoom step re-renders every mounted cell (cellSize is a Cell prop),
//      that ring is paid on the whole mounted set rather than on a strip.
//      Simulated over zoom.perf.spec.ts's own 5-in/10-out/10-in sweep it is
//      +8.1% of mounted-cell-renders at 1280x900 and +7.2% at 1920x1080 --
//      against a measured zoom-toolbar-clamp p95 move of +17.9% and +8.1%
//      respectively, so it accounts for essentially all of the 1920x1080
//      move and about half of the noisier 1280x900 one. Accepted, not fixed:
//      it buys the wobble row's 58.4ms -> 8.9ms, and the lever that would
//      remove it is mounted count at min zoom (see this module's header),
//      not EVICT_LAG_TILES.
export function nextTileRange(previous: TileRange, camera: Camera, widthPx: number, heightPx: number): TileRange {
  const required = coveringTileRange(camera, widthPx, heightPx, previous.spanCells)
  if (tileRangeHolds(previous, required, EVICT_LAG_TILES)) return previous

  const x = axisRetained(previous.minTileX, previous.maxTileX, required.minTileX, required.maxTileX, EVICT_LAG_TILES)
  const y = axisRetained(previous.minTileY, previous.maxTileY, required.minTileY, required.maxTileY, EVICT_LAG_TILES)

  return { minTileX: x.min, maxTileX: x.max, minTileY: y.min, maxTileY: y.max, spanCells: previous.spanCells }
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
