import { useEffect, useRef, useState } from 'react'
import type { Pattern } from '../patternLibrary'
import {
  armedPattern,
  armPattern,
  cancelPlacing,
  INITIAL_PLACEMENT,
  movePreviewTo,
  toggleLibrary,
  type PlacementState,
} from '../patternPlacement'

// Owns the pattern-library/placing state and its one keyboard input, and
// delegates every transition to the pure functions in patternPlacement.ts --
// the same split useCamera has with camera.ts. Takes the commit callback
// (rather than exposing a bare disarm() for a caller to pair with its own
// placement call) so the armed-pattern check and the disarm that follows it
// stay in one place: the caller can't stamp without disarming, and can't
// reach for a pattern that isn't armed.
export function usePatternPlacement(onPlacePattern: (pattern: Pattern, x: number, y: number) => void) {
  const [placement, setPlacement] = useState<PlacementState>(INITIAL_PLACEMENT)

  // Read via a ref, exactly as useZoomGlide.ts's onCameraRef/
  // prefersReducedMotionRef are: stampArmedPattern below needs the CURRENT
  // placement at call time (Escape may have cancelled it since the last
  // render -- see that function's own comment), not the placement value
  // closed over when it was created. Reading through a ref rather than
  // closing over the render-local `placement` is what lets React Compiler
  // memoize stampArmedPattern against nothing that varies per render, which
  // is what keeps it identity-stable while a pattern is being aimed --
  // measured (architect's stable-hook-identities DESIGN pass): pre-fix,
  // arming a pattern and moving the pointer re-rendered every mounted Cell
  // on every move, because stampArmedPattern's churn flowed into Grid's
  // activateCell and from there into GridCells' onActivateCell prop. See
  // LifeBoard.test.tsx's "armed hover does not re-render mounted cells".
  //
  // Written in a dependency-array-free effect, never during render (React
  // Compiler forbids reading OR writing a ref's .current at render time --
  // see useRafCoalescedPan.ts's own comment on this trap), so the ref never
  // lags a render by more than one effect flush.
  const placementRef = useRef(placement)
  useEffect(() => {
    placementRef.current = placement
  })

  // Escape only ever disarms a placing pattern here: while the library modal
  // is open, Escape is handled by the modal's own onClose, and cancelPlacing
  // returns the state unchanged in every other mode, so this listener can be
  // registered once rather than re-registered per state change.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setPlacement(cancelPlacing)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Single-shot: stamping commits the armed pattern and disarms in the same
  // action, rather than leaving it armed for repeat stamps. Reading the armed
  // pattern here (instead of taking one from the caller) is what makes the
  // non-null pattern a type-checked fact at the commit point rather than an
  // invariant asserted across a component boundary; nothing is committed when
  // nothing is armed.
  function stampArmedPattern(x: number, y: number) {
    const pattern = armedPattern(placementRef.current)
    if (!pattern) return
    onPlacePattern(pattern, x, y)
    setPlacement(cancelPlacing)
  }

  return {
    placement,
    openOrCancelLibrary: () => setPlacement(toggleLibrary),
    closeLibrary: () => setPlacement(INITIAL_PLACEMENT),
    selectPattern: (pattern: Pattern) => setPlacement(armPattern(pattern)),
    previewAt: (x: number, y: number) => setPlacement((prev) => movePreviewTo(prev, x, y)),
    stampArmedPattern,
  }
}
