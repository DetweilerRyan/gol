import type { RawScenarioSample, RepSample } from './raw-sample.ts'

// CDP's Performance domain (perf/cdp-metrics.ts's startMetrics) reports its
// duration/CPU-time counters in *seconds* -- every other duration in this
// report (frameIntervalsMs, eventDurationsMs, wallClockMs, and everything
// stats.ts derives from them) is milliseconds. perf/raw-sink.ts records
// whatever CDP returns exactly as received (see its header comment), so
// nothing upstream of this module has ever rescaled a metricsDelta value;
// report time -- here, via convertSampleMetricsToMs, called once from
// format.ts's buildLatestReport before stats.ts sees a sample -- is the
// first and only place that may.
//
// Discovered empirically while building this slice (invocation D): a single
// pan-default-empty rep recorded metricsDelta.TaskDuration = 2.02 against a
// wallClockMs of 2350 -- about 1000x too small for a gesture that keeps the
// main thread essentially fully busy. format.ts's
// taskDurationToWallClockRatio existed for exactly this: it read ~0.0009
// before this fix (seconds compared against milliseconds) and reads ~0.86
// after it (TaskDuration correctly in milliseconds, still slightly under 1
// because CDP's per-task accounting doesn't capture every idle micro-gap or
// cross-process overhead a wall-clock stopwatch does). It stays in the
// report header as a standing tripwire against a future CDP behavior
// change, not just today's fix -- see format.ts.
//
// Named explicitly, not "every key in metricsDelta ending up scaled" --
// LayoutCount, RecalcStyleCount, Nodes, and JSHeapUsedSize (among many
// other keys CDP reports) are counts and byte totals, not durations, and
// multiplying those by 1000 would be a new silent corruption replacing the
// old one. The list below was built by inspecting a real
// Performance.getMetrics() response captured against this app (see the raw
// sample referenced above): every "*Duration"-named key is CDP-seconds, and
// so are ThreadTime/ProcessTime -- CPU-time counters with no "Duration" in
// their name but the same seconds magnitude and the same
// base::TimeDelta-backed accounting on Chromium's side (confirmed
// empirically: ThreadTime and TaskDuration land within a few percent of each
// other on every rep). Timestamp and the paint/timing fields
// (FirstMeaningfulPaint, DomContentLoaded, NavigationStart) are deliberately
// excluded even though they're also seconds-valued: they're points in time
// (seconds since epoch / since navigation start), not "how long did this
// step take" counters, and this report never surfaces them as a duration.
export const DURATION_METRIC_KEYS: ReadonlySet<string> = new Set([
  'LayoutDuration',
  'RecalcStyleDuration',
  'DevToolsCommandDuration',
  'ScriptDuration',
  'V8CompileDuration',
  'TaskDuration',
  'TaskOtherDuration',
  'ThreadTime',
  'ProcessTime',
])

const SECONDS_TO_MS = 1000

// Scales exactly the keys named above; every other key in `metricsDelta`
// (including ones this module has never heard of -- CDP's metric list isn't
// closed, and a future Chromium version could add one) passes through
// unscaled, since "unknown" must default to "leave it alone" rather than
// "guess it's a duration too".
export function convertMetricsDeltaToMs(metricsDelta: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(metricsDelta)) {
    result[key] = DURATION_METRIC_KEYS.has(key) ? value * SECONDS_TO_MS : value
  }
  return result
}

function convertRepMetricsToMs(rep: RepSample): RepSample {
  return { ...rep, metricsDelta: convertMetricsDeltaToMs(rep.metricsDelta) }
}

// Applied once, at report entry (format.ts's buildLatestReport), to every
// raw sample before stats.ts computes anything from it -- stats.ts and
// perf/'s on-disk raw files both stay oblivious to this conversion: stats.ts
// operates on whatever numbers it's handed, and perf/'s raw JSON keeps
// recording CDP's numbers exactly as received.
export function convertSampleMetricsToMs(sample: RawScenarioSample): RawScenarioSample {
  return { ...sample, reps: sample.reps.map(convertRepMetricsToMs) }
}
