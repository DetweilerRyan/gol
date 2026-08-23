// Scenarios 6-8 of the render-perf harness: the tile-boundary wobble family.
// One gesture (panWobblePaced, see gestures.ts), one viewport (1280x900,
// see playwright.perf.config.ts's testIgnore on the 1920x1080 project), three
// zoom levels chosen purely for the tile geometry they produce:
//
//   scenario                        cellSize  viewport in tiles  expectation (post-fix)
//   ------------------------------  --------  -----------------  ----------------------
//   wobble-tile-boundary-thrash        8.192   39.0625  just-over  <=1 rebuild, then settle (was every move, pre-fix)
//   wobble-tile-boundary-safe         10.240   31.2500  mid-tile   never rebuild
//   wobble-tile-boundary-aligned      20.000   16.0000  exact      rebuild once, then settle
//
// WHY THIS FAMILY EXISTS. It is now the REGRESSION GUARD for a defect that
// shipped, was measured here, and has since been fixed. Where the viewport
// is a whisker wider than a whole number of tiles, the leading and trailing
// tile edges cross within the same sub-cell step, so a small back-and-forth
// pan SHIFTS the covering set rather than widening it and neither position's
// range contains the other's -- cellTiles.ts's tileRangeHolds comment
// discloses this geometry, and cellTiles.property.test.ts pins it. Before the
// fix, nextTileRange rebuilt onto that shifted set on every step; measured
// against this exact family (git 44d72f9), that cost 896 DOM-node churn/move
// and a 58.4ms p95 frame interval (7.0 quanta, at this box's 8.33ms refresh)
// on the thrash row alone. cellTiles.ts's nextTileRange now retains a lag
// tile on the trailing side instead of rebuilding onto the covering set
// exactly (see EVICT_LAG_TILES' and nextTileRange's own comments), which
// converts that same shift into a single rebuild that then holds --
// MAX_THRASH_REBUILDS below is what keeps that fixed. Nothing in scenarios
// 1-5 could ever see the underlying geometry either way: panPaced
// interpolates monotonically, and a monotone camera offset crosses any given
// tile boundary at most once.
//
// THE THREE ROWS ARE THE MEASUREMENT. A thrash number on its own says
// nothing -- it could be the cost of the gesture rather than of the geometry.
// The safe row runs the identical gesture at a zoom level whose fractional
// tile count puts the two edge crossings 10.24px apart, further than the
// wobble travels, so it is the same drag against geometry that cannot thrash.
// The aligned row is the third case worth having: at exactly 16.0000 tiles
// the two crossings coincide, and a wobble that starts ON that boundary and
// travels one way widens the range once and then holds -- so its churn shows
// up in rep 0 and nowhere else, which is a signature no amount of ordinary
// panning produces.
//
// The headline number is nodeChurnCount: DOM nodes added plus removed under
// #grid-content per rep (see instrumentation.ts). Cost in milliseconds is
// machine-specific and noisy; the strip mount/unmount count is exact, is what
// the hysteresis fix above moved (896 -> 0 on the thrash row's measured
// reps), and stays directly comparable between runs on different hardware.
//
// Records raw samples only -- see raw-sink.ts's header comment. `npm run
// perf-report` computes the per-move-event normalisation.
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { startMetrics } from './cdp-metrics'
import { panPaced, panWobblePaced } from './gestures'
import {
  CPU_THROTTLING_RATE,
  EVENT_DURATION_THRESHOLD_MS,
  readSnapshot,
  startCollecting,
  writeScenarioSample,
} from './harness'
import { installPerfInstrumentation } from './instrumentation'
import {
  expectedZoomReadout,
  findThrashNudgePx,
  readGridGeometry,
  simulateWobbleRebuilds,
  viewportWidthInTiles,
  wobbleCoveringRangesAreNested,
} from './tile-boundary'
import type { RepSample } from '../scripts/perf-report/raw-sample.ts'

