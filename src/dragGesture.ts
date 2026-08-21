// Pointer-drag gesture recognition: deciding when a press-and-move has become
// a pan rather than a click, and reporting how far to pan. Intentionally knows
// nothing about the Camera -- it deals only in client pixels, so the same
// click-vs-drag rule can be reasoned about (and tested) without a camera at
// all. useGridPointerGestures.ts (Grid.tsx's pointer-handling hook) is the
// consumer; its onPan callback ultimately feeds useCamera's panByPixels.

export const DRAG_THRESHOLD_PX = 4

// A pointer-drag gesture in progress, in client coordinates. `isPanning`
// latches: a gesture becomes a pan the first time the pointer travels further
// than DRAG_THRESHOLD_PX from where it went down, and stays a pan for the rest
// of its life even if the pointer comes back inside the threshold -- otherwise
// a drag that returned near its origin would fall back to being treated as a
// click on release.
export interface DragGesture {
  startX: number
  startY: number
  lastX: number
  lastY: number
  isPanning: boolean
}

export function beginDrag(clientX: number, clientY: number): DragGesture {
  return { startX: clientX, startY: clientY, lastX: clientX, lastY: clientY, isPanning: false }
}

export interface DragAdvance {
  gesture: DragGesture
  panDxPixels: number
  panDyPixels: number
}

// Advances a gesture to a new pointer position, reporting how far the camera
// should pan as a result: the delta since the *previous* position (not since
// the start of the gesture, since each move pans incrementally), and zero
// until the drag threshold is crossed so a click-in-progress never nudges the
// camera. The threshold comparison is strictly greater-than: a movement of
// exactly DRAG_THRESHOLD_PX is still a click.
export function advanceDrag(gesture: DragGesture, clientX: number, clientY: number): DragAdvance {
  const isPanning =
    gesture.isPanning || Math.hypot(clientX - gesture.startX, clientY - gesture.startY) > DRAG_THRESHOLD_PX
  return {
    gesture: { ...gesture, lastX: clientX, lastY: clientY, isPanning },
    panDxPixels: isPanning ? clientX - gesture.lastX : 0,
    panDyPixels: isPanning ? clientY - gesture.lastY : 0,
  }
}
