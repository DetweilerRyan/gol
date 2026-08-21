import type { RawScenarioSample, RepSample } from './raw-sample.ts'

// Shared fixture builders for perf-report's test files (format.test.ts,
// stats.test.ts, units.test.ts each construct RepSample/RawScenarioSample
// values). The three files' prior defaults differed slightly (metricsDelta
// contents, scenario name), but none of their tests actually depended on the
// implicit default -- every assertion that cares about a metricsDelta or
// scenario value passes it explicitly via `overrides`, and the default only
// exists to satisfy the type shape when a test doesn't care. Consolidating
// onto one default (format.test.ts's originals, picked arbitrarily) is
// therefore behavior-preserving across all three files.
//
// Excluded from crap4ts/Stryker's scripts/ scope the same way
// src/test-support/ is excluded from src/'s -- see crap4ts.scripts.config.ts
// and stryker.scripts.config.json. Fixture builders that only ever return
// literal defaults would otherwise pad the mutant count with survivors on
// fields no test asserts, rather than surface a real gap.
export function rep(overrides: Partial<RepSample> = {}): RepSample {
  return {
    frameIntervalsMs: [16, 17, 18],
    eventDurationsMs: [],
    longTaskCount: 0,
    moveEventCount: 100,
    renderedCellCount: 2000,
    metricsDelta: { TaskDuration: 10 },
    wallClockMs: 1000,
    ...overrides,
  }
}

export function sample(overrides: Partial<RawScenarioSample> = {}): RawScenarioSample {
  return {
    scenario: 'pan-across-populated-grid',
    project: '1280x900',
    url: 'http://localhost:5173/',
    cpuThrottlingRate: 1,
    chromiumVersion: '140.0.0.0',
    buildMode: 'perf',
    reps: [rep(), rep(), rep()],
    ...overrides,
  }
}
