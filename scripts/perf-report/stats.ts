// Every percentile/median/normalisation computation the perf reporter makes
// lives here, and nowhere else -- see raw-sample.ts's header comment for why
// that boundary matters (a wrong number here is silent and plausible-looking,
// exactly the failure mode this module exists to keep out of perf/).

import type { RawScenarioSample, RepSample } from './raw-sample.ts'

// Linear interpolation between closest ranks (numpy's/Excel's default,
// "R-7"): rank = p/100 * (n-1), then interpolate between the values at the
// floor and ceiling of that rank. `sortedAscending` is a caller precondition
// -- this never sorts and never mutates its input, so callers that already
// hold a sorted array (or want to reuse one across several percentiles)
// don't pay to re-sort.
export function percentile(sortedAscending: number[], p: number): number {
  if (sortedAscending.length === 0) {
    throw new Error('percentile: sortedAscending must not be empty')
  }
  if (p < 0 || p > 100) {
    throw new Error(`percentile: p must be between 0 and 100, got ${p}`)
  }
  const rank = (p / 100) * (sortedAscending.length - 1)
  const lowerIndex = Math.floor(rank)
  const upperIndex = Math.ceil(rank)
  const weight = rank - lowerIndex
  return sortedAscending[lowerIndex] + (sortedAscending[upperIndex] - sortedAscending[lowerIndex]) * weight
}

// Sorts a copy (never mutates `values`) and delegates to percentile(_, 50).
export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error('median: values must not be empty')
  }
  return percentile(
    [...values].sort((a, b) => a - b),
    50,
  )
}

function nullableMedian(values: number[]): number | null {
  return values.length === 0 ? null : median(values)
}

function nullableMax(values: number[]): number | null {
  return values.length === 0 ? null : Math.max(...values)
}

// Summary of one per-rep numeric series (frame intervals, event durations)
// across every measured rep. `count` is the total number of underlying
// samples across all reps -- what makes an all-empty series (no long-task
// events recorded on a fast machine, the common case for eventDurationsMs)
// distinguishable from a genuine measurement of zero, rather than both
// collapsing to the same number.
export interface MetricSummary {
  count: number
  medianOfMedians: number | null
  maxOfP95s: number | null
}

// Per rep: median and p95 of that rep's own series. Across reps: median of
// the per-rep medians, max of the per-rep p95s -- the max is deliberate
// (worst-observed-rep, not averaged-away) since a perf report exists to
// surface the bad case, not smooth over it. A rep with an empty series
// (no events crossed the PerformanceObserver threshold that rep) contributes
// nothing to either aggregate rather than being coerced into 0.
function summarizeRepMetric(reps: RepSample[], select: (rep: RepSample) => number[]): MetricSummary {
  let count = 0
  const perRepMedians: number[] = []
  const perRepP95s: number[] = []
  for (const rep of reps) {
    const values = select(rep)
    count += values.length
    if (values.length === 0) continue
    const sorted = [...values].sort((a, b) => a - b)
    perRepMedians.push(percentile(sorted, 50))
    perRepP95s.push(percentile(sorted, 95))
  }
  return { count, medianOfMedians: nullableMedian(perRepMedians), maxOfP95s: nullableMax(perRepP95s) }
}

function collectMetricKeys(reps: RepSample[]): string[] {
  const keys = new Set<string>()
  for (const rep of reps) {
    for (const key of Object.keys(rep.metricsDelta)) {
      keys.add(key)
    }
  }
  return [...keys].sort()
}

// Normalises every metricsDelta key per rep first (value / denominator for
// that rep), then takes the median of those per-rep ratios -- matching the
// per-rep-first pattern summarizeRepMetric already uses, rather than
// dividing a summed numerator by a summed denominator (defensible, but
// inconsistent with the rest of this module). A rep whose denominator is 0
// (e.g. a static-render scenario with no pointer moves) is skipped for that
// key rather than dividing by zero; a key entirely missing from a rep's
// metricsDelta is skipped the same way. A key with no contributing rep
// reports `null`, never NaN.
function normalizePerRep(reps: RepSample[], denominatorOf: (rep: RepSample) => number): Record<string, number | null> {
  const keys = collectMetricKeys(reps)
  const result: Record<string, number | null> = {}
  for (const key of keys) {
    const ratios: number[] = []
    for (const rep of reps) {
      const denominator = denominatorOf(rep)
      const value = rep.metricsDelta[key]
      if (denominator === 0 || value === undefined) continue
      ratios.push(value / denominator)
    }
    result[key] = nullableMedian(ratios)
  }
  return result
}

