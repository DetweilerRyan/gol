export interface Camera {
  offsetX: number
  offsetY: number
  cellSize: number
}

export const MIN_CELL_SIZE = 8
export const MAX_CELL_SIZE = 60
export const DEFAULT_CELL_SIZE = 20 // matches the previous 1.25rem cell size
export const ZOOM_FACTOR = 1.25

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

export const MAJOR_GRIDLINE_INTERVAL = 10

export function isMajorGridline(coordinate: number): boolean {
  return coordinate % MAJOR_GRIDLINE_INTERVAL === 0
}

export interface MajorGridlines {
  x: number[]
  y: number[]
}

function gridlinesInRange(min: number, max: number): number[] {
  // `Math.ceil` of a small negative fraction (e.g. -2 / 10) yields -0, not 0.
  // `|| 0` normalizes that back to a plain 0 without affecting any other value.
  const start = Math.ceil(min / MAJOR_GRIDLINE_INTERVAL) * MAJOR_GRIDLINE_INTERVAL || 0
  const lines: number[] = []
  for (let line = start; line <= max; line += MAJOR_GRIDLINE_INTERVAL) {
    lines.push(line)
  }
  return lines
}

export function computeMajorGridlines(range: VisibleRange): MajorGridlines {
  return {
    x: gridlinesInRange(range.minX, range.maxX),
    y: gridlinesInRange(range.minY, range.maxY),
  }
}

export interface WheelInput {
  pixelX: number
  pixelY: number
  deltaX: number
  deltaY: number
  shiftKey: boolean
}

export function applyWheelInput(camera: Camera, input: WheelInput): Camera {
  if (input.shiftKey) {
    // Some browser/OS combos (notably Firefox on Windows) convert a
    // vertical wheel gesture into a horizontal-scroll event under Shift,
    // zeroing deltaY and populating deltaX instead, before JS sees it. We
    // key zoom-intent off shiftKey (which we control), then recover the
    // scroll magnitude from whichever axis the browser actually populated.
    const zoomDelta = input.deltaY !== 0 ? input.deltaY : input.deltaX
    const factor = zoomDelta < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
    return zoomCameraAtPoint(camera, input.pixelX, input.pixelY, factor)
  }
  // Wheel-pan follows the "document scroll" convention (scroll down reveals
  // lower content, content slides up) -- the opposite feel from drag-to-pan
  // (panByPixels(dx, dy), no negation), where content follows the pointer
  // 1:1. To make scroll-down (deltaY > 0) increase offsetY given
  // panCamera's `offsetY -= dyPixels / cellSize`, the pixel delta passed in
  // must be negated. This asymmetry with drag-to-pan is intentional.
  return panCamera(camera, -input.deltaX, -input.deltaY)
}

export function zoomPercentage(camera: Camera): number {
  return Math.round((camera.cellSize / DEFAULT_CELL_SIZE) * 100)
}
