// Setup and precondition arithmetic for the tile-boundary wobble scenarios
// (tile-boundary.perf.spec.ts). The same role population.ts plays for the
// seeded scenarios: a scenario whose *setup* silently failed still produces a
// perfectly plausible measurement, so the setup gets checked before anything
// is measured.
//
// What can silently fail here is subtler than a missed seed. The thrash this
// scenario exists to measure needs the camera to sit at a particular
// sub-cell PHASE relative to the tile grid -- at 1280px/cellSize 8.192 the
// window is 2.048px wide out of a 32.768px tile pitch, about 6% of phases.
// Land outside it and the wobble is ordinary panning: the numbers come back
// clean, look like a successful measurement, and say nothing. So this module
// (a) reads the camera back out of the rendered DOM rather than assuming what
// the zoom clicks produced, and (b) predicts the rebuild count using the
// app's OWN policy module (cellTiles.ts's nextTileRange), so the scenario can
// assert what it is about to measure before it measures it.
//
// No statistics -- see perf/README.md's "perf/ computes no statistics". Every
// median/ratio over the results still belongs to scripts/perf-report/.
import type { Page } from '@playwright/test'
import { panCamera, zoomPercentage, type Camera } from '../src/camera.ts'
import { coveringTileRange, nextTileRange, TILE_SPAN_CELLS, type TileRange } from '../src/cellTiles.ts'
import { DRAG_THRESHOLD_PX } from '../src/dragGesture.ts'

// Duplicated as a literal rather than imported from Grid.tsx's
// GRID_CONTENT_ID: that is a .tsx module, and a value import would drag React
// and JSX into perf/'s Node-side module graph for the sake of one string.
// pan.perf.spec.ts already hardcodes the same selector for its cell count.
const GRID_CONTENT_SELECTOR = '#grid-content'

// The two cell buttons the camera is triangulated from. Both are mounted in
// every scenario this module serves: the closest any of them gets to the
// origin is the default camera at 1280x900 (world x in [-32, 32), y in
// [-22.5, 22.5)), and zooming out only widens that.
const ORIGIN_CELL_SELECTOR = '[aria-label="Cell 0, 0"]'
const PROBE_CELL_OFFSET_CELLS = 16
const PROBE_CELL_SELECTOR = `[aria-label="Cell ${PROBE_CELL_OFFSET_CELLS}, ${PROBE_CELL_OFFSET_CELLS}"]`

export interface MeasuredGrid {
  camera: Camera
  widthPx: number
  heightPx: number
  // cellSize as measured across PROBE_CELL_OFFSET_CELLS rendered cells,
  // independent of the `cellSize` the caller passed in -- a cross-check on
  // that argument, not a second source of truth for it (see readGridGeometry).
  measuredCellSizePx: number
}

interface GridRects {
  contentLeft: number
  contentTop: number
  contentWidth: number
  contentHeight: number
  originLeft: number
  originTop: number
  probeLeft: number
}

// Reads the camera back out of what the app actually rendered, rather than
// re-deriving it from the zoom clicks a scenario performed.
//
// `cellSize` is supplied by the caller and is exact by construction: the zoom
// ladder is discrete (DEFAULT_CELL_SIZE * ZOOM_FACTOR**-n, clamped), so a
// scenario that clicked Zoom out n times knows the value symbolically, and
// expectedZoomReadout below pins it against the app's own readout. Deriving it
// from pixels instead would import Blink's LayoutUnit quantisation (1/64px)
// into the divisor and then multiply that error by ~78 cells when solving for
// offsetX. measuredCellSizePx is returned so the caller can still cross-check
// the two agree.
//
// widthPx/heightPx come from #grid-content's own border box, which is what
// useElementSize's contentRect measures too -- the element is
// `absolute inset-0` with no border or padding, so the two boxes coincide.
// Taking it from the DOM rather than from page.viewportSize() is deliberate:
// coveringTileRange is fed the measured element, not the window.
export async function readGridGeometry(page: Page, cellSizePx: number): Promise<MeasuredGrid> {
  const rects = await page.evaluate((selectors) => {
    const content = document.querySelector(selectors.content)
    const origin = document.querySelector(selectors.origin)
    const probe = document.querySelector(selectors.probe)
    if (!content || !origin || !probe) return null
    const c = content.getBoundingClientRect()
    const o = origin.getBoundingClientRect()
    const p = probe.getBoundingClientRect()
    return {
      contentLeft: c.left,
      contentTop: c.top,
      contentWidth: c.width,
      contentHeight: c.height,
      originLeft: o.left,
      originTop: o.top,
      probeLeft: p.left,
    }
  }, mustMatchSelectors())

  if (!rects) {
    throw new Error(
      `readGridGeometry: expected ${GRID_CONTENT_SELECTOR}, ${ORIGIN_CELL_SELECTOR} and ${PROBE_CELL_SELECTOR} to all be rendered`,
    )
  }
  return toMeasuredGrid(rects, cellSizePx)
}

