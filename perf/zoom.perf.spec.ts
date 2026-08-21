// Scenarios 6-7 of the render-perf harness. Both zoom the camera rather
// than pan it -- every visible button's width/height changes on a zoom
// (Grid.tsx passes camera.cellSize straight into each button's inline
// style), which invalidates layout for the whole rendered cell layer at
// once, a different shape of work from panning (which only moves buttons
// via `transform`, a compositor-only change in the common case).
//
//   6 zoom-shift-wheel    shift+wheel zoom-in/out ticks, 0/1k/50k live cells
//   7 zoom-toolbar-clamp  the 300%->40%->300% toolbar-button sweep, no seed
//                         -- crosses both the default-zoom (~3.4k rendered
//                         buttons) and min-zoom (~19.3k) cell counts on the
//                         way; see pan.perf.spec.ts's #4/#1 for those same
//                         two counts measured in isolation
//
// Records raw samples only -- see raw-sink.ts's header comment.
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { startMetrics } from './cdp-metrics'
import { clickPaced, zoomWheelPaced } from './gestures'
import { installPerfInstrumentation, type PerfHarnessWindow } from './instrumentation'
import { assertInViewAlivePopulation, assertOffscreenSeedTookEffect } from './population'
import { writeRawSample } from './raw-sink'
import type { RepSample } from '../scripts/perf-report/raw-sample.ts'

const REP_COUNT = 5
const EVENT_DURATION_THRESHOLD_MS = 16
const CPU_THROTTLING_RATE = 1

function readSnapshot() {
  return (window as unknown as PerfHarnessWindow).__perfHarness.stop()
}

function startCollecting() {
  ;(window as unknown as PerfHarnessWindow).__perfHarness.start()
}

async function gotoAndSettle(page: Page, seedQuery?: string): Promise<{ width: number; height: number }> {
  await page.addInitScript(installPerfInstrumentation, { eventDurationThresholdMs: EVENT_DURATION_THRESHOLD_MS })
  await page.goto(seedQuery ? `/${seedQuery}` : '/')
  await expect(page.getByText(/^\d+%$/)).toBeVisible()
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('zoom scenario requires a fixed viewport')
  return viewport
}

async function measureReps(
  page: Page,
  testInfo: TestInfo,
  scenario: string,
  runGesture: (page: Page, viewport: { width: number; height: number }) => Promise<number>,
  viewport: { width: number; height: number },
): Promise<void> {
  const metrics = await startMetrics(page)
  await metrics.setCpuThrottling(CPU_THROTTLING_RATE)

  const reps: RepSample[] = []
  for (let rep = 0; rep < REP_COUNT; rep++) {
    await page.evaluate(startCollecting)
    const before = await metrics.snapshot()
    const startedAtMs = Date.now()
    const tickCount = await runGesture(page, viewport)
    const wallClockMs = Date.now() - startedAtMs
    const after = await metrics.snapshot()
    const snapshot = await page.evaluate(readSnapshot)
    const renderedCellCount = await page.locator('#grid-content button').count()

    reps.push({
      frameIntervalsMs: snapshot.frameIntervalsMs,
      eventDurationsMs: snapshot.eventDurationsMs,
      longTaskCount: snapshot.longTaskCount,
      // Reusing the pan scenarios' moveEventCount field for "how many
      // zoom ticks/clicks drove this rep" -- see raw-sample.ts: it exists
      // as a generic per-rep denominator for
      // metricsDeltaPerMoveEvent/scripts/perf-report/stats.ts, not
      // specifically a pointermove count.
      moveEventCount: tickCount,
      renderedCellCount,
      metricsDelta: metrics.diff(before, after),
      wallClockMs,
    })
  }

  await metrics.dispose()

  writeRawSample({
    scenario,
    project: testInfo.project.name,
    url: page.url(),
    cpuThrottlingRate: CPU_THROTTLING_RATE,
    chromiumVersion: page.context().browser()?.version() ?? 'unknown',
    buildMode: 'perf',
    reps,
  })
}

