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
import type { RawScenarioSample, RepSample } from './raw-sample.ts'

function rep(overrides: Partial<RepSample> = {}): RepSample {
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

function sample(overrides: Partial<RawScenarioSample> = {}): RawScenarioSample {
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
})
