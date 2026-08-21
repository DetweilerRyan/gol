// Shapes stats.ts's per-scenario numbers plus environment.ts's run facts
// into the three things run.ts writes: reports/perf/latest.json (full
// structured run), reports/perf/latest.md (the human table, also echoed to
// stdout), and one reports/perf/history.jsonl line per run. Pure/no I/O, so
// the rendering itself is unit-tested without touching the filesystem --
// run.ts owns reading reports/perf/raw/ and writing these strings out.

import type { RunEnvironment } from './environment.ts'
import { aggregate, taskDurationToWallClockRatio, type ScenarioStats } from './stats.ts'
import type { RawScenarioSample } from './raw-sample.ts'
import { convertSampleMetricsToMs, DURATION_METRIC_KEYS } from './units.ts'

export interface RunHeader {
  environment: RunEnvironment
  chromiumVersions: string[]
  buildModes: string[]
  taskDurationToWallClockRatio: number | undefined
  sampleCount: number
  // The metricsDelta keys that units.ts converted CDP-seconds -> ms before
  // any scenario stat was computed -- every other key in a scenario's
  // metricsDeltaPerMoveEvent/metricsDeltaPer1000Cells (in latest.json) is a
  // raw CDP count or byte total, unconverted. Carried in the header (rather
  // than repeated per scenario) since the set is fixed for a whole run, and
  // read from units.ts's own list rather than duplicated here, so the two
  // can't drift apart.
  metricsDeltaMsKeys: string[]
}

export interface LatestReport {
  header: RunHeader
  scenarios: ScenarioStats[]
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort()
}

export function buildRunHeader(environment: RunEnvironment, samples: RawScenarioSample[]): RunHeader {
  return {
    environment,
    chromiumVersions: uniqueSorted(samples.map((sample) => sample.chromiumVersion)),
    buildModes: uniqueSorted(samples.map((sample) => sample.buildMode)),
    taskDurationToWallClockRatio: taskDurationToWallClockRatio(samples),
    sampleCount: samples.length,
    metricsDeltaMsKeys: [...DURATION_METRIC_KEYS].sort(),
  }
}

function compareScenarios(a: ScenarioStats, b: ScenarioStats): number {
  return a.scenario === b.scenario ? a.project.localeCompare(b.project) : a.scenario.localeCompare(b.scenario)
}

// The one call site for units.ts's conversion -- every sample stats.ts and
// buildRunHeader see from here on has already had its CDP-seconds duration
// keys converted to milliseconds; see units.ts's header comment for why
// report entry, not perf/ and not stats.ts, is where that has to happen.
export function buildLatestReport(environment: RunEnvironment, samples: RawScenarioSample[]): LatestReport {
  const msSamples = samples.map(convertSampleMetricsToMs)
  return {
    header: buildRunHeader(environment, msSamples),
    scenarios: msSamples.map(aggregate).sort(compareScenarios),
  }
}

export function formatLatestJson(report: LatestReport): string {
  return JSON.stringify(report, null, 2)
}

function formatMs(value: number): string {
  return `${value.toFixed(2)}ms`
}

function formatNullableMs(value: number | null): string {
  return value === null ? 'n/a' : formatMs(value)
}

const SCENARIO_HEADER = [
  'Scenario',
  'Project',
  'CPU throttle',
  'Reps',
  'Frame Δ median',
  'Frame Δ p95(max)',
  'Event dur median',
  'Event dur p95(max)',
  'Long tasks (median)',
  'Wall clock (median)',
]

function buildScenarioRow(stats: ScenarioStats): string[] {
  return [
    stats.scenario,
    stats.project,
    String(stats.cpuThrottlingRate),
    String(stats.repCount),
    formatNullableMs(stats.frameIntervalsMs.medianOfMedians),
    formatNullableMs(stats.frameIntervalsMs.maxOfP95s),
    formatNullableMs(stats.eventDurationsMs.medianOfMedians),
    formatNullableMs(stats.eventDurationsMs.maxOfP95s),
    String(stats.longTaskCount.median),
    formatMs(stats.wallClockMs.median),
  ]
}

function formatTable(header: string[], rows: string[][]): string {
  const widths = header.map((title, i) => Math.max(title.length, ...rows.map((row) => row[i].length)))
  const formatRow = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ')
  return [formatRow(header), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.map(formatRow)].join('\n')
}

function joinOrFallback(values: string[]): string {
  return values.length === 0 ? 'n/a' : values.join(', ')
}

function formatRatio(ratio: number | undefined): string {
  return ratio === undefined ? 'n/a (no TaskDuration samples)' : ratio.toFixed(4)
}

function formatRunHeaderLines(header: RunHeader): string[] {
  const env = header.environment
  return [
    'Perf report -- render-perf-harness',
    `git ${env.gitSha}  |  node ${env.nodeVersion}  |  chromium ${joinOrFallback(header.chromiumVersions)}`,
    `cpu ${env.cpuModel} (${env.cpuCoreCount} cores)  |  build mode ${joinOrFallback(header.buildModes)}`,
    `generated ${env.timestampIso}  |  samples ${header.sampleCount}`,
    // units.ts converts these metricsDelta keys from CDP's native seconds to
    // milliseconds before any stat below is computed; every other
    // metricsDelta key (LayoutCount, Nodes, JSHeapUsedSize, ...) is a raw
    // CDP count or byte total, left unscaled.
    `metricsDelta keys converted CDP-seconds -> ms: ${joinOrFallback(header.metricsDeltaMsKeys)}`,
    // See units.ts's header comment: this ratio is what surfaced the
    // seconds-vs-ms bug in the first place (it read ~0.0009 before the
    // fix -- TaskDuration in seconds compared against a wallClockMs in
    // milliseconds). It now sits near 1.0, since a pan gesture keeps the
    // main thread essentially fully busy -- and stays here as a standing
    // tripwire, not just a one-time fix: if a future CDP behavior change
    // moves it back toward 0.001, that is a unit assumption to go re-check,
    // not something this report should silently correct for.
    `TaskDuration/wallClock ratio (ms/ms, expect ~1.0): ${formatRatio(header.taskDurationToWallClockRatio)}`,
  ]
}

export function renderNoSamplesMessage(): string {
  return 'No samples found under reports/perf/raw/ -- nothing to report.'
}

export function renderLatestMarkdown(report: LatestReport): string {
  const rows = report.scenarios.map(buildScenarioRow)
  return [
    ...formatRunHeaderLines(report.header),
    '',
    formatTable(SCENARIO_HEADER, rows),
    '',
    'Full metricsDelta breakdown (per-move-event and per-1000-cells, ms for the keys listed above / raw counts+bytes for everything else): reports/perf/latest.json',
  ].join('\n')
}

export interface HistoryEntry {
  timestampIso: string
  gitSha: string
  scenarios: Array<{
    scenario: string
    project: string
    frameIntervalsMsMedian: number | null
    eventDurationsMsMedian: number | null
  }>
}

function buildHistoryEntry(report: LatestReport): HistoryEntry {
  return {
    timestampIso: report.header.environment.timestampIso,
    gitSha: report.header.environment.gitSha,
    scenarios: report.scenarios.map((stats) => ({
      scenario: stats.scenario,
      project: stats.project,
      frameIntervalsMsMedian: stats.frameIntervalsMs.medianOfMedians,
      eventDurationsMsMedian: stats.eventDurationsMs.medianOfMedians,
    })),
  }
}

export function formatHistoryLine(report: LatestReport): string {
  return JSON.stringify(buildHistoryEntry(report))
}
