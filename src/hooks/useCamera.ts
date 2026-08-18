import { useCallback, useState } from 'react'
import { applyWheelInput, centeredCamera, panCamera, zoomCameraAtPoint, DEFAULT_CELL_SIZE, type Camera, type WheelInput } from '../viewport'

export function useCamera() {
  const [camera, setCamera] = useState<Camera>({
    offsetX: 0,
    offsetY: 0,
    cellSize: DEFAULT_CELL_SIZE,
  })

  const panByPixels = useCallback((dxPixels: number, dyPixels: number) => {
    setCamera((prev) => panCamera(prev, dxPixels, dyPixels))
  }, [])

  const zoomAtPoint = useCallback((pixelX: number, pixelY: number, factor: number) => {
    setCamera((prev) => zoomCameraAtPoint(prev, pixelX, pixelY, factor))
  }, [])

  const applyWheel = useCallback((input: WheelInput) => {
    setCamera((prev) => applyWheelInput(prev, input))
  }, [])

  const centerView = useCallback((viewportWidthPx: number, viewportHeightPx: number) => {
    setCamera(centeredCamera(viewportWidthPx, viewportHeightPx))
  }, [])

  return { camera, panByPixels, zoomAtPoint, applyWheel, centerView }
}