// Even, so an equal number of zoom-in/zoom-out ticks run per rep --
// ZOOM_FACTOR and 1/ZOOM_FACTOR are exact inverses (camera.ts), so cellSize
// returns to (approximately) where the rep started, and no explicit
// reset-view click is needed between reps.
const ZOOM_TICKS_PER_REP = 20
const WHEEL_DELTA_MAGNITUDE = 100

function runZoomWheelScenario(
  scenario: string,
  seedQuery: string | undefined,
  expectPopulation?: number,
  spread?: number,
) {
  test(scenario, async ({ page }, testInfo) => {
    const viewport = await gotoAndSettle(page, seedQuery)

    if (expectPopulation !== undefined && spread !== undefined) {
      if (spread <= 30) {
        await assertInViewAlivePopulation(page, viewport, expectPopulation, spread)
      } else {
        await assertOffscreenSeedTookEffect(page, viewport)
      }
    }

    await measureReps(
      page,
      testInfo,
      scenario,
      (p, vp) => zoomWheelPaced(p, { x: vp.width / 2, y: vp.height / 2 }, WHEEL_DELTA_MAGNITUDE, ZOOM_TICKS_PER_REP),
      viewport,
    )
  })
}

runZoomWheelScenario('zoom-shift-wheel-empty', undefined)
runZoomWheelScenario('zoom-shift-wheel-1k-inview', '?cells=1000&spread=30', 1000, 30)
runZoomWheelScenario('zoom-shift-wheel-50k-offscreen', '?cells=50000&spread=200', 50000, 200)

// Zoom in to the MAX_CELL_SIZE clamp, out to the MIN_CELL_SIZE clamp, back
// to the MAX_CELL_SIZE clamp -- see camera.ts's clampCellSize and
// pan.perf.spec.ts's zoomToMinimum comment for the click-count arithmetic
// (5 clicks to clamp zooming in from 100%, 10 clicks to clamp zooming out
// from 300%, 10 clicks to clamp zooming back in from 40%). Each rep resets
// to the default 100% first (unmeasured, like pan.perf.spec.ts's
// zoomToMinimum setup) so every rep starts from the same state.
const ZOOM_IN_TO_MAX_CLICKS = 5
const ZOOM_OUT_TO_MIN_CLICKS = 10
const ZOOM_IN_BACK_TO_MAX_CLICKS = 10

// renderedCellCount (recorded by measureReps, after the gesture callback
// returns) reflects the sweep's *ending* zoom level -- 300%, the fewest
// rendered buttons of the whole sweep -- not the ~19.3k peak reached
// mid-sweep at the 40% floor. pan.perf.spec.ts's pan-min-zoom-empty
// measures that peak directly, held steady rather than transient.
test('zoom-toolbar-clamp', async ({ page }, testInfo) => {
  const viewport = await gotoAndSettle(page)
  const zoomInButton = page.locator('button[aria-label="Zoom in"]')
  const zoomOutButton = page.locator('button[aria-label="Zoom out"]')
  const resetButton = page.locator('button[aria-label="Reset view"]')

  await measureReps(
    page,
    testInfo,
    'zoom-toolbar-clamp',
    async () => {
      // Reset-to-100% runs inside the gesture callback (rather than once
      // before the rep loop) so every rep starts from the same state -- but
      // that means it is *not* excluded from measurement: measureReps's
      // before/after CDP snapshot brackets this whole callback, so each
      // rep's numbers include one reset transition's cost folded in
      // alongside the sweep itself. Renders back to ~3.4k buttons before the
      // sweep begins; see pan.perf.spec.ts's #1 for that count measured in
      // isolation, unmixed with a reset.
      await resetButton.click()
      await expect(page.getByText('100%')).toBeVisible()

      let clickCount = 0
      clickCount += await clickPaced(page, zoomInButton, ZOOM_IN_TO_MAX_CLICKS)
      clickCount += await clickPaced(page, zoomOutButton, ZOOM_OUT_TO_MIN_CLICKS)
      clickCount += await clickPaced(page, zoomInButton, ZOOM_IN_BACK_TO_MAX_CLICKS)
      return clickCount
    },
    viewport,
  )
})
