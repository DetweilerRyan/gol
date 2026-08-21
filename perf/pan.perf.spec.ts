// Scenarios 1-5 of the render-perf harness -- all a 400px horizontal drag,
// varying only the live-cell population and the starting zoom level. Each
// isolates a different hot spot (see the table in this slice's handoff):
//
//   1 pan-default-empty        baseline, 0 live cells, default zoom
//   2 pan-default-1k-inview    per-live-cell class-flip cost, against #1
//   3 pan-default-50k-offscreen  computeContentBounds(liveCells) cost --
//                              LifeBoard calls it unconditionally in its
//                              render body, once per pointermove, O(50,000)
//                              with a split(',') + two Number() per key. May
//                              legitimately come back flat: React Compiler
//                              may already memoize the call on liveCells
//                              identity, which doesn't change during a pan --
//                              see perf/README.md.
//   4 pan-min-zoom-empty       ~19.3k rendered buttons at cellSize:8, the
//                              known worst case for the cell layer alone
//   5 pan-min-zoom-50k         both hot spots (#3 + #4) at once
//
// Records raw samples only -- see raw-sink.ts's header comment for why no
// percentile/statistics computation happens in this file. `npm run
// perf-report` (scripts/perf-report/) is the gated layer that turns
// reports/perf/raw/*.json into reports/perf/latest.md.
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { startMetrics } from './cdp-metrics'
import { panPaced } from './gestures'
import {
  CPU_THROTTLING_RATE,
  EVENT_DURATION_THRESHOLD_MS,
  readSnapshot,
  startCollecting,
  writeScenarioSample,
} from './harness'
import { installPerfInstrumentation } from './instrumentation'
import { assertInViewAlivePopulation, assertOffscreenSeedTookEffect } from './population'
import type { RepSample } from '../scripts/perf-report/raw-sample.ts'

// Rep 0 is a discarded warm-up (see raw-sample.ts's MIN_REPS comment) --
// this harness just records it like any other rep and leaves the discard to
// scripts/perf-report/stats.ts.
const REP_COUNT = 5
const MOVES_PER_REP = 40
const PAN_DELTA = { x: 400, y: 0 }

// Setup for the min-zoom scenarios (#4, #5): repeatedly clicks the
// toolbar's own "Zoom out" button until clampCellSize floors it at
// MIN_CELL_SIZE (camera.ts) -- the same path a user reaching for the
// worst-case cell count takes by hand. Deliberately unpaced and run before
// startMetrics/page.evaluate(startCollecting) touch anything: this is
// scenario *setup*, not the gesture being measured, so pacing it would only
// slow the test down for no data-quality benefit.
async function zoomToMinimum(page: Page): Promise<void> {
  const zoomOutButton = page.locator('button[aria-label="Zoom out"]')
  // ZOOM_FACTOR=1.25 compounding from DEFAULT_CELL_SIZE=20 clamps at
  // MIN_CELL_SIZE=8 within 5 clicks (20 * 1.25^-5 ~= 6.55, already
  // clamped) -- a few extra clicks is cheap insurance against that
  // arithmetic drifting if the constants ever change.
  for (let i = 0; i < 8; i++) {
    await zoomOutButton.click()
  }
  await expect(page.getByText('40%')).toBeVisible()
}

interface PanScenarioSpec {
  scenario: string
  // Appended to '/' verbatim, e.g. '?cells=1000&spread=30' -- see
  // liveCellSeed.ts's parseSeedRequest. Omitted entirely for an empty grid.
  seedQuery?: string
  // Population assertion, run once population and viewport are known but
  // *before* any camera change -- assertOffscreenSeedTookEffect's
  // scrollbar-ratio check is derived at the default zoom, where the
  // seeded content's pixel span is largest relative to the viewport (see
  // its own comment); running it after zoomToMinimum would shrink that
  // margin for no reason.
  assertPopulation?: (page: Page, viewport: { width: number; height: number }) => Promise<void>
  // Camera setup that isn't itself the measured gesture (currently just
  // zoomToMinimum for #4/#5).
  beforeMeasuring?: (page: Page) => Promise<void>
  // Overrides playwright.perf.config.ts's default 120s per-test timeout.
  // The min-zoom scenarios (#4/#5) render ~19.3k buttons at 1280x900 and
  // ~34k at 1920x1080 -- discovered empirically while building this slice:
  // 1280x900 comfortably fits 5 reps of 40 paced moves each in ~65s, but
  // 1920x1080's ~1.75x larger button count pushed the same rep count past
  // 120s and the test was killed mid-gesture. This is the scenario's own
  // point (the known worst case for the cell layer), not a flaw to paper
  // over by shrinking the gesture -- so the fix is more time, not less
  // work.
  timeoutMs?: number
}

async function runPanScenario(page: Page, testInfo: TestInfo, spec: PanScenarioSpec): Promise<void> {
  if (spec.timeoutMs !== undefined) {
    testInfo.setTimeout(spec.timeoutMs)
  }
  await page.addInitScript(installPerfInstrumentation, { eventDurationThresholdMs: EVENT_DURATION_THRESHOLD_MS })
  await page.goto(spec.seedQuery ? `/${spec.seedQuery}` : '/')
  // The grid centers itself on the first ResizeObserver measurement
  // (useInitialCentering); waiting for the zoom readout is the same
  // "app has settled" signal e2e/e2e-helpers.ts's zoomPercent() polls for,
  // reimplemented locally here rather than importing e2e/ -- see
  // gestures.ts's header comment on perf/ staying self-contained.
  await expect(page.getByText(/^\d+%$/)).toBeVisible()

  const viewport = page.viewportSize()
  if (!viewport) throw new Error(`${spec.scenario} requires a fixed viewport`)

  if (spec.assertPopulation) {
    await spec.assertPopulation(page, viewport)
  }
  if (spec.beforeMeasuring) {
    await spec.beforeMeasuring(page)
  }

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

  writeScenarioSample(page, testInfo, spec.scenario, reps)
}

test('pan-default-empty', async ({ page }, testInfo) => {
  await runPanScenario(page, testInfo, { scenario: 'pan-default-empty' })
})

test('pan-default-1k-inview', async ({ page }, testInfo) => {
  await runPanScenario(page, testInfo, {
    scenario: 'pan-default-1k-inview',
    seedQuery: '?cells=1000&spread=30',
    assertPopulation: (p, viewport) => assertInViewAlivePopulation(p, viewport, 1000, 30),
  })
})

test('pan-default-50k-offscreen', async ({ page }, testInfo) => {
  await runPanScenario(page, testInfo, {
    scenario: 'pan-default-50k-offscreen',
    seedQuery: '?cells=50000&spread=200',
    assertPopulation: (p, viewport) => assertOffscreenSeedTookEffect(p, viewport),
  })
})

const MIN_ZOOM_TIMEOUT_MS = 300_000

test('pan-min-zoom-empty', async ({ page }, testInfo) => {
  await runPanScenario(page, testInfo, {
    scenario: 'pan-min-zoom-empty',
    beforeMeasuring: zoomToMinimum,
    timeoutMs: MIN_ZOOM_TIMEOUT_MS,
  })
})

test('pan-min-zoom-50k', async ({ page }, testInfo) => {
  await runPanScenario(page, testInfo, {
    scenario: 'pan-min-zoom-50k',
    seedQuery: '?cells=50000&spread=200',
    assertPopulation: (p, viewport) => assertOffscreenSeedTookEffect(p, viewport),
    beforeMeasuring: zoomToMinimum,
    timeoutMs: MIN_ZOOM_TIMEOUT_MS,
  })
})
