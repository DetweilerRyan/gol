import { act } from '@testing-library/react'
import { vi, type Mock } from 'vitest'

// Shared jsdom stubs for the three browser APIs this app touches that jsdom
// either doesn't implement at all (ResizeObserver, pointer capture) or
// implements as a useless constant (getBoundingClientRect, an all-zero rect).
// Kept in one place because the hooks that own each API (useElementSize,
// useWheelInput) and the components that compose them (Grid, Scrollbar) each
// need the same stub, and three hand-rolled copies drift.

class ResizeObserverStub {
  callback: ResizeObserverCallback
  observed: Element[] = []
  disconnectCount = 0

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element): void {
    this.observed.push(target)
  }
  unobserve(): void {}
  disconnect(): void {
    this.disconnectCount++
  }
}

export interface ResizeObserverController {
  instances: ResizeObserverStub[]
  latest(): ResizeObserverStub
  // Pushes a controlled contentRect through the observer callback, exactly
  // the way a real observation would deliver one.
  resize(width: number, height: number): void
}

export function stubResizeObserver(): ResizeObserverController {
  const instances: ResizeObserverStub[] = []

  vi.stubGlobal(
    'ResizeObserver',
    class extends ResizeObserverStub {
      constructor(callback: ResizeObserverCallback) {
        super(callback)
        instances.push(this)
      }
    },
  )

  function latest(): ResizeObserverStub {
    const instance = instances.at(-1)
    if (!instance) throw new Error('ResizeObserver was never constructed -- render first')
    return instance
  }

  return {
    instances,
    latest,
    resize(width: number, height: number) {
      const instance = latest()
      act(() => {
        instance.callback(
          [{ contentRect: { width, height } } as unknown as ResizeObserverEntry],
          instance as unknown as ResizeObserver,
        )
      })
    },
  }
}

// Typed to the exact Element.prototype.getBoundingClientRect signature
// (`(): DOMRect`) rather than a bare vi.fn(): a loosely-typed spy assigned to
// a prototype method can pass `npm run test:unit` while still failing
// `npm run build`, since vitest doesn't typecheck.
export function stubBoundingClientRect(rect: {
  left: number
  top: number
  width: number
  height: number
}): Mock<() => DOMRect> {
  const domRect: DOMRect = {
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON() {
      return this
    },
  }
  const stub = vi.fn<() => DOMRect>(() => domRect)
  Element.prototype.getBoundingClientRect = stub
  return stub
}

export interface AnimationFrameController {
  // Advances the stubbed performance.now() clock by the given amount and
  // then runs every frame callback scheduled so far, in the order they were
  // scheduled -- mirroring a real rAF batch, where every callback in a frame
  // sees the same timestamp.
  advance(ms: number): void
  pendingCount(): number
  cancelCallCount(): number
  now(): number
}

// requestAnimationFrame/cancelAnimationFrame plus a controllable
// performance.now(), so a test can step a glide frame-by-frame and assert on
// intermediate values instead of only the settled end state. Distinct from
// useRafCoalescedPan.test.ts's own local stubRaf (which this module now
// replaces the caller of, see that file's history) in the one respect that
// matters here: that stub's runFrame() always calls back with 0, with no
// notion of elapsed time, which useZoomGlide.ts's easing needs.
export function stubAnimationFrames(): AnimationFrameController {
  let nextId = 1
  let nowMs = 0
  const pending = new Map<number, FrameRequestCallback>()
  let cancelCallCount = 0

  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      const id = nextId++
      pending.set(id, cb)
      return id
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      cancelCallCount++
      pending.delete(id)
    }),
  )
  vi.stubGlobal('performance', { ...performance, now: () => nowMs })

  return {
    advance(ms: number) {
      nowMs += ms
      const callbacks = [...pending.values()]
      pending.clear()
      for (const cb of callbacks) cb(nowMs)
    },
    pendingCount: () => pending.size,
    cancelCallCount: () => cancelCallCount,
    now: () => nowMs,
  }
}