// Rep 0 is a discarded warm-up (see raw-sample.ts's MIN_REPS comment).
const REP_COUNT = 5

// Must be even -- panWobblePaced enforces it -- so each rep ends the drag
// back where it started and every rep measures the same tile-boundary phase.
const MOVES_PER_REP = 40

// 5px, not 3px: the wobble has to span both edge crossings, which at
// cellSize 8.192 sit 0.25 cells (2.048px) apart, and it has to exceed
// dragGesture.ts's DRAG_THRESHOLD_PX of 4 or the gesture never pans at all.
// 3px clears the first constraint by 0.95px and fails the second outright;
// 5px leaves a 2.95px-wide window of qualifying whole-pixel phases for
// findThrashNudgePx to aim at, and stays a plausible hand tremor rather
// than a pan.
const WOBBLE_AMPLITUDE_PX = 5

// The subtree whose node churn is counted. Also the selector the scenario
// counts rendered cells under, so a typo here fails the rendered-cell
// assertion rather than silently reporting zero churn.
const GRID_CONTENT_SELECTOR = '#grid-content'

// These render 11k-18k buttons and rebuild a ~450-cell strip on most moves;
// the min-zoom pan scenarios already needed well past the config's 120s
// default for the button count alone (see pan.perf.spec.ts's timeoutMs
// comment), and this family adds the strip work on top.
const TIMEOUT_MS = 300_000

interface WobbleScenarioSpec {
  scenario: string
  // Clicks of the toolbar's own Zoom out button -- the path a user takes to
  // this zoom level by hand. DEFAULT_CELL_SIZE / ZOOM_FACTOR**clicks, exactly.
  zoomOutClicks: number
  cellSizePx: number
  // widthPx / cellSize / TILE_SPAN_CELLS. Asserted, not just documented: it
  // is the single number that decides which of the three cases this is.
  expectedViewportTiles: number
  // Whether to hunt for the tile-boundary phase before measuring. The two
  // control rows deliberately measure whatever phase the zoom happens to
  // produce -- their geometry cannot thrash at any phase, which is the point.
  phaseLockToThrash: boolean
}

async function zoomOutTimes(page: Page, clicks: number): Promise<void> {
  const zoomOutButton = page.locator('button[aria-label="Zoom out"]')
  for (let i = 0; i < clicks; i++) {
    await zoomOutButton.click()
  }
}

// What prepareCamera confirms about the phase it attained, before anything
// is measured: a geometry fact (fix-invariant, see below) and a policy fact
// (checked against the fixed policy's own guarantee, see
// MAX_THRASH_REBUILDS/MAX_CONTROL_REBUILDS below).
interface AttainedPhase {
  rangesNested: boolean
  predictedRebuilds: number
}

// Everything between page load and the first measured rep. Kept in one
// function because each step's assertion guards the next step's assumption:
// the readout pins cellSize, cellSize makes the DOM read solvable for
// offsetX, offsetX makes the phase search meaningful, and the re-read
// afterwards checks the search's prediction against the camera the browser
// actually ended up with rather than the one Node predicted.
async function prepareCamera(
  page: Page,
  spec: WobbleScenarioSpec,
  from: { x: number; y: number },
): Promise<AttainedPhase> {
  await zoomOutTimes(page, spec.zoomOutClicks)
  await expect(page.getByText(expectedZoomReadout(spec.cellSizePx))).toBeVisible()

  const beforeNudge = await readGridGeometry(page, spec.cellSizePx)
  // A cross-check on the cellSize the readout pinned, from a completely
  // different source (16 cells of rendered pixel span). Loose to 2 decimal
  // places because Blink lays out in 1/64px units.
  expect(beforeNudge.measuredCellSizePx).toBeCloseTo(spec.cellSizePx, 2)
  expect(viewportWidthInTiles(beforeNudge.widthPx, spec.cellSizePx)).toBeCloseTo(spec.expectedViewportTiles, 4)

  if (spec.phaseLockToThrash) {
    const nudgePx = findThrashNudgePx(
      beforeNudge.camera,
      beforeNudge.widthPx,
      beforeNudge.heightPx,
      WOBBLE_AMPLITUDE_PX,
    )
    // One paced move, deliberately: gestures.ts exports no unpaced driver
    // and this doesn't need one. findThrashNudgePx only ever returns a value
    // above DRAG_THRESHOLD_PX, so a single move is enough to become a pan.
    await panPaced(page, from, { x: nudgePx, y: 0 }, 1)
  }

  const measured = await readGridGeometry(page, spec.cellSizePx)
  return {
    rangesNested: wobbleCoveringRangesAreNested(
      measured.camera,
      measured.widthPx,
      measured.heightPx,
      WOBBLE_AMPLITUDE_PX,
    ),
    predictedRebuilds: simulateWobbleRebuilds(
      measured.camera,
      measured.widthPx,
      measured.heightPx,
      WOBBLE_AMPLITUDE_PX,
      MOVES_PER_REP,
    ),
  }
}

