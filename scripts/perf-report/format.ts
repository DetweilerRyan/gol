// Shapes stats.ts's per-scenario numbers plus environment.ts's run facts
// into the three things run.ts writes: reports/perf/latest.json (full
// structured run), reports/perf/latest.md (the human table, also echoed to
// stdout), and one reports/perf/history.jsonl line per run. Pure/no I/O, so
// the rendering itself is unit-tested without touching the filesystem --
// run.ts owns reading reports/perf/raw/ and writing these strings out.

import type { RunEnvironment } from './environment.ts'
import { aggregate, taskDurationToWallClockRatio, type ScenarioStats } from './stats.ts'
import type { RawScenarioSample } from './raw-sample.ts'

export interface RunHeader {
  environment: RunEnvironment
  chromiumVersions: string[]
  buildModes: string[]
  taskDurationToWallClockRatio: number | undefined
  sampleCount: number
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
  }
}

function compareScenarios(a: ScenarioStats, b: ScenarioStats): number {
  return a.scenario === b.scenario ? a.project.localeCompare(b.project) : a.scenario.localeCompare(b.scenario)
}

export function buildLatestReport(environment: RunEnvironment, samples: RawScenarioSample[]): LatestReport {
  return {
    header: buildRunHeader(environment, samples),
    scenarios: samples.map(aggregate).sort(compareScenarios),
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
    // See stats.ts's taskDurationToWallClockRatio: a raw sanity ratio, never
    // used to rescale anything -- if it reads ~1000x off from what a rep's
    // own duration should be relative to its wall clock, that is a unit
    // assumption to go re-check, not something this report corrects for.
    `TaskDuration/wallClock ratio (raw, unit not asserted): ${formatRatio(header.taskDurationToWallClockRatio)}`,
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
    'Full metricsDelta breakdown (per-move-event and per-1000-cells): reports/perf/latest.json',
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
