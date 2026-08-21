// Scenario 1 of the render-perf harness: a 400px horizontal drag at the
// default camera over an empty (0 live cell) grid. Records raw samples only
// -- see raw-sink.ts's header comment for why no percentile/statistics
// computation happens in this file. `npm run perf-report` (scripts/perf-report/)
// is the gated layer that turns reports/perf/raw/*.json into
// reports/perf/latest.md.
import { expect, test } from '@playwright/test'
import { startMetrics } from './cdp-metrics'
import { panPaced } from './gestures'
import { installPerfInstrumentation, type PerfHarnessWindow } from './instrumentation'
import { writeRawSample } from './raw-sink'
import type { RepSample } from '../scripts/perf-report/raw-sample.ts'

// Rep 0 is a discarded warm-up (see raw-sample.ts's MIN_REPS comment) --
// this harness just records it like any other rep and leaves the discard to
// scripts/perf-report/stats.ts.
const REP_COUNT = 5
const MOVES_PER_REP = 40
const PAN_DELTA = { x: 400, y: 0 }
// Event Timing API's minimum durationThreshold.
const EVENT_DURATION_THRESHOLD_MS = 16
// No artificial throttling for this baseline scenario -- 1 is CDP's "normal
// speed" rate, not "disabled".
const CPU_THROTTLING_RATE = 1

// page.evaluate(fn) runs `fn` inside the page with no implicit argument --
// `window` below is the page's own global, resolved the same way any other
// script running in that page would resolve it, not a parameter these
// functions receive from Node.
function readSnapshot() {
  return (window as unknown as PerfHarnessWindow).__perfHarness.stop()
}

function startCollecting() {
  ;(window as unknown as PerfHarnessWindow).__perfHarness.start()
}

test('pan-default-empty', async ({ page }, testInfo) => {
  await page.addInitScript(installPerfInstrumentation, { eventDurationThresholdMs: EVENT_DURATION_THRESHOLD_MS })
  await page.goto('/')
  // The grid centers itself on the first ResizeObserver measurement
  // (useInitialCentering); waiting for the zoom readout is the same
  // "app has settled" signal e2e/e2e-helpers.ts's zoomPercent() polls for,
  // reimplemented locally here rather than importing e2e/ -- see
  // gestures.ts's header comment on perf/ staying self-contained.
  await expect(page.getByText(/^\d+%$/)).toBeVisible()

  const viewport = page.viewportSize()
  if (!viewport) throw new Error('pan-default-empty requires a fixed viewport')
  const from = { x: viewport.width / 2, y: viewport.height / 2 }

  const metrics = await startMetrics(page)
  await metrics.setCpuThrottling(CPU_THROTTLING_RATE)

  const reps: RepSample[] = []
  for (let rep = 0; rep < REP_COUNT; rep++) {
    await page.evaluate(startCollecting)
    const before = await metrics.snapshot()
    const startedAtMs = Date.now()
    const moveEventCount = await panPaced(page, from, PAN_DELTA, MOVES_PER_REP)
    const wallClockMs = Date.now() - startedAtMs
    const after = await metrics.snapshot()
    const snapshot = await page.evaluate(readSnapshot)
    const renderedCellCount = await page.locator('#grid-content button').count()

    reps.push({
      frameIntervalsMs: snapshot.frameIntervalsMs,
      eventDurationsMs: snapshot.eventDurationsMs,
      longTaskCount: snapshot.longTaskCount,
      moveEventCount,
      renderedCellCount,
      metricsDelta: metrics.diff(before, after),
      wallClockMs,
    })

    // Each rep starts the next drag from the same point the previous one
    // ended, since panPaced never resets the camera -- deliberate: a
    // scenario this small always has budget for one more rep to just keep
    // panning rather than paying a reset-view round-trip per rep.
  }

  await metrics.dispose()

  writeRawSample({
    scenario: 'pan-default-empty',
    project: testInfo.project.name,
    url: page.url(),
    cpuThrottlingRate: CPU_THROTTLING_RATE,
    chromiumVersion: page.context().browser()?.version() ?? 'unknown',
    buildMode: 'perf',
    reps,
  })
})
