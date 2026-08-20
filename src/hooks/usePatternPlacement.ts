import { useEffect, useState } from 'react'
import type { Pattern } from '../patternLibrary'
import {
  armPattern,
  cancelPlacing,
  INITIAL_PLACEMENT,
  movePreviewTo,
  toggleLibrary,
  type PlacementState,
} from '../patternPlacement'

// Owns the pattern-library/placing state and its one keyboard input, and
// delegates every transition to the pure functions in patternPlacement.ts --
// the same split useCamera has with camera.ts.
export function usePatternPlacement() {
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

  return {
    placement,
    openOrCancelLibrary: () => setPlacement(toggleLibrary),
    closeLibrary: () => setPlacement(INITIAL_PLACEMENT),
    selectPattern: (pattern: Pattern) => setPlacement(armPattern(pattern)),
    previewAt: (x: number, y: number) => setPlacement((prev) => movePreviewTo(prev, x, y)),
    disarm: () => setPlacement(cancelPlacing),
  }
}
