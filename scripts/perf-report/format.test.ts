import { describe, expect, it } from 'vitest'
import {
  buildLatestReport,
  buildRunHeader,
  formatHistoryLine,
  formatLatestJson,
  renderLatestMarkdown,
  renderNoSamplesMessage,
} from './format.ts'
import type { RunEnvironment } from './environment.ts'
import { rep, sample } from './test-support.ts'

const ENV: RunEnvironment = {
  gitSha: 'abc1234',
  cpuModel: 'Apple M2',
  cpuCoreCount: 8,
  nodeVersion: 'v24.0.0',
  timestampIso: '2026-08-21T12:00:00.000Z',
}

describe('buildRunHeader', () => {
  it('deduplicates and sorts chromiumVersions/buildModes across samples', () => {
    const header = buildRunHeader(ENV, [
      sample({ chromiumVersion: '141.0.0.0', buildMode: 'perf' }),
      sample({ chromiumVersion: '140.0.0.0', buildMode: 'perf' }),
      sample({ chromiumVersion: '140.0.0.0', buildMode: 'production' }),
    ])
    expect(header.chromiumVersions).toEqual(['140.0.0.0', '141.0.0.0'])
    expect(header.buildModes).toEqual(['perf', 'production'])
    expect(header.sampleCount).toBe(3)
  })

  it('carries the environment through unchanged', () => {
    const header = buildRunHeader(ENV, [sample()])
    expect(header.environment).toBe(ENV)
  })

  it('lists the metricsDelta keys that get converted CDP-seconds -> ms', () => {
    const header = buildRunHeader(ENV, [sample()])
    expect(header.metricsDeltaMsKeys).toContain('TaskDuration')
    expect(header.metricsDeltaMsKeys).toContain('ScriptDuration')
    expect(header.metricsDeltaMsKeys).not.toContain('JSHeapUsedSize')
    expect(header.metricsDeltaMsKeys).not.toContain('Nodes')
  })
})

describe('buildLatestReport', () => {
  it('sorts scenarios by scenario then project', () => {
    const report = buildLatestReport(ENV, [
      sample({ scenario: 'zoom', project: '1280x900' }),
      sample({ scenario: 'pan', project: '1920x1080' }),
      sample({ scenario: 'pan', project: '1280x900' }),
    ])
    expect(report.scenarios.map((s) => `${s.scenario}/${s.project}`)).toEqual([
      'pan/1280x900',
      'pan/1920x1080',
      'zoom/1280x900',
    ])
  })
})

describe('formatLatestJson', () => {
  it('round-trips through JSON.parse', () => {
    const report = buildLatestReport(ENV, [sample()])
    const parsed = JSON.parse(formatLatestJson(report))
    expect(parsed.header.sampleCount).toBe(1)
    expect(parsed.scenarios).toHaveLength(1)
  })
})

describe('renderNoSamplesMessage', () => {
  it('mentions no samples were found', () => {
    expect(renderNoSamplesMessage().toLowerCase()).toContain('no samples')
  })
})

