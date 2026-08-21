// Thin wrapper around one CDP session's Performance domain -- the headline
// signal for this harness, because Performance.getMetrics decomposes cost
// into named counters (ScriptDuration, RecalcStyleDuration, LayoutDuration,
// LayoutCount, Nodes, JSHeapUsedSize, TaskDuration, ...) rather than one
// opaque wall-clock number. snapshot()/diff() are split so a scenario can
// snapshot before a gesture, run it, snapshot after, and diff -- the
// subtraction itself is the only arithmetic this file does; every
// percentile/median computation on the results lives in
// scripts/perf-report/, per raw-sample.ts's header comment.
import type { Page } from '@playwright/test'

export interface MetricsSession {
  snapshot(): Promise<Record<string, number>>
  diff(before: Record<string, number>, after: Record<string, number>): Record<string, number>
  setCpuThrottling(rate: number): Promise<void>
  dispose(): Promise<void>
}

export async function startMetrics(page: Page): Promise<MetricsSession> {
  const client = await page.context().newCDPSession(page)
  // Performance.getMetrics returns nothing until this domain is explicitly
  // enabled on the session -- easy to omit and, like the addInitScript
  // pitfall in instrumentation.ts, fails silently (an empty metrics array,
  // not an error) rather than loudly.
  await client.send('Performance.enable')

  return {
    async snapshot() {
      const { metrics } = await client.send('Performance.getMetrics')
      const result: Record<string, number> = {}
      for (const metric of metrics) {
        if (Number.isFinite(metric.value)) {
          result[metric.name] = metric.value
        }
      }
      return result
    },
    // Only keys present (and finite) in both snapshots are diffed -- a
    // counter CDP didn't report in one of the two snapshots contributes
    // nothing rather than producing a diff against `undefined`, which
    // raw-sample.ts's isNumberRecord guard would otherwise reject as NaN.
    diff(before, after) {
      const result: Record<string, number> = {}
      for (const key of Object.keys(after)) {
        const beforeValue = before[key]
        if (beforeValue === undefined) continue
        const delta = after[key] - beforeValue
        if (Number.isFinite(delta)) {
          result[key] = delta
        }
      }
      return result
    },
    async setCpuThrottling(rate) {
      await client.send('Emulation.setCPUThrottlingRate', { rate })
    },
    async dispose() {
      await client.detach()
    },
  }
}
