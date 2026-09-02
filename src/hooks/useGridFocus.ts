import { useLayoutEffect, useRef, useState } from 'react'
import { centeredCamera, type Camera } from '../camera'
import { centerCell, jumpToRowEdge, panToRevealPx, stepFocus, type FocusCell, type FocusDirection } from '../gridFocus'
import { computeOnScreenRange } from '../gridGeometry'
import type { ElementSize } from './useElementSize'

export interface UseGridFocusResult {
  focus: FocusCell
  // Keyboard-driven moves: delegate to gridFocus.ts, then both (a) request
  // real DOM focus follow the new cell and (b) pan the camera if the move
  // carried the cell off computeOnScreenRange -- see panToRevealPx.
  moveFocus: (direction: FocusDirection) => void
  jumpToEdge: (edge: 'left' | 'right') => void
  // Pointer-driven: a click only ever lands on an already-visible cell (it's
  // resolved from on-screen pixels), so this updates the roving-tabindex
  // target without requesting DOM focus or a reveal-pan -- see this hook's
  // own header comment for why forcing DOM focus here is deliberately out of
  // scope.
  setFocus: (x: number, y: number) => void
}

// Owns the keyboard focus cursor as local state, delegating every
// transition to gridFocus.ts (this slice's step 1). Thin adapter, per this
// repo's hook convention: the only logic that lives HERE rather than in that
// pure module is the two things that are genuinely React's job --
// synchronizing real DOM focus onto whichever cell is logically current, and
// the one-shot initial centering.
//
// WHY REAL DOM FOCUS NEEDS AN EXPLICIT NUDGE. Changing a button's `tabIndex`
// from 0 to -1 does NOT move real browser focus away from it -- the browser
// only consults tabIndex for sequential (Tab) navigation, not for whichever
// element already holds focus. So after an arrow-key move, without an
// imperative el.focus() call on the NEW cell, document.activeElement would
// still be the OLD one (now unreachable by Tab, but still literally
// focused), and Playwright's `:focus`-based questions (focusedCell,
// focusedCellAnnouncement) would keep reporting the stale coordinate. This
// is the standard WAI-ARIA APG roving-tabindex pattern: update tabindex,
// then move DOM focus programmatically.
//
// WHY THAT NUDGE MUST NOT FIRE ON EVERY RENDER. `pendingDomFocusRef` is the
// gate: only moveFocus/jumpToEdge (real keyboard navigation) set it, so the
// initial mount and the one-shot auto-centering below -- both of which also
// change `focus` -- never steal focus from wherever the page actually is.
// An effect keyed on `focus` alone, with no such gate, would call
// `.focus()` on the very first commit, before any user interaction.
//
// WHY THE DOM LOOKUP CAN SUCCEED IN THE SAME COMMIT AS A REVEAL-PAN. `onPan`
// and this hook's own setFocusState are both called synchronously from the
// same native keyboard event, so React 18 batches them into ONE commit; by
// the time this hook's layout effect runs, useCellTiles (Grid.tsx) has
// already resolved the new camera's tile range DURING that same render
// (its own setState-during-render pattern -- see useCellTiles.ts), so the
// target cell is already mounted. See gridFocus.ts's panToRevealPx for the
// sign convention this relies on (verified against camera.ts's panCamera in
// step 1).
export function useGridFocus(
  camera: Camera,
  size: ElementSize,
  onPan: (dxPixels: number, dyPixels: number) => void,
): UseGridFocusResult {
  const [focus, setFocusState] = useState<FocusCell>(() =>
    centerCell(computeOnScreenRange(camera, size.width, size.height)),
  )

  // Mirrors useInitialCentering's one-shot latch (Grid.tsx), independently:
  // recenters the focus cursor once real measurement arrives. Computed from
  // centeredCamera(width, height) directly -- the same pure function
  // useCamera's centerView calls -- rather than from the `camera` prop,
  // which will not reflect that recentering until a render this effect
  // cannot see yet (LifeBoard owns the camera state; a setState there
  // doesn't rewind this component's already-running effect flush). Both
  // sides independently derive the identical value from the same input, so
  // there is nothing here for the two to drift on.
  const hasCenteredRef = useRef(false)
  useLayoutEffect(() => {
    const { width, height } = size
    if (hasCenteredRef.current || width <= 0 || height <= 0) return
    hasCenteredRef.current = true
    const freshCamera = centeredCamera(width, height)
    setFocusState(centerCell(computeOnScreenRange(freshCamera, width, height)))
  }, [size])

  const pendingDomFocusRef = useRef<FocusCell | null>(null)
  useLayoutEffect(() => {
    const pending = pendingDomFocusRef.current
    if (!pending) return
    const el = document.querySelector<HTMLElement>(`[aria-label="Cell ${pending.x}, ${pending.y}"]`)
    if (el) {
      el.focus()
      pendingDomFocusRef.current = null
    }
  }, [focus])

  const onScreen = computeOnScreenRange(camera, size.width, size.height)

  function requestFocus(next: FocusCell) {
    setFocusState(next)
    pendingDomFocusRef.current = next
    const { dxPixels, dyPixels } = panToRevealPx(next, camera, onScreen)
    if (dxPixels !== 0 || dyPixels !== 0) onPan(dxPixels, dyPixels)
  }

  return {
    focus,
    moveFocus: (direction) => requestFocus(stepFocus(focus, direction)),
    jumpToEdge: (edge) => requestFocus(jumpToRowEdge(focus, edge, onScreen)),
    setFocus: (x, y) => setFocusState({ x, y }),
  }
}
