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

export function computeVisibleRange(
  camera: Camera,
  viewportWidthPx: number,
  viewportHeightPx: number,
): VisibleRange {
  return {
    minX: Math.floor(camera.offsetX) - VISIBLE_BUFFER_CELLS,
    maxX: Math.ceil(camera.offsetX + viewportWidthPx / camera.cellSize) + VISIBLE_BUFFER_CELLS,
    minY: Math.floor(camera.offsetY) - VISIBLE_BUFFER_CELLS,
    maxY: Math.ceil(camera.offsetY + viewportHeightPx / camera.cellSize) + VISIBLE_BUFFER_CELLS,
  }
}
