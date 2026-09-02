import type { Camera } from './camera'
import type { VisibleRange } from './gridGeometry'

// The keyboard focus-cursor model for keyboard-grid-navigation.feature: a
// single (x, y) world cell the keyboard currently rests on, and the pure
// transitions that move it. Deliberately imports only camera.ts and
// gridGeometry.ts, and is imported by neither liveCellWindow.ts nor
// cellTiles.ts -- the focus cursor and the live-cell mounting window are two
// independent projections of the same camera, not a produce/consume pair,
// and keeping them apart is what keeps src/'s module graph acyclic (see
// CLAUDE.md's Architecture section on the sixteen framework-free modules).

export type FocusDirection = 'left' | 'right' | 'up' | 'down'

export interface FocusCell {
  x: number
  y: number
}

// The cell nearest the center of `range`. `range` is expected to be a
// computeOnScreenRange result (the unbuffered, fully-visible range) --
// centering against the buffered computeVisibleRange would land the initial
// tab-in focus outside what a sighted user can actually see.
//
// (min + max + 1) / 2, floored, rather than the more obvious (min + max) / 2:
// for an EVEN cell count the plain average lands exactly on a half-integer
// boundary (e.g. minX=-32, maxX=31 -> -0.5), and Math.floor of that rounds
// DOWN to the lower cell (-1) rather than the intended center. Shifting by
// +1 before flooring breaks the tie toward the higher-numbered cell instead,
// which is what "Tabbing onto a freshly opened grid stops on the cell at the
// center of the default view" expects: (0, 0), not (-1, -1), at the default
// camera's exactly-symmetric 64-cell-wide range. The `|| 0` normalizes the
// -0 this arithmetic could in principle produce, matching this codebase's
// existing convention (see gridGeometry.ts's gridlinesInRange).
export function centerCell(range: VisibleRange): FocusCell {
  return {
    x: Math.floor((range.minX + range.maxX + 1) / 2) || 0,
    y: Math.floor((range.minY + range.maxY + 1) / 2) || 0,
  }
}

// One cell in `direction`. No bounds checking -- the grid is conceptually
// infinite (see gameOfLife.ts's own header), so a focus cell is never
// clamped, only panned into view by panToRevealPx below.
export function stepFocus(focus: FocusCell, direction: FocusDirection): FocusCell {
  switch (direction) {
    case 'left':
      return { x: focus.x - 1, y: focus.y }
    case 'right':
      return { x: focus.x + 1, y: focus.y }
    case 'up':
      return { x: focus.x, y: focus.y - 1 }
    case 'down':
      return { x: focus.x, y: focus.y + 1 }
  }
}

// Home/End: jump along the focus's own row to the furthest cell still fully
// on screen, per `onScreen` (a computeOnScreenRange result -- see that
// function's own comment for why this must be the unbuffered range and not
// computeVisibleRange).
export function jumpToRowEdge(focus: FocusCell, edge: 'left' | 'right', onScreen: VisibleRange): FocusCell {
  return { x: edge === 'left' ? onScreen.minX : onScreen.maxX, y: focus.y }
}

export interface PanReveal {
  dxPixels: number
  dyPixels: number
}

// The pixel pan a caller must apply, via useCamera's panByPixels, to bring
// `focus` back inside `onScreen` after a keyboard move has carried it past
// the edge. Returns {0, 0} on an axis that's already satisfied, so a caller
// can apply the result unconditionally after every focus move.
//
// SIGN CONVENTION -- checked against useCamera.ts's panByPixels, not derived
// from intuition (see CLAUDE.md's camera.ts note on the deliberate
// asymmetry between drag-to-pan and wheel-pan/scrollbar-drag). panByPixels
// calls camera.ts's panCamera(camera, dxPixels, dyPixels) UNCHANGED --
// no negation -- which computes `offsetX -= dxPixels / cellSize`. So to
// reach a target offsetX' = offsetX + shiftWorldX, the caller must pass
// dxPixels = -shiftWorldX * cellSize.
//
// When focus.x sits left of onScreen (focus.x < onScreen.minX), the desired
// shift is shiftWorldX = focus.x - onScreen.minX (negative -- the window
// moves left by exactly enough that focus.x becomes the new minX), giving
// dxPixels = (onScreen.minX - focus.x) * cellSize, which is POSITIVE. A
// positive dxPixels is the drag-to-pan "dragged right" direction, and
// panCamera's own comment says a positive dx there SUBTRACTS from offsetX
// (shifts the window left, sliding content right on screen) -- exactly what
// reveals a cell that has gone off the left edge. Symmetric reasoning for
// the right/top/bottom cases below. gridFocus.test.ts's
// 'panToRevealPx' block applies the returned pixels through camera.ts's own
// panCamera directly (not a mock) and asserts the resulting onScreen range
// actually contains focus, rather than trusting the sign derivation alone.
// EQUIVALENT MUTANTS, measured -- do not chase these four. Stryker reports
// `<` -> `<=` and `>` -> `>=` on each of the four comparisons below as
// Survived, and no test can kill them: the only input that distinguishes a
// strict from a non-strict comparison here is focus sitting exactly ON the
// edge, and there the mutated branch computes (onScreen.minX - focus.x) *
// cellSize = 0 * cellSize = 0 -- byte-identical to the 0 the unmutated code
// leaves in place by skipping the branch. The one input that could separate
// them is an INVERTED range (minX > maxX), where the mutant would take the
// first branch and the original the else-if; computeOnScreenRange never
// produces one, returning minX === maxX even for a 0x0 pre-measurement
// viewport (measured: {minX: -32, maxX: -32} at the default camera).
export function panToRevealPx(focus: FocusCell, camera: Camera, onScreen: VisibleRange): PanReveal {
  let dxPixels = 0
  let dyPixels = 0

  if (focus.x < onScreen.minX) {
    dxPixels = (onScreen.minX - focus.x) * camera.cellSize
  } else if (focus.x > onScreen.maxX) {
    dxPixels = (onScreen.maxX - focus.x) * camera.cellSize
  }

  if (focus.y < onScreen.minY) {
    dyPixels = (onScreen.minY - focus.y) * camera.cellSize
  } else if (focus.y > onScreen.maxY) {
    dyPixels = (onScreen.maxY - focus.y) * camera.cellSize
  }

  return { dxPixels, dyPixels }
}
