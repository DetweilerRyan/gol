// The camera and every operation that produces a new one: the world<->screen
// coordinate space, its zoom limits, and the pan/zoom/wheel transforms over
// it. Deliberately knows nothing about the game model, what's on screen, or
// how a gesture is recognized -- gridGeometry.ts, dragGesture.ts, and
// scrollbars.ts each build on this module, and none of them on each other.

export interface Camera {
  offsetX: number
  offsetY: number
  cellSize: number
}

export const MIN_CELL_SIZE = 8
export const MAX_CELL_SIZE = 60
export const DEFAULT_CELL_SIZE = 20 // matches the previous 1.25rem cell size
export const ZOOM_FACTOR = 1.25

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

// Client (window-relative) coordinates -> viewport pixels, i.e. pixels
// relative to the top-left of the element the camera is rendered into. Every
// pixel-taking function in this module and in scrollbars.ts expects that
// viewport-relative space, so this is the single translation point from a DOM
// event's clientX/clientY; the parameter is structurally typed rather than a
// DOMRect so this module stays free of DOM types.
export function rectRelativePixels(rect: { left: number; top: number }, clientX: number, clientY: number) {
  return { pixelX: clientX - rect.left, pixelY: clientY - rect.top }
}

export function panCamera(camera: Camera, dxPixels: number, dyPixels: number): Camera {
  return {
    ...camera,
    offsetX: camera.offsetX - dxPixels / camera.cellSize,
    offsetY: camera.offsetY - dyPixels / camera.cellSize,
  }
}

export function zoomCameraAtPoint(camera: Camera, pixelX: number, pixelY: number, factor: number): Camera {
  return zoomCameraToCellSize(camera, pixelX, pixelY, camera.cellSize * factor)
}

// The absolute-target twin of zoomCameraAtPoint: instead of a factor applied
// to the camera's own current cellSize, this takes the target cellSize
// directly. zoomCameraAtPoint is now expressed through this (factor * cellSize
// is the only difference), which is what smooth-zoom-transitions needs --
// a glide's per-frame camera is computed from a fixed starting camera and an
// eased cellSize, never by re-applying a factor to whatever the camera
// currently is (see src/hooks/useZoomGlide.ts's header comment on why).
export function zoomCameraToCellSize(camera: Camera, pixelX: number, pixelY: number, cellSize: number): Camera {
  const newCellSize = clampCellSize(cellSize)
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

export function zoomPercentage(camera: Camera): number {
  return Math.round((camera.cellSize / DEFAULT_CELL_SIZE) * 100)
}

// A wheel gesture reduced to plain numbers, so useWheelInput.ts can hand this
// module the parts of a native WheelEvent it needs without the DOM type
// crossing the boundary. useWheelInput.ts forwards deltaMode and ctrlKey
// verbatim rather than interpreting them -- normalizing a line/page delta
// into pixels in the hook would silently change what deltaX/deltaY mean with
// nothing in the type recording it, so that interpretation happens here.
export interface WheelInput {
  pixelX: number
  pixelY: number
  deltaX: number
  deltaY: number
  deltaMode: number
  shiftKey: boolean
  ctrlKey: boolean
}

// A wheel notch (WHEEL_ZOOM_NOTCH_PX of deltaMode-0 pixel delta) is exactly
// one ZOOM_FACTOR step, and everything in between maps continuously rather
// than snapping to the nearest notch -- otherwise a trackpad's sub-notch
// roll would still be discarded, which is the whole point of this mapping.
// The exponential form is what makes that continuous: factors compose by
// multiplication, so wheelZoomFactor(a) * wheelZoomFactor(b) equals
// wheelZoomFactor(a + b), and rolling a distance in two gestures lands on
// the same cellSize as rolling it in one.
const WHEEL_ZOOM_NOTCH_PX = 100

// deltaMode !== 0 (line- or page-mode) reports no pixel magnitude this repo
// can calibrate against -- browsers vary in what one line/page means in
// pixels, and there is no test here that can ever produce a nonzero
// deltaMode to calibrate against anyway. Rather than invent a conversion
// factor, a nonzero deltaMode collapses zoomDelta to its own sign (-1, 0, or
// 1) before reaching the same exponential, which for a nonzero delta always
// lands on exactly one ZOOM_FACTOR step regardless of magnitude.
function wheelZoomFactor(zoomDelta: number, deltaMode: number): number {
  const notches = deltaMode === 0 ? zoomDelta / WHEEL_ZOOM_NOTCH_PX : Math.sign(zoomDelta)
  return ZOOM_FACTOR ** -notches
}

export function applyWheelInput(camera: Camera, input: WheelInput): Camera {
  if (input.shiftKey || input.ctrlKey) {
    // Some browser/OS combos (notably Firefox on Windows) convert a
    // vertical wheel gesture into a horizontal-scroll event under Shift,
    // zeroing deltaY and populating deltaX instead, before JS sees it. We
    // key zoom-intent off shiftKey/ctrlKey (which we control), then recover
    // the scroll magnitude from whichever axis the browser actually
    // populated. ctrlKey is what every major browser sets on the wheel
    // event a trackpad pinch is delivered as -- the same event a mouse
    // user's Ctrl+scroll produces, which is why this can't and doesn't try
    // to tell the two apart.
    const zoomDelta = input.deltaY !== 0 ? input.deltaY : input.deltaX
    const factor = wheelZoomFactor(zoomDelta, input.deltaMode)
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
