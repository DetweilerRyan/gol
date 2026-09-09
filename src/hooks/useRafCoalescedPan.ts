import { useEffect, useRef } from 'react'

export interface CoalescedPan {
  /**
   * Accumulates (`dxPixels`, `dyPixels`) and schedules one `onPan` flush per
   * animation frame, summing however many pushes arrive within it -- the net
   * camera shift equals the requested delta regardless of how many push()
   * calls arrived or when flush() runs.
   */
  push(dxPixels: number, dyPixels: number): void
  /**
   * Applies the accumulated sum immediately, rather than waiting for the
   * queued frame, and clears it -- call synchronously on
   * pointerup/pointercancel so an assertion right after a drag ends reads a
   * settled camera rather than one still waiting on a queued frame. A no-op
   * when nothing is accumulated.
   */
  flush(): void
}

/**
 * Coalesces however many pan deltas arrive within a single animation frame
 * into one onPan call carrying their sum, so a trackpad or a high-polling-
 * rate mouse delivering several pointermove events per frame triggers one
 * camera update instead of several.
 */
// A once-per-frame mouse-pan cadence sees no benefit (there's at most one
// pointermove per frame to coalesce either way -- perf/gestures.ts awaits a
// requestAnimationFrame round-trip between synthetic moves), so this
// doesn't move the gated ScriptDuration numbers; it's for trackpad users,
// not the benchmark. features/screenplay/interactions.ts's dragPan documents
// the matching invariant from the other side -- that the net camera shift
// equals the requested delta regardless of step count -- and several specs
// depend on it.
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
  //
  // A Stryker mutant replacing `[]` with a single-element array survives:
  // React compares deps by per-index Object.is, and a fresh same-valued
  // literal is Object.is-equal to itself across renders just like `[]` is,
  // so both schedule identically (mount/unmount only). Hand-verified
  // equivalent, not a coverage gap.
  useEffect(() => {
    return () => {
      flush()
    }
  }, [])

  return { push, flush }
}
