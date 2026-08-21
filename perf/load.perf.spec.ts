// Scenario 9 (live) and scenario 10 (drafted, test.skip) of the
// render-perf harness.
//
// 9 initial-load: time to first stable frame (wall clock from navigation
//   start to the same "app has settled" zoom-readout signal every other
//   spec in perf/ waits on) plus the CDP Nodes/JSHeapUsedSize deltas over
//   that same window, at 0/1k/50k live cells.
//
// 10 playback-sustained: intentionally not run yet -- see its own comment
//    below.
//
// Records raw samples only -- see raw-sink.ts's header comment.
import { expect, test, type Page } from '@playwright/test'
import { startMetrics } from './cdp-metrics'
import { clickPaced } from './gestures'
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

// Higher than pan/zoom's REP_COUNT=5 -- see generation.perf.spec.ts's
// identical comment. initial-load's own wall clock is sub-200ms, short
// enough that OS scheduling jitter dominates the median at 5 reps.
const REP_COUNT = 9

function runLoadScenario(
  scenario: string,
  seedQuery: string | undefined,
  assertPopulation?: (page: Page, viewport: { width: number; height: number }) => Promise<void>,
) {
  test(scenario, async ({ page }, testInfo) => {
    // autoStart: true (see instrumentation.ts's own comment on why) starts
    // the rAF collector synchronously at document-init, before this page's
    // own scripts run -- the only way to capture frame data spanning
    // navigation-start through first stable frame. Registered once, outside
    // the rep loop: Playwright re-runs an added init script on every
    // subsequent navigation of the same page automatically, so re-adding it
    // per rep would just accumulate orphaned collectors from every earlier
    // rep's navigation.
    await page.addInitScript(installPerfInstrumentation, {
      eventDurationThresholdMs: EVENT_DURATION_THRESHOLD_MS,
      autoStart: true,
    })

    const viewport = page.viewportSize()
    if (!viewport) throw new Error(`${scenario} requires a fixed viewport`)

    const metrics = await startMetrics(page)
    await metrics.setCpuThrottling(CPU_THROTTLING_RATE)

    const reps: RepSample[] = []
    for (let rep = 0; rep < REP_COUNT; rep++) {
      const before = await metrics.snapshot()
      const startedAtMs = Date.now()
      await page.goto(seedQuery ? `/${seedQuery}` : '/')
      await expect(page.getByText(/^\d+%$/)).toBeVisible()
      const wallClockMs = Date.now() - startedAtMs
      const after = await metrics.snapshot()
      const snapshot = await page.evaluate(readSnapshot)
      const renderedCellCount = await page.locator('#grid-content button').count()

      // Population is checked once settled, on every rep -- a seed that
      // silently fails on, say, only the 3rd navigation (a flaky
      // App.tsx-mount race, not something this slice has evidence for but
      // also has not ruled out) would otherwise only be caught by luck.
      if (assertPopulation) {
        await assertPopulation(page, viewport)
      }

      reps.push({
        frameIntervalsMs: snapshot.frameIntervalsMs,
        eventDurationsMs: snapshot.eventDurationsMs,
        longTaskCount: snapshot.longTaskCount,
        // No gesture this scenario measures -- the "load" itself is what's
        // measured, not a repeated action within it. See raw-sample.ts:
        // stats.ts's metricsDeltaPerMoveEvent normalisation skips a rep
        // whose denominator is 0, so this correctly reports that ratio as
        // unavailable rather than dividing by zero.
        moveEventCount: 0,
        renderedCellCount,
        metricsDelta: metrics.diff(before, after),
        wallClockMs,
      })
    }

    await metrics.dispose()

    writeScenarioSample(page, testInfo, scenario, reps)
  })
}

runLoadScenario('initial-load-empty', undefined)
runLoadScenario('initial-load-1k-inview', '?cells=1000&spread=30', (page, viewport) =>
  assertInViewAlivePopulation(page, viewport, 1000, 30),
)
runLoadScenario('initial-load-50k-offscreen', '?cells=50000&spread=200', (page, viewport) =>
  assertOffscreenSeedTookEffect(page, viewport),
)

// Scenario 10, drafted but not run: "sustained playback" -- many
// generations advanced back-to-back, the way a user leaving the app
// clicking Next Generation repeatedly over an extended session would. This
// app has no auto-play/interval-driven playback feature (see CLAUDE.md:
// generations advance manually, no keyboard shortcut, no timer), so the
// only faithful way to drive this today is the same clickPaced loop
// generation.perf.spec.ts already uses, just for many more iterations --
// which is also exactly why this is test.skip rather than live: nothing in
// this slice has established what "sustained" should mean (how many
// generations, over what wall-clock budget) or measured whether a run this
// long makes perf/'s own suite duration unacceptable. A later slice should
// pick those numbers with real data in hand (this scenario's own draft
// runs, plus generation-advance's numbers as a per-generation baseline)
// before flipping this to `test`.
const SUSTAINED_GENERATIONS_PER_REP = 200

function runPlaybackSustainedScenario(scenario: string, seedQuery: string) {
  test.skip(scenario, async ({ page }, testInfo) => {
    await page.addInitScript(installPerfInstrumentation, { eventDurationThresholdMs: EVENT_DURATION_THRESHOLD_MS })
    await page.goto(`/${seedQuery}`)
    await expect(page.getByText(/^\d+%$/)).toBeVisible()

    const viewport = page.viewportSize()
    if (!viewport) throw new Error(`${scenario} requires a fixed viewport`)

    const nextGenerationButton = page.locator('#next-generation-button')
    const metrics = await startMetrics(page)
    await metrics.setCpuThrottling(CPU_THROTTLING_RATE)

    const reps: RepSample[] = []
    for (let rep = 0; rep < REP_COUNT; rep++) {
      await page.evaluate(startCollecting)
      const before = await metrics.snapshot()
      const startedAtMs = Date.now()
      const clickCount = await clickPaced(page, nextGenerationButton, SUSTAINED_GENERATIONS_PER_REP)
      const wallClockMs = Date.now() - startedAtMs
      const after = await metrics.snapshot()
      const snapshot = await page.evaluate(readSnapshot)
      const renderedCellCount = await page.locator('#grid-content button').count()

      reps.push({
        frameIntervalsMs: snapshot.frameIntervalsMs,
        eventDurationsMs: snapshot.eventDurationsMs,
        longTaskCount: snapshot.longTaskCount,
        moveEventCount: clickCount,
        renderedCellCount,
        metricsDelta: metrics.diff(before, after),
        wallClockMs,
      })
    }

    await metrics.dispose()

    writeScenarioSample(page, testInfo, scenario, reps)
  })
}

runPlaybackSustainedScenario('playback-sustained-1k', '?cells=1000&spread=30')
runPlaybackSustainedScenario('playback-sustained-50k', '?cells=50000&spread=200')
