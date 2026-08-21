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
// gestures.ts and pan.perf.spec.ts read the installed API back out via
// page.evaluate(() => window.__perfHarness.stop()) -- a *separate*
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
}

export interface PerfHarnessSnapshot {
  frameIntervalsMs: number[]
  eventDurationsMs: number[]
  longTaskCount: number
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
      state.running = true
      state.rafHandle = requestAnimationFrame(tick)
    },
    stop(): PerfHarnessSnapshot {
      state.running = false
      cancelAnimationFrame(state.rafHandle)
      const frameIntervalsMs: number[] = []
      for (let i = 1; i < state.frameTimestamps.length; i++) {
        frameIntervalsMs.push(state.frameTimestamps[i] - state.frameTimestamps[i - 1])
      }
      return {
        frameIntervalsMs,
        eventDurationsMs: [...state.eventDurations],
        longTaskCount: state.longTaskCount,
      }
    },
  }
  Object.assign(window, { __perfHarness: api })
  if (config.autoStart) {
    api.start()
  }
}
