// Scenario 8 of the render-perf harness: repeated Next Generation clicks.
// Isolates getNextGeneration (gameOfLife.ts -- O(live x 8) neighbor
// counting over a Map keyed by string) from the re-render it triggers --
// the CDP decomposition (metricsDelta.ScriptDuration vs
// RecalcStyleDuration/LayoutDuration) is what separates the two: computing
// the next generation is pure script work, the DOM update that follows
// (every cell button's class flips alive<->dead) is recalc/layout/paint.
//
// Two populations, both seeded far enough from the boundary that a handful
// of generations doesn't obviously die out or stabilize into nothing --
// see liveCellSeed.ts's uniform-random placement, which produces a
// board dense enough to keep evolving for at least a few generations at
// either population size:
//
//   generation-advance-1k-inview     1,000 live cells, spread=30
//   generation-advance-50k-offscreen 50,000 live cells, spread=200
//
// Records raw samples only -- see raw-sink.ts's header comment.
import { expect, test, type Page } from '@playwright/test'
import { startMetrics } from './cdp-metrics'
import { clickPaced } from './gestures'
import { installPerfInstrumentation, type PerfHarnessWindow } from './instrumentation'
import { assertInViewAlivePopulation, assertOffscreenSeedTookEffect } from './population'
import { writeRawSample } from './raw-sink'
import type { RepSample } from '../scripts/perf-report/raw-sample.ts'

// Higher than pan/zoom's REP_COUNT=5 -- discovered empirically while
// building this slice: this scenario's own wall clock is short enough
// (sub-second) that OS scheduling jitter dominates the median at 5 reps, and
// a second full run showed a measured rep's median moving >30% between runs.
// The pan/zoom scenarios don't need this: their multi-second gestures
// already average out that jitter within a single rep.
const REP_COUNT = 9
const GENERATIONS_PER_REP = 10
const EVENT_DURATION_THRESHOLD_MS = 16
const CPU_THROTTLING_RATE = 1

function readSnapshot() {
  return (window as unknown as PerfHarnessWindow).__perfHarness.stop()
}

function startCollecting() {
  ;(window as unknown as PerfHarnessWindow).__perfHarness.start()
}

function runGenerationScenario(
  scenario: string,
  seedQuery: string,
  assertPopulation: (page: Page, viewport: { width: number; height: number }) => Promise<void>,
) {
  test(scenario, async ({ page }, testInfo) => {
    await page.addInitScript(installPerfInstrumentation, { eventDurationThresholdMs: EVENT_DURATION_THRESHOLD_MS })
    await page.goto(`/${seedQuery}`)
    await expect(page.getByText(/^\d+%$/)).toBeVisible()

    const viewport = page.viewportSize()
    if (!viewport) throw new Error(`${scenario} requires a fixed viewport`)

    await assertPopulation(page, viewport)

    const nextGenerationButton = page.locator('#next-generation-button')

    const metrics = await startMetrics(page)
    await metrics.setCpuThrottling(CPU_THROTTLING_RATE)

    const reps: RepSample[] = []
    for (let rep = 0; rep < REP_COUNT; rep++) {
      await page.evaluate(startCollecting)
      const before = await metrics.snapshot()
      const startedAtMs = Date.now()
      const clickCount = await clickPaced(page, nextGenerationButton, GENERATIONS_PER_REP)
      const wallClockMs = Date.now() - startedAtMs
      const after = await metrics.snapshot()
      const snapshot = await page.evaluate(readSnapshot)
      const renderedCellCount = await page.locator('#grid-content button').count()

      reps.push({
        frameIntervalsMs: snapshot.frameIntervalsMs,
        eventDurationsMs: snapshot.eventDurationsMs,
        longTaskCount: snapshot.longTaskCount,
        // Reused for "generations advanced this rep" -- see
        // zoom.perf.spec.ts's identical reuse and raw-sample.ts's comment on
        // this being a generic per-rep denominator, not specifically a
        // pointermove count.
        moveEventCount: clickCount,
        renderedCellCount,
        metricsDelta: metrics.diff(before, after),
        wallClockMs,
      })

      // Live cells keep evolving generation to generation (no reset between
      // reps), same rationale as pan.perf.spec.ts's rep loop: cheaper than a
      // per-rep reseed round-trip, and every rep still measures the same
      // kind of work (one getNextGeneration + re-render per click) even as
      // the exact population drifts with the automaton's own rules.
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
  })
}

runGenerationScenario('generation-advance-1k-inview', '?cells=1000&spread=30', (page, viewport) =>
  assertInViewAlivePopulation(page, viewport, 1000, 30),
)
runGenerationScenario('generation-advance-50k-offscreen', '?cells=50000&spread=200', (page, viewport) =>
  assertOffscreenSeedTookEffect(page, viewport),
)
