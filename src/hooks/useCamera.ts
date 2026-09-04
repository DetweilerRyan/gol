import { useEffect, useRef, useState } from 'react'
import {
  applyWheelInput,
  centeredCamera,
  panCamera,
  zoomCameraAtPoint,
  DEFAULT_CELL_SIZE,
  ZOOM_FACTOR,
  type Camera,
  type WheelInput,
} from '../camera'
import { panCameraByScrollbarDrag, type ScrollbarAxis } from '../scrollbars'
import { useZoomGlide } from './useZoomGlide'

export function useCamera() {
  const [camera, setCamera] = useState<Camera>({
    offsetX: 0,
    offsetY: 0,
    cellSize: DEFAULT_CELL_SIZE,
  })

  // The glide's own tick writes straight to setCamera -- no cancel here,
  // since cancelling on every one of its own frames would make it cancel
  // itself. See useZoomGlide.ts's header comment for the rAF lifecycle.
  const glide = useZoomGlide(setCamera)

  // Read via a ref, exactly as useZoomGlide.ts's own onCameraRef/
  // prefersReducedMotionRef are: zoomInCentered/zoomOutCentered below need
  // the CURRENT camera at click time, not the camera value closed over when
  // the function was created. Reading through a ref rather than closing
  // over the render-local `camera` is what lets React Compiler memoize both
  // functions against nothing that varies per render, which is what keeps
  // them identity-stable across a pan -- measured (architect's
  // stable-hook-identities DESIGN pass, superseding
  // zoom-glide-regressed-the-pan-path's ruling that this churn was
  // unavoidable): pre-fix, these were the only two of useCamera's seven
  // returned actions that churned identity on every camera change. See
  // useCamera.test.ts's "returned action identity" describe.
  //
  // Written in a dependency-array-free effect, never during render (React
  // Compiler forbids reading OR writing a ref's .current at render time --
  // see useRafCoalescedPan.ts's own comment on this trap), so the ref never
  // lags a render by more than one effect flush -- and every zoomInCentered/
  // zoomOutCentered call site in this app is itself a discrete event
  // (a toolbar click) separated from the previous one by at least one
  // commit, so the flush has always already happened by the time either
  // function next reads it.
  const cameraRef = useRef(camera)
  useEffect(() => {
    cameraRef.current = camera
  })

  // EVERY camera write that is NOT the glide's own tick goes through this.
  // architect verified (CONTRACT review) that these five functions --
  // panByPixels, zoomAtPoint, applyWheel, centerView, panByScrollbarDrag --
  // are the entire remaining set of production camera writers, so this is
  // the one and only place an in-flight toolbar glide needs to be cancelled:
  // a drag-pan, a wheel zoom, a scrollbar drag, or a reset that ran while a
  // glide was still ticking would otherwise either get silently overwritten
  // by the glide's next frame, or leave the glide recomputing from a
  // fromCamera the user has since moved away from.
  function commit(update: (prev: Camera) => Camera) {
    glide.cancel()
    setCamera(update)
  }

  function panByPixels(dxPixels: number, dyPixels: number) {
    commit((prev) => panCamera(prev, dxPixels, dyPixels))
  }

  // PRODUCTION-DEAD SINCE smooth-zoom-transitions, AND KEPT ON PURPOSE -- do
  // not delete it as an unused export. The toolbar was its only caller and
  // zoomInCentered/zoomOutCentered took that over when zooming started to
  // glide; LifeBoard has never destructured it, so today only
  // useCamera.test.ts calls it.
  //
  // It stays because the FIVE-ROW CANCEL TABLE in that test file is the only
  // thing holding the commit() invariant, and the table is documentation as
  // much as it is a test: this is its generic member, the one a future
  // non-animated zoom writer (pinch, zoom-to-selection, double-click-to-zoom)
  // would be modelled on, and a four-row table with the generic row missing
  // is a weaker prompt to route the new writer through commit() rather than
  // straight to setCamera. Against that, keeping it costs three lines and
  // three passing tests whose mutants are all killed. Removing it becomes
  // right the day either something else needs a non-animated zoom-at-a-pixel
  // (then it has a caller again) or the commit() funnel gains a mechanical
  // guard that does not rely on the table.
  function zoomAtPoint(pixelX: number, pixelY: number, factor: number) {
    commit((prev) => zoomCameraAtPoint(prev, pixelX, pixelY, factor))
  }

  function applyWheel(input: WheelInput) {
    commit((prev) => applyWheelInput(prev, input))
  }

  function centerView(viewportWidthPx: number, viewportHeightPx: number) {
    commit(() => centeredCamera(viewportWidthPx, viewportHeightPx))
  }

  // The only two camera writers that GLIDE rather than snap -- see
  // useZoomGlide.ts. Symmetric with centerView: zoom about the viewport's
  // own center point, so callers (the toolbar's zoom buttons) don't need to
  // know the camera's pixel-space zoom-at-point convention, only their own
  // measured size. Deliberately call glide.zoomBy directly rather than going
  // through zoomAtPoint/commit -- commit would cancel the very glide these
  // two exist to drive. Read cameraRef.current rather than the render-local
  // `camera` -- see the ref's own comment above for why.
  function zoomInCentered(viewportWidthPx: number, viewportHeightPx: number) {
    glide.zoomBy(cameraRef.current, ZOOM_FACTOR, viewportWidthPx / 2, viewportHeightPx / 2)
  }

  function zoomOutCentered(viewportWidthPx: number, viewportHeightPx: number) {
    glide.zoomBy(cameraRef.current, 1 / ZOOM_FACTOR, viewportWidthPx / 2, viewportHeightPx / 2)
  }

  function panByScrollbarDrag(axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number) {
    commit((prev) => panCameraByScrollbarDrag(prev, axis, deltaTrackPx, thumbRatio))
  }

  return {
    camera,
    panByPixels,
    zoomAtPoint,
    applyWheel,
    centerView,
    zoomInCentered,
    zoomOutCentered,
    panByScrollbarDrag,
  }
}
