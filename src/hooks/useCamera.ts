import { useState } from 'react'
import {
  applyWheelInput,
  centeredCamera,
  panCamera,
  zoomCameraAtPoint,
  DEFAULT_CELL_SIZE,
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

  function panByScrollbarDrag(axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number) {
    setCamera((prev) => panCameraByScrollbarDrag(prev, axis, deltaTrackPx, thumbRatio))
  }

  return { camera, panByPixels, zoomAtPoint, applyWheel, centerView, panByScrollbarDrag }
}
