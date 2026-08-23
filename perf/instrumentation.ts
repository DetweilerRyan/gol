// Installed into the page via `page.addInitScript(installPerfInstrumentation, config)`.
//
// page.addInitScript(fn) serialises fn via Function.prototype.toString() and
// evaluates that source in a *fresh page realm* -- there is no module scope
// there. The function below may reference nothing from this file's top
// level (no imports, no closures over anything outside its own body, no
// constant declared elsewhere in this module): every value it needs arrives
// through the single structured-cloned `config` argument. Violating this
// throws a bare ReferenceError inside the page, which Playwright does not
// surface as a test failure -- the collector arrays just stay empty and the
// scenario reports a confident, silently-empty sample. Keep this file to
// exactly this one exported function (plus the plain data/type exports
// around it) for that reason; don't add a second helper that also gets
// passed to addInitScript.
//
// harness.ts's readSnapshot/startCollecting (shared by every
// perf/*.perf.spec.ts file) read the installed API back out via
// page.evaluate(() => window.__perfHarness.stop()/.start()) -- a *separate*
// evaluation in the page context, which is why PerfHarnessWindow below is a
// type import only, never a value used inside installPerfInstrumentation
// itself.

export interface PerfHarnessConfig {
  // Event Timing API's PerformanceObserver requires a >=16ms
  // durationThreshold; passed through explicitly rather than hardcoded so a
  // future scenario can choose to widen/narrow it without editing this file.
  eventDurationThresholdMs: number
  // load.perf.spec.ts's initial-load scenarios have no gesture to bracket
  // with an explicit start() call -- the thing being measured is page load
  // itself, and by the time a test's own page.evaluate(startCollecting) could
  // run, the page has already finished loading and the frames worth counting
  // are gone. addInitScript runs this function before any of the page's own
  // scripts, so starting the collector here -- synchronously, at install
  // time -- is the only way to capture rAF ticks from document creation
  // through first stable frame. Every other scenario leaves this unset and
  // calls start()/stop() explicitly around its own gesture instead.
  autoStart?: boolean
  // CSS selector for the subtree whose DOM node churn (nodes added +
  // nodes removed) should be counted while the collector is running.
  // Unset for every scenario that doesn't need it, deliberately: a
  // MutationObserver over ~18,000 cell buttons is itself script work, so
  // installing it unconditionally would perturb the very
  // ScriptDuration/RecalcStyleDuration numbers the other scenarios exist
  // to produce -- and would report a churn of 0 for scenarios that never
  // measured churn at all, which is a false zero rather than a
  // measurement. See PerfHarnessSnapshot.nodeChurnObserved below for the
  // other half of that: an unset selector and a selector that matched
  // nothing must stay distinguishable.
  nodeChurnSelector?: string
}

export interface PerfHarnessSnapshot {
  frameIntervalsMs: number[]
  eventDurationsMs: number[]
  longTaskCount: number
  // Total DOM nodes added plus DOM nodes removed under
  // PerfHarnessConfig.nodeChurnSelector since the last start(). Both
  // directions in one counter on purpose: a tile-boundary rebuild admits one
  // strip and evicts another in the same commit, and it is the pair that
  // costs, not either half.
  nodeChurnCount: number
  // Whether an observer was actually attached this run. Without it a
  // mistyped selector, or a start() that ran before the app rendered the
  // element, reports nodeChurnCount: 0 -- indistinguishable from a genuine
  // measurement of no churn, which is exactly the silent-empty-sample
  // failure this file's header warns about. Scenarios assert this rather
  // than persisting it: it is a fact about the harness run, not a
  // measurement, so it never reaches RepSample.
  nodeChurnObserved: boolean
}

// The shape this installs on `window` -- consumed via page.evaluate() calls
// elsewhere in perf/, never imported at runtime into the init-script
// function itself (see header comment).
export interface PerfHarnessWindow {
  __perfHarness: {
    start: () => void
    stop: () => PerfHarnessSnapshot
  }
}

export function installPerfInstrumentation(config: PerfHarnessConfig): void {
  const state = {
    running: false,
    frameTimestamps: [] as number[],
    eventDurations: [] as number[],
    longTaskCount: 0,
    nodeChurnCount: 0,
    nodeChurnObserved: false,
    rafHandle: 0,
  }

  function tick(timestamp: number): void {
    if (!state.running) return
    state.frameTimestamps.push(timestamp)
    state.rafHandle = requestAnimationFrame(tick)
  }

  const eventObserver = new PerformanceObserver((list) => {
    if (!state.running) return
    for (const entry of list.getEntries()) {
      state.eventDurations.push(entry.duration)
    }
  })
  eventObserver.observe({
    type: 'event',
    durationThreshold: config.eventDurationThresholdMs,
    buffered: false,
  } as PerformanceObserverInit)

  function countChurn(records: MutationRecord[]): void {
    for (const record of records) {
      state.nodeChurnCount += record.addedNodes.length + record.removedNodes.length
    }
  }

  // Attached in start(), not here: this whole function runs from
  // addInitScript, before any of the page's own scripts, so the element
  // nodeChurnSelector names does not exist yet.
  const churnObserver = new MutationObserver(countChurn)

  const longTaskObserver = new PerformanceObserver((list) => {
    if (!state.running) return
    state.longTaskCount += list.getEntries().length
  })
  longTaskObserver.observe({ type: 'longtask', buffered: false })

  const api: PerfHarnessWindow['__perfHarness'] = {
    start() {
      state.frameTimestamps = []
      state.eventDurations = []
      state.longTaskCount = 0
      state.nodeChurnCount = 0
      state.nodeChurnObserved = false
      if (config.nodeChurnSelector) {
        const target = document.querySelector(config.nodeChurnSelector)
        if (target) {
          churnObserver.observe(target, { childList: true, subtree: true })
          state.nodeChurnObserved = true
        }
      }
      state.running = true
      state.rafHandle = requestAnimationFrame(tick)
    },
    stop(): PerfHarnessSnapshot {
      state.running = false
      cancelAnimationFrame(state.rafHandle)
      // takeRecords() before disconnect(), never after: MutationObserver
      // callbacks are delivered on a microtask, so the records for the final
      // move's churn are still queued at this point and disconnecting first
      // would silently drop them.
      countChurn(churnObserver.takeRecords())
      churnObserver.disconnect()
      const frameIntervalsMs: number[] = []
      for (let i = 1; i < state.frameTimestamps.length; i++) {
        frameIntervalsMs.push(state.frameTimestamps[i] - state.frameTimestamps[i - 1])
      }
      return {
        frameIntervalsMs,
        eventDurationsMs: [...state.eventDurations],
        longTaskCount: state.longTaskCount,
        nodeChurnCount: state.nodeChurnCount,
        nodeChurnObserved: state.nodeChurnObserved,
      }
    },
  }
  Object.assign(window, { __perfHarness: api })
  if (config.autoStart) {
    api.start()
  }
}