function mustMatchSelectors() {
  return { content: GRID_CONTENT_SELECTOR, origin: ORIGIN_CELL_SELECTOR, probe: PROBE_CELL_SELECTOR }
}

function toMeasuredGrid(rects: GridRects, cellSizePx: number): MeasuredGrid {
  return {
    camera: {
      cellSize: cellSizePx,
      offsetX: -(rects.originLeft - rects.contentLeft) / cellSizePx,
      offsetY: -(rects.originTop - rects.contentTop) / cellSizePx,
    },
    widthPx: rects.contentWidth,
    heightPx: rects.contentHeight,
    measuredCellSizePx: (rects.probeLeft - rects.originLeft) / PROBE_CELL_OFFSET_CELLS,
  }
}

// The app's own zoom readout, as the discriminator for which rung of the zoom
// ladder a scenario actually landed on. Worth asserting even though the click
// count is fixed: 8.192 is one step above MIN_CELL_SIZE, so an off-by-one in
// the click count clamps to 8.0 instead -- a 2.3% difference in cellSize that
// moves the viewport from 39.0625 tiles (thrash geometry) to 40.0 tiles
// (a completely different case), while still looking like a min-ish zoom in
// every other respect. zoomPercentage renders those two as 41% and 40%.
export function expectedZoomReadout(cellSizePx: number): string {
  return `${zoomPercentage({ offsetX: 0, offsetY: 0, cellSize: cellSizePx })}%`
}

// The viewport's width measured in whole tiles, fractional part included --
// the number the whole scenario family is indexed by. A fractional part just
// above 0 is the thrash geometry (both the leading and the trailing tile edge
// cross within one sub-cell step); anything else is not. See the scenario
// file's header table.
export function viewportWidthInTiles(widthPx: number, cellSizePx: number): number {
  return widthPx / cellSizePx / TILE_SPAN_CELLS
}

// How many times the mounted tile range would be rebuilt over a
// panWobblePaced gesture of `moves` alternating moves, according to
// cellTiles.ts's own nextTileRange. Pure: no page, no measurement.
//
// The wobble's two camera positions are `base` (pointer at rest) and
// panCamera(base, amplitudePx, 0) (pointer displaced by +amplitudePx).
// panCamera subtracts dx/cellSize from offsetX, so the displaced position is
// the one further LEFT in world space -- the sign matters here and is checked
// against the app's function rather than restated.
export function simulateWobbleRebuilds(
  base: Camera,
  widthPx: number,
  heightPx: number,
  amplitudePx: number,
  moves: number,
): number {
  const displaced = panCamera(base, amplitudePx, 0)
  let range: TileRange = coveringTileRange(base, widthPx, heightPx, TILE_SPAN_CELLS)
  let rebuilds = 0
  for (let move = 1; move <= moves; move++) {
    const camera = move % 2 === 1 ? displaced : base
    const next = nextTileRange(range, camera, widthPx, heightPx)
    if (next !== range) rebuilds++
    range = next
  }
  return rebuilds
}

// Does `outer` fully cover `inner` on both axes? The building block for
// wobbleCoveringRangesAreNested below -- neither direction alone decides
// nestedness, since either range could be the larger one depending on phase.
function rangeContains(outer: TileRange, inner: TileRange): boolean {
  return (
    outer.minTileX <= inner.minTileX &&
    outer.maxTileX >= inner.maxTileX &&
    outer.minTileY <= inner.minTileY &&
    outer.maxTileY >= inner.maxTileY
  )
}

