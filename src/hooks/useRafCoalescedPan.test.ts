import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRafCoalescedPan } from './useRafCoalescedPan'

// jsdom has no requestAnimationFrame scheduler a test can step deterministically,
// so this stub records scheduled callbacks and lets a test run them on demand
// instead of racing a real frame.
function stubRaf() {
  let nextId = 1
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

  return {
    pendingCount: () => pending.size,
    cancelCallCount: () => cancelCallCount,
    runFrame: () => {
      const callbacks = [...pending.values()]
      pending.clear()
      for (const cb of callbacks) cb(0)
    },
  }
}

let raf: ReturnType<typeof stubRaf>

beforeEach(() => {
  raf = stubRaf()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useRafCoalescedPan', () => {
  it('schedules exactly one frame across several push() calls before it fires', () => {
    const onPan = vi.fn()
    const { result } = renderHook(() => useRafCoalescedPan(onPan))

    result.current.push(3, 1)
    result.current.push(4, -2)
    expect(raf.pendingCount()).toBe(1)
    expect(onPan).not.toHaveBeenCalled()

    raf.runFrame()

    expect(onPan).toHaveBeenCalledTimes(1)
    expect(onPan).toHaveBeenCalledWith(7, -1)
  })

  it('starts a fresh frame after one has already flushed, so a later push is not lost', () => {
    const onPan = vi.fn()
    const { result } = renderHook(() => useRafCoalescedPan(onPan))

    result.current.push(1, 1)
    raf.runFrame()
    onPan.mockClear()

    result.current.push(2, 2)
    expect(raf.pendingCount()).toBe(1)
    raf.runFrame()

    expect(onPan).toHaveBeenCalledTimes(1)
    expect(onPan).toHaveBeenCalledWith(2, 2)
  })

  it('flush() reports the accumulated sum synchronously and cancels the pending frame', () => {
    const onPan = vi.fn()
    const { result } = renderHook(() => useRafCoalescedPan(onPan))

    result.current.push(5, -5)
    result.current.push(2, 0)
    result.current.flush()

    expect(onPan).toHaveBeenCalledTimes(1)
    expect(onPan).toHaveBeenCalledWith(7, -5)
    expect(raf.pendingCount()).toBe(0)

    // The frame that flush() cancelled must not fire a second, stale call.
    raf.runFrame()
    expect(onPan).toHaveBeenCalledTimes(1)
  })

  it('flush() with nothing accumulated is a no-op, and does not cancel a frame that was never scheduled', () => {
    const onPan = vi.fn()
    const { result } = renderHook(() => useRafCoalescedPan(onPan))

    result.current.flush()

    expect(onPan).not.toHaveBeenCalled()
    // No push() happened, so there's no pending frame to cancel -- flush()'s
    // own guard on rafIdRef.current must actually gate the
    // cancelAnimationFrame call rather than calling it unconditionally.
    expect(raf.cancelCallCount()).toBe(0)
  })

  it.each([
    { dx: 3, dy: 0, label: 'dx only' },
    { dx: 0, dy: 3, label: 'dy only' },
  ])('flushes when only one axis ($label) has accumulated a delta (not just when both have)', ({ dx, dy }) => {
    const onPan = vi.fn()
    const { result } = renderHook(() => useRafCoalescedPan(onPan))

    result.current.push(dx, dy)
    result.current.flush()

    expect(onPan).toHaveBeenCalledWith(dx, dy)
  })

  it('a push after flush() starts a new accumulation rather than reusing stale state', () => {
    const onPan = vi.fn()
    const { result } = renderHook(() => useRafCoalescedPan(onPan))

    result.current.push(10, 10)
    result.current.flush()
    onPan.mockClear()

    result.current.push(1, 1)
    result.current.flush()

    expect(onPan).toHaveBeenCalledTimes(1)
    expect(onPan).toHaveBeenCalledWith(1, 1)
  })

  it('flushes any pending accumulated delta synchronously on unmount', () => {
    const onPan = vi.fn()
    const { result, unmount } = renderHook(() => useRafCoalescedPan(onPan))

    result.current.push(3, 4)
    unmount()

    expect(onPan).toHaveBeenCalledTimes(1)
    expect(onPan).toHaveBeenCalledWith(3, 4)
  })

  it('unmount with nothing pending does not call onPan', () => {
    const onPan = vi.fn()
    const { unmount } = renderHook(() => useRafCoalescedPan(onPan))

    unmount()

    expect(onPan).not.toHaveBeenCalled()
  })

  it('a scheduled frame calls whichever onPan is current at flush time, not the one active when push() was called', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onPan }: { onPan: (dx: number, dy: number) => void }) => useRafCoalescedPan(onPan),
      {
        initialProps: { onPan: first },
      },
    )

    result.current.push(1, 1)
    rerender({ onPan: second })
    raf.runFrame()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(1, 1)
  })
})
