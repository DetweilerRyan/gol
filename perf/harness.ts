// Boilerplate every perf/*.perf.spec.ts scenario file needs identically:
// the CDP throttling rate and Event Timing durationThreshold every scenario
// uses (no file has a reason to diverge -- see the constants below), the two
// page.evaluate() callbacks that start/stop instrumentation.ts's collector,
// and the RawScenarioSample envelope writeRawSample expects (only
// `scenario` and `reps` vary from one spec file to the next). Kept out of
// instrumentation.ts deliberately -- that file's own header comment
// restricts it to exactly the one function passed to addInitScript, plus
// the types around it.
//
// REP_COUNT is *not* here: generation/load's short sub-second gestures need
// 9 reps (see generation.perf.spec.ts's header comment) where pan/zoom's
// multi-second gestures only need 5, so it stays a per-file constant rather
// than one shared value that would paper over that difference.
import type { Page, TestInfo } from '@playwright/test'
import { writeRawSample } from './raw-sink'
import type { PerfHarnessWindow } from './instrumentation'
import type { RepSample } from '../scripts/perf-report/raw-sample.ts'

// Event Timing API's minimum durationThreshold.
export const EVENT_DURATION_THRESHOLD_MS = 16

// No artificial throttling for these baseline scenarios -- 1 is CDP's
// "normal speed" rate, not "disabled".
export const CPU_THROTTLING_RATE = 1

// page.evaluate(fn) runs `fn` inside the page with no implicit argument --
// `window` below is the page's own global, resolved the same way any other
// script running in that page would resolve it, not a parameter these
// functions receive from Node.
export function readSnapshot() {
  return (window as unknown as PerfHarnessWindow).__perfHarness.stop()
}

export function startCollecting() {
  ;(window as unknown as PerfHarnessWindow).__perfHarness.start()
}

// Wraps writeRawSample with the envelope fields every scenario derives from
// `page`/`testInfo` the same way -- only `scenario` and the reps themselves
// are scenario-specific.
export function writeScenarioSample(page: Page, testInfo: TestInfo, scenario: string, reps: RepSample[]): void {
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