// window.matchMedia is undefined in this repo's jsdom project (unlike
// requestAnimationFrame/performance.now, which jsdom does implement) -- see
// useReducedMotion.ts's own comment on why that means no defensive
// typeof-guard belongs in product code. `matches` is fixed for the stub's
// lifetime; useReducedMotion.test.ts drives a change by firing a `change`
// event on the returned MediaQueryList instead, the same way a real one
// would notify a listener.
export interface MatchMediaController {
  changeTo(nextMatches: boolean): void
  listenerCount(): number
  // CALL counts, deliberately alongside listenerCount()'s NET count rather
  // than replacing it: the two answer different questions and only these can
  // see a resubscribe. A useSyncExternalStore resubscribe is a
  // removeEventListener immediately followed by an addEventListener, so it
  // leaves listenerCount() at 1 throughout and is invisible to it -- which is
  // exactly the churn useMatchMedia.test.ts's identity-stability pair exists
  // to pin. Counts never decrease; they count calls, not listeners, and
  // deliberately count them across every event type rather than per type --
  // listenerCount('change') above is what covers registering under the wrong
  // type, and splitting these by type too would only make an assertion about
  // resubscribe count read as one about type correctness.
  addCallCount(): number
  removeCallCount(): number
}

export function stubMatchMedia(matches: boolean): MatchMediaController {
  let currentMatches = matches
  // Keyed by event type, mirroring a real MediaQueryList rather than
  // trusting every caller to pass 'change' -- addEventListener/
  // removeEventListener on the wrong type is otherwise unobservable, since a
  // single untyped Set would add or remove a listener regardless of what
  // type string it was registered under.
  const listenersByType = new Map<string, Set<(event: { matches: boolean }) => void>>()
  let addCalls = 0
  let removeCalls = 0

  function listenersFor(type: string): Set<(event: { matches: boolean }) => void> {
    let forType = listenersByType.get(type)
    if (forType === undefined) {
      forType = new Set()
      listenersByType.set(type, forType)
    }
    return forType
  }

  // addEventListener and removeEventListener are genuinely the same shape --
  // increment a call counter, then apply a Set operation for the given
  // type -- mirroring the real MediaQueryList pair rather than diverging by
  // accident. That shape is named once here instead of restated twice, but
  // each registration below still states its own counter and its own Set
  // method, so the mirroring stays visible at the call site rather than
  // being hidden inside a shared body.
  function countedListenerOp(
    increment: () => void,
    apply: (
      listeners: Set<(event: { matches: boolean }) => void>,
      listener: (event: { matches: boolean }) => void,
    ) => void,
  ) {
    return (type: string, listener: (event: { matches: boolean }) => void) => {
      increment()
      apply(listenersFor(type), listener)
    }
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      media: query,
      get matches() {
        return currentMatches
      },
      addEventListener: countedListenerOp(
        () => addCalls++,
        (listeners, listener) => listeners.add(listener),
      ),
      removeEventListener: countedListenerOp(
        () => removeCalls++,
        (listeners, listener) => listeners.delete(listener),
      ),
    })),
  )

  return {
    changeTo(nextMatches: boolean) {
      currentMatches = nextMatches
      act(() => {
        for (const listener of listenersFor('change')) listener({ matches: nextMatches })
      })
    },
    listenerCount: () => listenersFor('change').size,
    addCallCount: () => addCalls,
    removeCallCount: () => removeCalls,
  }
}

export interface PointerCaptureStubs {
  setPointerCapture: Mock<(pointerId: number) => void>
  hasPointerCapture: Mock<(pointerId: number) => boolean>
  releasePointerCapture: Mock<(pointerId: number) => void>
}

// hasPointerCapture defaults to true, matching the state a real element is in
// between setPointerCapture and release; tests that need the "capture was
// already lost" path override it with mockReturnValue(false).
export function stubPointerCapture(): PointerCaptureStubs {
  const stubs: PointerCaptureStubs = {
    setPointerCapture: vi.fn<(pointerId: number) => void>(),
    hasPointerCapture: vi.fn<(pointerId: number) => boolean>(() => true),
    releasePointerCapture: vi.fn<(pointerId: number) => void>(),
  }
  Element.prototype.setPointerCapture = stubs.setPointerCapture
  Element.prototype.hasPointerCapture = stubs.hasPointerCapture
  Element.prototype.releasePointerCapture = stubs.releasePointerCapture
  return stubs
}
