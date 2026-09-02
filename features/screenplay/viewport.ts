// SCREENPLAY: the fixed facts about the viewport this suite runs against.
// Imports nothing -- it is the base of the layering, and everything else in
// features/screenplay/ sits above it.
//
// DEFAULT_OFFSET_X/Y are module-exported here but deliberately NOT re-exported
// by features/e2e-helpers.ts. They were file-private before the split and
// tasks.ts's panCellIntoView is their only reader; widening a module's surface
// to a named sibling is behaviour-preserving, where widening the barrel's
// 41-name surface would be a change to what this layer publishes.

// The application's own boot camera -- centeredCamera(1280, 900) in
// src/camera.ts -- under playwright.config.ts's fixed 1280x900 viewport.
// CENTER and every pixel-math assertion in this suite is derived from these
// three numbers, so they are declared once here rather than re-literaled at
// each call site.
export const DEFAULT_CELL_SIZE_PX = 20
export const DEFAULT_OFFSET_X = -32
export const DEFAULT_OFFSET_Y = -22.5

// World (0,0) renders at screen (640, 450) -- the exact viewport center.
export const CENTER = { x: -DEFAULT_OFFSET_X * DEFAULT_CELL_SIZE_PX, y: -DEFAULT_OFFSET_Y * DEFAULT_CELL_SIZE_PX }

// The viewport playwright.config.ts fixes this suite to. Declared here beside
// the camera it pairs with, because every "is that cell on screen" question is
// a relation between the two and neither half means anything alone.
export const VIEWPORT_WIDTH_PX = 1280
export const VIEWPORT_HEIGHT_PX = 900

// Where panCellIntoView leaves the cell it was asked for: clear of the HUD
// panel (top-left), the zoom toolbar (top-right) and the two 10px scrollbar
// strips (right and bottom edges). Moved here from tasks.ts so the pixel a
// panned cell can be CLICKED at is derived from the same constant that put it
// there, rather than being restated at the call site.
export const PAN_TARGET_PX = { x: 200, y: 200 }

// COORDINATE -> PIXEL, WHICH IS THE ONLY SAFE DIRECTION. Where a world cell's
// top-left corner sits on screen under the default camera -- worldToScreen,
// restated from this suite's own constants rather than imported from src/.
//
// The inverse direction is the banned one: resolving a pixel back to an
// element through document.elementFromPoint is a hit-test that disagrees with
// how this app actually resolves a click (see questions.ts's elementAtPoint),
// and it produced the false positive the retired hit-test investigation was
// built on. Everything in this suite that needs to reach a cell computes its
// pixel from its coordinate, never the reverse.
export function defaultViewCellPx(x: number, y: number): { x: number; y: number } {
  return { x: (x - DEFAULT_OFFSET_X) * DEFAULT_CELL_SIZE_PX, y: (y - DEFAULT_OFFSET_Y) * DEFAULT_CELL_SIZE_PX }
}

// The pixel a click aimed at a world cell should land on: its center, so the
// click is a half-cell clear of all four boundaries and cannot be turned into
// a neighbour's by a sub-pixel rounding difference.
export function defaultViewCellCenterPx(x: number, y: number): { x: number; y: number } {
  const corner = defaultViewCellPx(x, y)
  return { x: corner.x + DEFAULT_CELL_SIZE_PX / 2, y: corner.y + DEFAULT_CELL_SIZE_PX / 2 }
}

// WHETHER A CELL IS WHOLLY ON SCREEN UNDER THE DEFAULT CAMERA -- the
// pan-or-not decision withCellInView used to take by asking whether the cell
// had a DOM element.
//
// THE PRECONDITION IS THE CAMERA, AND IT CANNOT BE CHECKED FROM HERE. This is
// a pure function of two coordinates; it cannot see where the camera actually
// is, so a caller that invokes it after panning gets a confident wrong answer.
// Every current caller is entered with the camera at its default, and the
// three that pan (panCellIntoView's two wrappers, and grid-scrollbars' panned
// Given) all seed their cells before panning or reset afterwards.
//
// It is deliberately STRICTER than the element-count guard it replaces, which
// answered "is it mounted" -- true across computeVisibleRange's two-cell
// buffer and the tile range's eviction hysteresis, i.e. for cells that have an
// element but no visible pixel. Panning a cell that was already reachable
// costs a pan and a reset; clicking a pixel outside the viewport does not work
// at all, so erring toward the pan is the safe direction.
export function isCellInDefaultView(x: number, y: number): boolean {
  const { x: leftPx, y: topPx } = defaultViewCellPx(x, y)
  return (
    leftPx >= 0 &&
    topPx >= 0 &&
    leftPx + DEFAULT_CELL_SIZE_PX <= VIEWPORT_WIDTH_PX &&
    topPx + DEFAULT_CELL_SIZE_PX <= VIEWPORT_HEIGHT_PX
  )
}
