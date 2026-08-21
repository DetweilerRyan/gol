import { useEffect, useState } from 'react'
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
    const pattern = armedPattern(placement)
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
