import { useState } from 'react'
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

export function useCamera() {
  const [camera, setCamera] = useState<Camera>({
    offsetX: 0,
    offsetY: 0,
    cellSize: DEFAULT_CELL_SIZE,
  })

  function panByPixels(dxPixels: number, dyPixels: number) {
    setCamera((prev) => panCamera(prev, dxPixels, dyPixels))
  }

  function zoomAtPoint(pixelX: number, pixelY: number, factor: number) {
    setCamera((prev) => zoomCameraAtPoint(prev, pixelX, pixelY, factor))
  }

  function applyWheel(input: WheelInput) {
    setCamera((prev) => applyWheelInput(prev, input))
  }

  function centerView(viewportWidthPx: number, viewportHeightPx: number) {
    setCamera(centeredCamera(viewportWidthPx, viewportHeightPx))
  }

  // Symmetric with centerView: zoom about the viewport's own center point,
  // so callers (the toolbar's zoom buttons) don't need to know the camera's
  // pixel-space zoom-at-point convention, only their own measured size.
  function zoomInCentered(viewportWidthPx: number, viewportHeightPx: number) {
    zoomAtPoint(viewportWidthPx / 2, viewportHeightPx / 2, ZOOM_FACTOR)
  }

  function zoomOutCentered(viewportWidthPx: number, viewportHeightPx: number) {
    zoomAtPoint(viewportWidthPx / 2, viewportHeightPx / 2, 1 / ZOOM_FACTOR)
  }

  function panByScrollbarDrag(axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number) {
    setCamera((prev) => panCameraByScrollbarDrag(prev, axis, deltaTrackPx, thumbRatio))
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
