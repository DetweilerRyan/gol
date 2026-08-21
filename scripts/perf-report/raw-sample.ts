// The contract between perf/ (Playwright, ungated, built in a later step of
// this slice) and this reporter (scripts/, fully covered by crap4ts/Stryker).
// perf/ writes one JSON file per scenario run under reports/perf/raw/; this
// module is the only place that trusts its shape. Validating on read is
// load-bearing, not defensive boilerplate: perf/ carries no type checking of
// its own output at the boundary, so a malformed sample is a live
// possibility, and the failure has to be loud here rather than surfacing
// three modules downstream as a report full of NaN/null.

// One measured repetition of a scenario. rAF deltas and PerformanceObserver
// event durations are recorded as raw arrays (not pre-aggregated) so this
// reporter -- not the ungated harness -- owns every percentile/median
// computation.
export interface RepSample {
  frameIntervalsMs: number[]
  eventDurationsMs: number[]
  longTaskCount: number
  moveEventCount: number
  renderedCellCount: number
  metricsDelta: Record<string, number>
  wallClockMs: number
}

// buildMode travels per-sample rather than being read from the environment
// at report time: nothing at report time can know what mode a given raw
// file was captured under, only the harness run that produced it.
export interface RawScenarioSample {
  scenario: string
  project: string
  url: string
  cpuThrottlingRate: number
  chromiumVersion: string
  buildMode: string
  reps: RepSample[]
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isFiniteNumber)
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

// Deliberately typeof + not-null + not-array, rather than delegating to a
// library: every value in the record must itself pass isFiniteNumber, which
// rejects NaN/Infinity the same way JSON.stringify would silently launder
// them into null downstream if this didn't catch it first.
function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every(isFiniteNumber)
  )
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${context}: expected an object, got ${describe(value)}`)
  }
  return value as Record<string, unknown>
}

function describe(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'an array'
  return typeof value
}

function requireField<T>(
  record: Record<string, unknown>,
  key: string,
  guard: (value: unknown) => value is T,
  context: string,
): T {
  const value = record[key]
  if (!guard(value)) {
    throw new Error(`${context}.${key}: invalid or missing (got ${describe(value)})`)
  }
  return value
}

function parseRepSample(value: unknown, context: string): RepSample {
  const rep = asRecord(value, context)
  return {
    frameIntervalsMs: requireField(rep, 'frameIntervalsMs', isNumberArray, context),
    eventDurationsMs: requireField(rep, 'eventDurationsMs', isNumberArray, context),
    longTaskCount: requireField(rep, 'longTaskCount', isFiniteNumber, context),
    moveEventCount: requireField(rep, 'moveEventCount', isFiniteNumber, context),
    renderedCellCount: requireField(rep, 'renderedCellCount', isFiniteNumber, context),
    metricsDelta: requireField(rep, 'metricsDelta', isNumberRecord, context),
    wallClockMs: requireField(rep, 'wallClockMs', isFiniteNumber, context),
  }
}

// Rep 0 is always the reporter's discarded warm-up (see stats.ts's
// aggregate), so a sample with fewer than 2 reps has zero usable
// measurements -- rejected here, at the boundary, rather than letting
// aggregate() discover it downstream as an empty-array edge case.
const MIN_REPS = 2

export function parseRawScenarioSample(value: unknown): RawScenarioSample {
  const sample = asRecord(value, 'raw scenario sample')
  const reps = requireField(sample, 'reps', isUnknownArray, 'raw scenario sample')
  if (reps.length < MIN_REPS) {
    throw new Error(
      `raw scenario sample.reps: expected at least ${MIN_REPS} entries (rep 0 is a discarded warm-up), got ${reps.length}`,
    )
  }

  return {
    scenario: requireField(sample, 'scenario', isNonEmptyString, 'raw scenario sample'),
    project: requireField(sample, 'project', isNonEmptyString, 'raw scenario sample'),
    url: requireField(sample, 'url', isNonEmptyString, 'raw scenario sample'),
    cpuThrottlingRate: requireField(sample, 'cpuThrottlingRate', isFiniteNumber, 'raw scenario sample'),
    chromiumVersion: requireField(sample, 'chromiumVersion', isNonEmptyString, 'raw scenario sample'),
    buildMode: requireField(sample, 'buildMode', isNonEmptyString, 'raw scenario sample'),
    reps: reps.map((rep, index) => parseRepSample(rep, `raw scenario sample.reps[${index}]`)),
  }
}