describe('renderLatestMarkdown', () => {
  it('includes the git SHA, node version, and every scenario name', () => {
    const report = buildLatestReport(ENV, [
      sample({ scenario: 'pan-across-populated-grid' }),
      sample({ scenario: 'zoom' }),
    ])
    const md = renderLatestMarkdown(report)
    expect(md).toContain('abc1234')
    expect(md).toContain('v24.0.0')
    expect(md).toContain('pan-across-populated-grid')
    expect(md).toContain('zoom')
  })

  it('renders "n/a" for a metric summary with no data, not NaN or null literally embedded as a number', () => {
    const emptyEvents = rep({ eventDurationsMs: [] })
    const report = buildLatestReport(ENV, [sample({ reps: [emptyEvents, emptyEvents] })])
    const md = renderLatestMarkdown(report)
    expect(md).not.toContain('NaN')
    expect(md).toContain('n/a')
  })

  it('surfaces the TaskDuration/wallClock ratio, or its n/a fallback, in the header', () => {
    const noTaskDuration = rep({ metricsDelta: {} })
    const report = buildLatestReport(ENV, [sample({ reps: [noTaskDuration, noTaskDuration] })])
    expect(renderLatestMarkdown(report)).toContain('TaskDuration/wallClock ratio')
    expect(renderLatestMarkdown(report)).toContain('n/a (no TaskDuration samples)')
  })

  // run.ts never calls buildLatestReport with zero samples (it short-circuits
  // to renderNoSamplesMessage first -- see its own header comment), but
  // buildRunHeader/buildLatestReport are exported functions in their own
  // right and this fallback is real, documented behaviour of theirs, not
  // dead code -- so it's tested directly against the public API rather than
  // only through run.ts's guard.
  it('falls back to "n/a" for chromiumVersions/buildModes when given zero samples', () => {
    const report = buildLatestReport(ENV, [])
    const md = renderLatestMarkdown(report)
    expect(md).toContain('chromium n/a')
    expect(md).toContain('build mode n/a')
  })

  it('labels which metricsDelta keys were converted to ms, in the header', () => {
    const report = buildLatestReport(ENV, [sample()])
    const md = renderLatestMarkdown(report)
    expect(md).toContain('converted CDP-seconds -> ms')
    expect(md).toContain('TaskDuration')
  })

  it('converts a realistic CDP-seconds TaskDuration into a ratio near 1.0, not 0.001', () => {
    // A pan gesture that keeps the main thread essentially fully busy: CDP
    // reports TaskDuration in seconds (2.02), wallClockMs already in
    // milliseconds (2350) -- see units.ts. Left unconverted this ratio would
    // read ~0.00086 (seconds compared against milliseconds).
    const busyRep = rep({ metricsDelta: { TaskDuration: 2.02 }, wallClockMs: 2350 })
    const report = buildLatestReport(ENV, [sample({ reps: [busyRep, busyRep] })])
    expect(report.header.taskDurationToWallClockRatio).toBeGreaterThan(0.5)
    expect(report.header.taskDurationToWallClockRatio).toBeLessThan(1.5)
  })

  // A golden-master render of test-support's default fixture, exact byte for
  // byte -- the `.toContain` assertions above each check one fact in
  // isolation and can't tell "the table's column widths/padding/header text
  // are exactly right" from "close enough that a substring still matches."
  // For a renderer the exact output *is* the contract; re-generate this
  // string (buildLatestReport(ENV, [sample()]), then
  // console.log(JSON.stringify(renderLatestMarkdown(report)))) if a
  // deliberate formatting change makes it stale.
  it('renders the exact markdown for the default single-scenario fixture', () => {
    const report = buildLatestReport(ENV, [sample()])
    expect(renderLatestMarkdown(report)).toBe(
      'Perf report -- render-perf-harness\n' +
        'git abc1234  |  node v24.0.0  |  chromium 140.0.0.0\n' +
        'cpu Apple M2 (8 cores)  |  build mode perf\n' +
        'generated 2026-08-21T12:00:00.000Z  |  samples 1\n' +
        'metricsDelta keys converted CDP-seconds -> ms: DevToolsCommandDuration, LayoutDuration, ProcessTime, RecalcStyleDuration, ScriptDuration, TaskDuration, TaskOtherDuration, ThreadTime, V8CompileDuration\n' +
        'TaskDuration/wallClock ratio (ms/ms, expect ~1.0): 10.0000\n' +
        '\n' +
        'Scenario                   Project   CPU throttle  Reps  Frame Δ median  Frame Δ p95(max)  Event dur median  Event dur p95(max)  Long tasks (median)  Wall clock (median)  Node churn/move\n' +
        '-------------------------  --------  ------------  ----  --------------  ----------------  ----------------  ------------------  -------------------  -------------------  ---------------\n' +
        'pan-across-populated-grid  1280x900  1             2     17.00ms         17.90ms           n/a               n/a                 0                    1000.00ms            n/a            \n' +
        '\n' +
        'Full metricsDelta breakdown (per-move-event and per-1000-cells, ms for the keys listed above / raw counts+bytes for everything else): reports/perf/latest.json',
    )
  })

  // The column exists to make the tile-boundary wobble family's headline
  // number readable without opening latest.json, and to keep "not measured"
  // visibly different from "measured zero" for every other scenario.
  it('renders node churn per move-event for a scenario that measured it, and n/a for one that did not', () => {
    const measured = sample({ scenario: 'wobble', reps: [rep(), rep({ moveEventCount: 40, nodeChurnCount: 35840 })] })
    const unmeasured = sample({ scenario: 'pan' })
    const markdown = renderLatestMarkdown(buildLatestReport(ENV, [measured, unmeasured]))
    expect(markdown).toMatch(/^wobble\s.*\s896\.0\s*$/m)
    expect(markdown).toMatch(/^pan\s.*\sn\/a\s*$/m)
  })
})

describe('formatHistoryLine', () => {
  it('produces a single line of valid JSON summarising every scenario', () => {
    const report = buildLatestReport(ENV, [sample({ scenario: 'pan' }), sample({ scenario: 'zoom' })])
    const line = formatHistoryLine(report)
    expect(line).not.toContain('\n')
    const parsed = JSON.parse(line)
    expect(parsed.gitSha).toBe('abc1234')
    expect(parsed.scenarios).toHaveLength(2)
  })

  // Exact JSON, for the same reason renderLatestMarkdown gets a golden-master
  // test above: pins field names/order/values that a `.toContain` assertion
  // can't distinguish from a value that merely happens to also be present.
  it('produces the exact JSON for the default single-scenario fixture', () => {
    const report = buildLatestReport(ENV, [sample()])
    expect(formatHistoryLine(report)).toBe(
      '{"timestampIso":"2026-08-21T12:00:00.000Z","gitSha":"abc1234","scenarios":[{"scenario":"pan-across-populated-grid","project":"1280x900","frameIntervalsMsMedian":17,"eventDurationsMsMedian":null}]}',
    )
  })
})
