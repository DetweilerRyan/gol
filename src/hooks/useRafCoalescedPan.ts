import { useEffect, useRef } from 'react'

export interface CoalescedPan {
  push(dxPixels: number, dyPixels: number): void
  flush(): void
}

// Coalesces however many pan deltas arrive within a single animation frame
// into one onPan call carrying their sum, so a trackpad or a high-polling-
// rate mouse delivering several pointermove events per frame triggers one
// camera update instead of several. A once-per-frame mouse-pan cadence sees
// no benefit (there's at most one pointermove per frame to coalesce either
// way -- perf/gestures.ts awaits a requestAnimationFrame round-trip between
// synthetic moves), so this doesn't move the gated ScriptDuration numbers;
// it's for trackpad users, not the benchmark.
//
// The invariant this exists to preserve: accumulate (dx, dy) in a ref and
// flush the *sum*, so the net camera shift equals the requested delta
// regardless of how many push() calls arrived or when flush() runs --
// e2e/e2e-helpers.ts's dragPan comment documents that property and several
// specs depend on it. flush() is exposed separately (rather than only ever
// running on the animation-frame callback) so a caller can force it
// synchronously on pointerup/pointercancel/unmount, keeping an assertion
// immediately after the drag ends reading a settled camera rather than one
// still waiting on a queued frame.
export function useRafCoalescedPan(onPan: (dxPixels: number, dyPixels: number) => void): CoalescedPan {
  const accumulatedRef = useRef({ dx: 0, dy: 0 })
  const rafIdRef = useRef<number | null>(null)
  // Read via a ref rather than closing over the `onPan` param directly, so a
  // caller passing a new function identity each render (as Grid does, since
  // it's an inline closure) doesn't require push/flush to be recreated for
  // the frame callback scheduled by an earlier render to call the latest
  // onPan.
  const onPanRef = useRef(onPan)
  // Assigned in an effect, not directly in the render body: React Compiler
  // forbids reading *or writing* a ref's `.current` during render (refs
  // aren't render inputs), so the update has to happen post-commit. No
  // dependency array -- it must run after every render, not just when onPan
  // itself changes identity, so the ref never lags a render behind.
  useEffect(() => {
    onPanRef.current = onPan
  })

  function flush() {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    const { dx, dy } = accumulatedRef.current
    if (dx === 0 && dy === 0) return
    accumulatedRef.current = { dx: 0, dy: 0 }
    onPanRef.current(dx, dy)
  }

  function push(dxPixels: number, dyPixels: number) {
    accumulatedRef.current = {
      dx: accumulatedRef.current.dx + dxPixels,
      dy: accumulatedRef.current.dy + dyPixels,
    }
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        flush()
      })
    }
  }

  // Unmount is the third flush point the module header promises (alongside
  // pointerup/pointercancel, which the caller drives via the returned
  // flush()) -- a pan mid-frame when the surface unmounts must not silently
  // drop its already-accumulated delta. Empty deps deliberately: the cleanup
  // reads accumulatedRef/rafIdRef/onPanRef, all refs, so it always sees the
  // latest state regardless of which render's closure runs it -- no
  // dependency array entry would ever change what this needs to do.
  useEffect(() => {
    return () => {
      flush()
    }
  }, [])

  return { push, flush }
}