export interface ScenarioStats {
  scenario: string
  project: string
  url: string
  cpuThrottlingRate: number
  chromiumVersion: string
  buildMode: string
  repCount: number
  frameIntervalsMs: MetricSummary
  eventDurationsMs: MetricSummary
  longTaskCount: { median: number }
  wallClockMs: { median: number }
  moveEventCount: { median: number }
  renderedCellCount: { median: number }
  metricsDeltaPerMoveEvent: Record<string, number | null>
  metricsDeltaPer1000Cells: Record<string, number | null>
}

// Discards rep 0 (the warm-up) and reduces the remaining reps to one summary
// per scenario. raw-sample.ts's MIN_REPS check guarantees at least one
// measured rep survives, so every plain median() call below has non-empty
// input.
export function aggregate(sample: RawScenarioSample): ScenarioStats {
  const [, ...measuredReps] = sample.reps

  return {
    scenario: sample.scenario,
    project: sample.project,
    url: sample.url,
    cpuThrottlingRate: sample.cpuThrottlingRate,
    chromiumVersion: sample.chromiumVersion,
    buildMode: sample.buildMode,
    repCount: measuredReps.length,
    frameIntervalsMs: summarizeRepMetric(measuredReps, (rep) => rep.frameIntervalsMs),
    eventDurationsMs: summarizeRepMetric(measuredReps, (rep) => rep.eventDurationsMs),
    longTaskCount: { median: median(measuredReps.map((rep) => rep.longTaskCount)) },
    wallClockMs: { median: median(measuredReps.map((rep) => rep.wallClockMs)) },
    moveEventCount: { median: median(measuredReps.map((rep) => rep.moveEventCount)) },
    renderedCellCount: { median: median(measuredReps.map((rep) => rep.renderedCellCount)) },
    metricsDeltaPerMoveEvent: normalizePerRep(measuredReps, (rep) => rep.moveEventCount),
    metricsDeltaPer1000Cells: normalizePerRep(measuredReps, (rep) => rep.renderedCellCount / 1000),
  }
}

interface RatioSums {
  taskDurationSum: number
  wallClockSum: number
  sawTaskDuration: boolean
}

function sumTaskDurationAndWallClock(samples: RawScenarioSample[]): RatioSums {
  const allReps = samples.flatMap((sample) => sample.reps)
  const wallClockSum = allReps.reduce((sum, rep) => sum + rep.wallClockMs, 0)
  const taskDurations = allReps
    .map((rep) => rep.metricsDelta.TaskDuration)
    .filter((value): value is number => value !== undefined)
  const taskDurationSum = taskDurations.reduce((sum, value) => sum + value, 0)
  return { taskDurationSum, wallClockSum, sawTaskDuration: taskDurations.length > 0 }
}

// A sanity signal, not a conversion: CDP's Performance.getMetrics reports
// TaskDuration as a float whose unit this codebase is not asserting from
// memory. Computed from raw sums across every rep of every sample (including
// rep 0 -- this is about unit-correctness, not about the discard policy the
// rest of this module applies to warm-ups) so it's one headline ratio in the
// run header; if the ratio ever reads ~1000x off from 1, that's the sign a
// unit assumption was wrong, not something for this function to "fix".
// `undefined` (never NaN) when no rep recorded a TaskDuration key at all.
export function taskDurationToWallClockRatio(samples: RawScenarioSample[]): number | undefined {
  const { taskDurationSum, wallClockSum, sawTaskDuration } = sumTaskDurationAndWallClock(samples)
  if (!sawTaskDuration || wallClockSum === 0) return undefined
  return taskDurationSum / wallClockSum
}
