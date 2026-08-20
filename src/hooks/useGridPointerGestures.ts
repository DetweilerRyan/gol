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
  onTap: (pixelX: number, pixelY: number) => void
  onHover: (pixelX: number, pixelY: number) => void
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
  onTap,
  onHover,
}: GridPointerGestureCallbacks): GridPointerGestures {
  const dragStateRef = useRef<DragGesture | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  function pointerPixels(e: ReactPointerEvent) {
    return rectRelativePixels(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY)
  }

  function handlePointerDown(e: ReactPointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = beginDrag(e.clientX, e.clientY)
  }

  function handlePointerMove(e: ReactPointerEvent) {
    // pointermove fires on hover too, not just while a button is pressed, so
    // onHover needs to run independent of drag state. Guarded on trackHover
    // even though onHover may be a no-op when the caller has nothing to do
    // with it, so an ordinary pan drag doesn't force a synchronous layout
    // (getBoundingClientRect) per move.
    if (trackHover) {
      const { pixelX, pixelY } = pointerPixels(e)
      onHover(pixelX, pixelY)
    }

    const drag = dragStateRef.current
    if (!drag) return

    const advance = advanceDrag(drag, e.clientX, e.clientY)
    dragStateRef.current = advance.gesture
    // Guarded rather than panning by advanceDrag's zeroed deltas, so a
    // sub-threshold move doesn't re-render on a camera that didn't move.
    if (advance.gesture.isPanning) {
      onPan(advance.panDxPixels, advance.panDyPixels)
      setIsPanning(true)
    }
  }

  // Pointer capture on the container retargets the subsequent native "click"
  // event to the container too, so per-button onClick never fires for
  // pointer-driven interaction -- onTap resolves the toggle/place from
  // pointerup coordinates instead. Button onClick still handles keyboard
  // activation (Enter/Space), which never goes through pointer capture (see
  // the mirror of this comment on the cell button in GridCells/Grid).
  function handlePointerUp(e: ReactPointerEvent) {
    releaseCapture(e)
    if (!dragStateRef.current?.isPanning) {
      const { pixelX, pixelY } = pointerPixels(e)
      onTap(pixelX, pixelY)
    }
    dragStateRef.current = null
    setIsPanning(false)
  }

  function handlePointerCancel(e: ReactPointerEvent) {
    releaseCapture(e)
    dragStateRef.current = null
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