// Whether the wobble's two camera positions (base, and base displaced by
// +amplitudePx) produce covering-tile ranges where one contains the other.
// True ("nested") is the ordinary case: a boundary crossed by only one edge
// widens the covering set on one side, and the wider of the two ranges
// contains the narrower one, however long the wobble runs. False
// ("non-nested") is the thrash geometry cellTiles.ts's tileRangeHolds comment
// discloses: a viewport a whisker over a whole number of tiles has its
// leading and trailing edges cross within the same sub-cell step, so the
// covering set SHIFTS sideways instead of widening and neither position's
// range contains the other's.
//
// This is deliberately a fact about coveringTileRange alone, not about
// nextTileRange's retention policy -- contrast simulateWobbleRebuilds, which
// asks what the app's ACTUAL policy does with these same two positions over
// a longer gesture. Stating the qualifying condition this way is what keeps
// it invariant across a change to that policy: it was true of the geometry
// before EVICT_LAG_TILES existed and stays true after it changes shape.
export function wobbleCoveringRangesAreNested(
  base: Camera,
  widthPx: number,
  heightPx: number,
  amplitudePx: number,
): boolean {
  const displaced = panCamera(base, amplitudePx, 0)
  const baseRange = coveringTileRange(base, widthPx, heightPx, TILE_SPAN_CELLS)
  const displacedRange = coveringTileRange(displaced, widthPx, heightPx, TILE_SPAN_CELLS)
  return rangeContains(baseRange, displacedRange) || rangeContains(displacedRange, baseRange)
}

// Every candidate setup nudge starts above DRAG_THRESHOLD_PX so the setup
// drag actually becomes a pan (see panWobblePaced's own check for the same
// hazard), and the scan covers one full tile pitch beyond that, since the
// covering-range geometry is periodic in the camera offset with a period of
// exactly TILE_SPAN_CELLS cells.
const MIN_NUDGE_PX = DRAG_THRESHOLD_PX + 1

// The whole-pixel rightward pointer displacement that puts the camera at a
// phase where a wobble of `amplitudePx` makes the two covering tile ranges
// wobbleCoveringRangesAreNested visits land NON-NESTED -- the thrash
// geometry. Whole pixels only, so the pointer coordinates the driver
// dispatches stay integers.
//
// THE APPROACH DIRECTION IS LOAD-BEARING, not an implementation detail, for
// what happens once a scenario actually starts panning from the nudged
// position: nudging RIGHTWARD means the camera's offsetX decreases
// monotonically on the way in, so the range the app's own nextTileRange
// retains after the setup drag is rebuilt exactly onto the covering minimum
// at the moment it last decremented, never one tile wider on that side.
// Reverse the sign and it can be wider: a range one tile wider on the side
// the wobble travels toward can go on containing both of the wobble's
// covering sets, and the scenario measures a confident zero while the
// geometry precondition below still passes. simulateWobbleRebuilds seeds
// from the minimal covering set for the same reason -- that is the range the
// rightward approach actually leaves behind, up to the one tile of
// trailing-edge lag the spec's own policy-expectation tolerance absorbs.
//
// Returns the MIDDLE of the widest run of qualifying nudges rather than the
// first one found: the qualifying window is only a few pixels wide, and its
// edges are where a sub-pixel discrepancy between this prediction and what
// the browser actually lays out would flip the answer.
export function findThrashNudgePx(base: Camera, widthPx: number, heightPx: number, amplitudePx: number): number {
  const qualifying = qualifyingNudges(base, widthPx, heightPx, amplitudePx)
  const run = widestRun(qualifying)
  if (!run) {
    throw new Error(
      `findThrashNudgePx: no nudge in [${MIN_NUDGE_PX}, ${MIN_NUDGE_PX + nudgeScanSpanPx(base)}] makes a ${amplitudePx}px wobble's two covering tile ranges land non-nested -- the viewport is ${viewportWidthInTiles(widthPx, base.cellSize)} tiles wide, which is not thrash geometry for this amplitude`,
    )
  }
  return run.start + Math.floor((run.length - 1) / 2)
}

function nudgeScanSpanPx(base: Camera): number {
  return Math.ceil(TILE_SPAN_CELLS * base.cellSize)
}

// A nudge qualifies when it puts the wobble's two covering tile ranges in
// the non-nested (thrash) configuration -- geometry alone, invariant across
// whatever nextTileRange's retention policy currently does with it.
function qualifyingNudges(base: Camera, widthPx: number, heightPx: number, amplitudePx: number): boolean[] {
  const qualifying: boolean[] = []
  for (let offset = 0; offset <= nudgeScanSpanPx(base); offset++) {
    const nudged = panCamera(base, MIN_NUDGE_PX + offset, 0)
    qualifying.push(!wobbleCoveringRangesAreNested(nudged, widthPx, heightPx, amplitudePx))
  }
  return qualifying
}

function widestRun(flags: boolean[]): { start: number; length: number } | null {
  let best: { start: number; length: number } | null = null
  let runStart = -1
  for (let i = 0; i <= flags.length; i++) {
    if (flags[i]) {
      if (runStart < 0) runStart = i
      continue
    }
    if (runStart >= 0) {
      const length = i - runStart
      if (!best || length > best.length) best = { start: MIN_NUDGE_PX + runStart, length }
      runStart = -1
    }
  }
  return best
}
