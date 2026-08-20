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
