import { useCallback, useState } from 'react'
import { type Camera, clampCellSize, DEFAULT_CELL_SIZE } from '../viewport'

export function useCamera() {
  const [camera, setCamera] = useState<Camera>({
    offsetX: 0,
    offsetY: 0,
    cellSize: DEFAULT_CELL_SIZE,
  })

  const panByPixels = useCallback((dxPixels: number, dyPixels: number) => {
    setCamera((prev) => ({
      ...prev,
      offsetX: prev.offsetX - dxPixels / prev.cellSize,
      offsetY: prev.offsetY - dyPixels / prev.cellSize,
    }))
  }, [])

  const zoomAtPoint = useCallback((pixelX: number, pixelY: number, factor: number) => {
    setCamera((prev) => {
      const newCellSize = clampCellSize(prev.cellSize * factor)
      if (newCellSize === prev.cellSize) return prev
      const worldX = prev.offsetX + pixelX / prev.cellSize
      const worldY = prev.offsetY + pixelY / prev.cellSize
      return {
        cellSize: newCellSize,
        offsetX: worldX - pixelX / newCellSize,
        offsetY: worldY - pixelY / newCellSize,
      }
    })
  }, [])

  const centerView = useCallback((viewportWidthPx: number, viewportHeightPx: number) => {
    setCamera({
      cellSize: DEFAULT_CELL_SIZE,
      offsetX: -viewportWidthPx / 2 / DEFAULT_CELL_SIZE,
      offsetY: -viewportHeightPx / 2 / DEFAULT_CELL_SIZE,
    })
  }, [])

  return { camera, panByPixels, zoomAtPoint, centerView }
}
