import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { rectRelativePixels } from '../camera'
import { advanceDrag, beginDrag, type DragGesture } from '../dragGesture'

// The grid's pointer-drag gesture, adapted to the DOM: capture, drag-vs-tap
// resolution, and the isPanning cursor flag. Reports rect-relative pixels
// only -- it never imports Camera or screenToWorld, mirroring why
// dragGesture.ts (which this hook wraps) stands alone. Callers resolve
// pixels to world cells themselves, in onTap/onHover.
export interface GridPointerGestureCallbacks {
  // Whether onHover should actually be computed and called on pointermove.
  // Kept as a plain boolean input (rather than the hook inferring it) since
  // it mirrors a condition the caller already evaluates for other reasons
  // (see the trackHover prop's own comment at the call site).
  trackHover: boolean
  onPan: (dxPixels: number, dyPixels: number) => void
  // Called at the start of both handlePointerUp and handlePointerCancel,
  // before anything else in either handler runs -- the hook has no opinion
  // on why a caller needs this (useRafCoalescedPan's flush is the current
  // reason: a pan mid-frame at release must settle synchronously rather than
  // waiting on a queued animation frame), only that the drag is ending.
  onPanEnd: () => void
  onTap: (pixelX: number, pixelY: number) => void
  // Fires on a plain hover move -- pointer down or not, but never once a
  // drag has crossed the pan threshold (see handlePointerMove). This is the
  // FULL hover contract: the caller uses it to drive both the hover
  // indicator and the armed-pattern preview.
  onHover: (pixelX: number, pixelY: number) => void
  // Fires on EVERY pointermove once a drag IS panning (including the exact
  // move that crosses the threshold), reporting the SAME rect-relative pixel
  // shape onHover does, from the rect cached at pointerdown rather than a
  // fresh getBoundingClientRect() call -- see handlePointerMove's own
  // comment for why that's safe and why this is a separate callback from
  // onHover rather than onHover with an extra flag: a caller must not treat
  // this as "the pointer is hovering" and must not drive a placement
  // preview from it (collapse-dead-cell-layer's hover/click-agreement
  // corrective is explicit that preview-during-pan stays out of scope). Its
  // only sanctioned use is keeping a LAST-KNOWN pointer position current for
  // later re-resolution once the camera itself updates -- see Grid.tsx's own
  // comment at its call site.
  onPointerPosition: (pixelX: number, pixelY: number) => void
}

export interface GridPointerGestures {
  isPanning: boolean
  handlers: {
    onPointerDown: (e: ReactPointerEvent) => void
    onPointerMove: (e: ReactPointerEvent) => void
    onPointerUp: (e: ReactPointerEvent) => void
    onPointerCancel: (e: ReactPointerEvent) => void
  }
}

export function useGridPointerGestures({
  trackHover,
  onPan,
  onPanEnd,
  onTap,
  onHover,
  onPointerPosition,
}: GridPointerGestureCallbacks): GridPointerGestures {
  const dragStateRef = useRef<DragGesture | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  // The container's own rect, cached once per gesture at pointerdown rather
  // than re-read via getBoundingClientRect() on every pointermove of a pan
  // in flight -- #grid-content cannot move while pointer capture holds it
  // (see handlePointerDown), so the rect taken there is exact for the whole
  // gesture. This is what lets handlePointerMove keep the pointer position
  // current DURING a pan (onPointerPosition, below) without adding a
  // synchronous layout read to the highest-frequency event in the app --
  // the same cost handlePointerMove's own onHover branch already guards
  // against for the non-panning case.
  const containerRectRef = useRef<{ left: number; top: number } | null>(null)

  function pointerPixels(e: ReactPointerEvent) {
    return rectRelativePixels(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY)
  }

  function handlePointerDown(e: ReactPointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = beginDrag(e.clientX, e.clientY)
    containerRectRef.current = e.currentTarget.getBoundingClientRect()
  }

  function handlePointerMove(e: ReactPointerEvent) {
    // advanceDrag runs FIRST, before either hover branch below, so both
    // branches see the POST-advance isPanning -- including on the exact
    // move that crosses the drag threshold this call. Checking pre-advance
    // state here was the corrective's own root cause: the crossing move
    // would take the "plain hover" branch below (correct only for the
    // instant before the pan it itself triggers lands), and no later event
    // ever re-resolved it once the camera actually moved -- see
    // Grid.tsx's camera-change effect for the other half of that fix.
    const drag = dragStateRef.current
    if (drag) {
      const advance = advanceDrag(drag, e.clientX, e.clientY)
      dragStateRef.current = advance.gesture
      // Guarded rather than panning by advanceDrag's zeroed deltas, so a
      // sub-threshold move doesn't re-render on a camera that didn't move.
      if (advance.gesture.isPanning) {
        onPan(advance.panDxPixels, advance.panDyPixels)
        setIsPanning(true)
      }
    }

    if (!trackHover) return

    if (dragStateRef.current?.isPanning) {
      // Mid-drag (including the crossing move above): keep the pointer
      // position current via the CACHED rect, never a fresh
      // getBoundingClientRect() call -- and never onHover, since a pan in
      // flight is not "hovering" a cell and must not drive
      // onPreviewCell (see this callback's own doc comment).
      if (containerRectRef.current) {
        const { pixelX, pixelY } = rectRelativePixels(containerRectRef.current, e.clientX, e.clientY)
        onPointerPosition(pixelX, pixelY)
      }
    } else {
      // Plain hover, or a sub-threshold drag that has not become a pan yet.
      const { pixelX, pixelY } = pointerPixels(e)
      onHover(pixelX, pixelY)
    }
  }

  // Pointer capture on the container retargets the subsequent native "click"
  // event to the container too, so per-button onClick never fires for
  // pointer-driven interaction -- onTap resolves the toggle/place from
  // pointerup coordinates instead. Button onClick still handles keyboard
  // activation (Enter/Space), which never goes through pointer capture (see
  // the mirror of this comment on the cell button in GridCells/Grid).
  function handlePointerUp(e: ReactPointerEvent) {
    onPanEnd()
    releaseCapture(e)
    // Optional chaining, not a plain property read: a pointerup can arrive
    // with no drag state primed (no preceding pointerdown on this element --
    // e.g. the pointer went down elsewhere), and that still resolves as a tap
    // rather than throwing.
    if (!dragStateRef.current?.isPanning) {
      const { pixelX, pixelY } = pointerPixels(e)
      onTap(pixelX, pixelY)
    }
    dragStateRef.current = null
    containerRectRef.current = null
    setIsPanning(false)
  }

  function handlePointerCancel(e: ReactPointerEvent) {
    onPanEnd()
    releaseCapture(e)
    dragStateRef.current = null
    containerRectRef.current = null
    setIsPanning(false)
  }

  function releaseCapture(e: ReactPointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return {
    isPanning,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  }
}
