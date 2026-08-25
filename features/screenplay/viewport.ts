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
