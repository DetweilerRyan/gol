export interface Camera {
  offsetX: number
  offsetY: number
  cellSize: number
}

export const MIN_CELL_SIZE = 8
export const MAX_CELL_SIZE = 60
export const DEFAULT_CELL_SIZE = 20 // matches the previous 1.25rem cell size

const VISIBLE_BUFFER_CELLS = 2

export function clampCellSize(size: number): number {
  return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, size))
}

export function worldToScreen(camera: Camera, worldX: number, worldY: number) {
  return {
    x: (worldX - camera.offsetX) * camera.cellSize,
    y: (worldY - camera.offsetY) * camera.cellSize,
  }
}

export function screenToWorld(camera: Camera, pixelX: number, pixelY: number) {
  return {
    x: Math.floor(camera.offsetX + pixelX / camera.cellSize),
    y: Math.floor(camera.offsetY + pixelY / camera.cellSize),
  }
}

export interface VisibleRange {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function computeVisibleRange(camera: Camera, viewportWidthPx: number, viewportHeightPx: number): VisibleRange {
  return {
    minX: Math.floor(camera.offsetX) - VISIBLE_BUFFER_CELLS,
    maxX: Math.ceil(camera.offsetX + viewportWidthPx / camera.cellSize) + VISIBLE_BUFFER_CELLS,
    minY: Math.floor(camera.offsetY) - VISIBLE_BUFFER_CELLS,
    maxY: Math.ceil(camera.offsetY + viewportHeightPx / camera.cellSize) + VISIBLE_BUFFER_CELLS,
  }
}

export function panCamera(camera: Camera, dxPixels: number, dyPixels: number): Camera {
  return {
    ...camera,
    offsetX: camera.offsetX - dxPixels / camera.cellSize,
    offsetY: camera.offsetY - dyPixels / camera.cellSize,
  }
}

export function zoomCameraAtPoint(camera: Camera, pixelX: number, pixelY: number, factor: number): Camera {
  const newCellSize = clampCellSize(camera.cellSize * factor)
  if (newCellSize === camera.cellSize) return camera

  const worldX = camera.offsetX + pixelX / camera.cellSize
  const worldY = camera.offsetY + pixelY / camera.cellSize
  return {
    cellSize: newCellSize,
    offsetX: worldX - pixelX / newCellSize,
    offsetY: worldY - pixelY / newCellSize,
  }
}

export function centeredCamera(viewportWidthPx: number, viewportHeightPx: number): Camera {
  return {
    cellSize: DEFAULT_CELL_SIZE,
    offsetX: -viewportWidthPx / 2 / DEFAULT_CELL_SIZE,
    offsetY: -viewportHeightPx / 2 / DEFAULT_CELL_SIZE,
  }
}