// The GEOMETRY precondition -- fix-invariant, and checked against both the
// thrash row and the two control rows: whether the wobble's two covering
// tile ranges (wobbleCoveringRangesAreNested, tile-boundary.ts) nest at the
// phase prepareCamera attained. This is a fact about coveringTileRange alone
// and never mentions nextTileRange's retention policy, which is what keeps
// it true whether or not that policy currently has the tile-boundary defect.
//
// The POLICY expectation below it is the REGRESSION GUARD: that
// cellTiles.ts's nextTileRange, as fixed, confines a thrash-geometry wobble
// to at most one rebuild rather than reproducing the pre-fix defect (which
// rebuilt almost every move -- see this file's header for the measured
// numbers). MAX_THRASH_REBUILDS held the opposite bound before
// fix-tile-hysteresis commit 3 (>= MOVES_PER_REP - 2, i.e. the defect WAS the
// expectation); this is that flip. The geometry precondition above it never
// moved.
//
// The controls' bound is 1 rather than 0 because "safe" means the wobble
// cannot thrash, not that it can never rebuild: when only the leading edge
// crosses, the range widens once and then holds for the rest of the gesture
// no matter how long it runs. That is the aligned row's whole signature.
// MAX_THRASH_REBUILDS stays a separate constant from MAX_CONTROL_REBUILDS
// even though both are 1 today: they assert different things -- a geometry
// that provably cannot thrash, versus one that can but is now held to the
// same bound by the retention policy -- and collapsing them into one name
// would lose that distinction the day either changes independently.
const MAX_CONTROL_REBUILDS = 1
const MAX_THRASH_REBUILDS = 1

async function runWobbleScenario(page: Page, testInfo: TestInfo, spec: WobbleScenarioSpec): Promise<void> {
  testInfo.setTimeout(TIMEOUT_MS)
  await page.addInitScript(installPerfInstrumentation, {
    eventDurationThresholdMs: EVENT_DURATION_THRESHOLD_MS,
    nodeChurnSelector: GRID_CONTENT_SELECTOR,
  })
  await page.goto('/')
  await expect(page.getByText(/^\d+%$/)).toBeVisible()

  const viewport = page.viewportSize()
  if (!viewport) throw new Error(`${spec.scenario} requires a fixed viewport`)
  // Whole pixels: every pointer coordinate this scenario dispatches has to
  // stay an integer, since the phase search works in whole-pixel nudges.
  const from = { x: Math.round(viewport.width / 2), y: Math.round(viewport.height / 2) }

  const { rangesNested, predictedRebuilds } = await prepareCamera(page, spec, from)
  if (spec.phaseLockToThrash) {
    expect(rangesNested, 'the attained camera phase must be non-nested (thrash) geometry').toBe(false)
    expect(
      predictedRebuilds,
      'the retention policy must confine a thrash-phase wobble to at most one rebuild',
    ).toBeLessThanOrEqual(MAX_THRASH_REBUILDS)
  } else {
    expect(rangesNested, "a control row's geometry must be nested (cannot thrash) at the phase it attained").toBe(true)
    expect(predictedRebuilds, 'a control row must rebuild at most once').toBeLessThanOrEqual(MAX_CONTROL_REBUILDS)
  }

  const metrics = await startMetrics(page)
  await metrics.setCpuThrottling(CPU_THROTTLING_RATE)

  const reps: RepSample[] = []
  for (let rep = 0; rep < REP_COUNT; rep++) {
    await page.evaluate(startCollecting)
    const before = await metrics.snapshot()
    const startedAtMs = Date.now()
    const moveEventCount = await panWobblePaced(page, from, WOBBLE_AMPLITUDE_PX, MOVES_PER_REP)
    const wallClockMs = Date.now() - startedAtMs
    const after = await metrics.snapshot()
    const snapshot = await page.evaluate(readSnapshot)
    const renderedCellCount = await page.locator(`${GRID_CONTENT_SELECTOR} button`).count()

    // Not a performance assertion -- a harness-integrity one, in the same
    // spirit as population.ts. A MutationObserver that never attached
    // reports 0 churn, which is indistinguishable from the safe row's
    // genuine 0.
    expect(snapshot.nodeChurnObserved, 'the node-churn observer must have attached').toBe(true)
    expect(renderedCellCount).toBeGreaterThan(0)

    reps.push({
      frameIntervalsMs: snapshot.frameIntervalsMs,
      eventDurationsMs: snapshot.eventDurationsMs,
      longTaskCount: snapshot.longTaskCount,
      nodeChurnCount: snapshot.nodeChurnCount,
      moveEventCount,
      renderedCellCount,
      metricsDelta: metrics.diff(before, after),
      wallClockMs,
    })

    // No camera reset between reps: panWobblePaced nets exactly zero pan
    // (see its own header), so every rep runs against the phase
    // prepareCamera established and asserted once.
  }

  await metrics.dispose()

  writeScenarioSample(page, testInfo, spec.scenario, reps)
}

test('wobble-tile-boundary-thrash', async ({ page }, testInfo) => {
  await runWobbleScenario(page, testInfo, {
    scenario: 'wobble-tile-boundary-thrash',
    // 20 / 1.25**4 = 8.192, one rung ABOVE MIN_CELL_SIZE -- a fifth click
    // would clamp to 8.0 and land on 40.0000 tiles, a different case
    // entirely. expectedZoomReadout renders the two as 41% and 40%.
    zoomOutClicks: 4,
    cellSizePx: 8.192,
    expectedViewportTiles: 39.0625,
    phaseLockToThrash: true,
  })
})

test('wobble-tile-boundary-safe', async ({ page }, testInfo) => {
  await runWobbleScenario(page, testInfo, {
    scenario: 'wobble-tile-boundary-safe',
    // 20 / 1.25**3 = 10.24 -> 125 cells -> 31.2500 tiles. The two edge
    // crossings sit a full cell (10.24px) apart, twice as far as this
    // wobble travels, so no phase of it can cross both.
    zoomOutClicks: 3,
    cellSizePx: 10.24,
    expectedViewportTiles: 31.25,
    phaseLockToThrash: false,
  })
})

test('wobble-tile-boundary-aligned', async ({ page }, testInfo) => {
  await runWobbleScenario(page, testInfo, {
    scenario: 'wobble-tile-boundary-aligned',
    // The default camera, untouched: 64 cells across, exactly 16 tiles, and
    // centeredCamera puts offsetX at exactly -32 -- itself a tile boundary.
    // Both crossings coincide there, but the wobble travels one way from it,
    // so it widens the range once and holds.
    zoomOutClicks: 0,
    cellSizePx: 20,
    expectedViewportTiles: 16,
    phaseLockToThrash: false,
  })
})
