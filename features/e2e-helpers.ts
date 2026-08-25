import { expect, type Page } from '@playwright/test'
import { CELL_ALIVE_ATTR, CELL_ALIVE_VALUE, CELL_DEAD_VALUE } from '../src/test-support/cellQuery.ts'

import { cellLocator } from './screenplay/elements.ts'
import { withCellInView } from './screenplay/tasks.ts'

export { CENTER, DEFAULT_CELL_SIZE_PX } from './screenplay/viewport.ts'
export { cellLocator, patternsButton, patternLibraryModal, previewCells, rulerGroup } from './screenplay/elements.ts'
export type { ScrollbarOrientation } from './screenplay/elements.ts'
export {
  zoomPercent,
  elementAtPoint,
  patternCategoryInLibrary,
  previewCellPositions,
  cellScreenPosition,
  cellState,
  aliveCellCount,
  generationCount,
  axisLabelValues,
  thumbTrackFraction,
  thumbPositionPercent,
} from './screenplay/questions.ts'
export {
  nextGeneration,
  resetView,
  dragPan,
  hoverCell,
  blurFocus,
  shiftWheel,
  zoomIn,
  zoomOut,
  dragScrollbarThumb,
  openGrid,
  openPatternModal,
  choosePatternFromLibrary,
} from './screenplay/interactions.ts'
export { selectPattern, toggleFarCell, withCellInView, clickCell } from './screenplay/tasks.ts'

// The one way this suite asserts aliveness. It reads aria-pressed -- the
// accessible state a screen reader announces -- and not the bg-gray-900 /
// bg-white paint, which is a styling decision a black-box layer has no
// business knowing (rules/no-aliveness-by-paint-class.yml). The visual half
// of that contract lives in src/components/Cell.test.tsx's 'Cell paint'
// block, so nothing is lost by asserting only the accessible half here.
//
// Note this is STRICTER than the toHaveClass(/bg-white/) it replaced:
// toHaveAttribute compares the whole value, where the class regex matched a
// substring of a long className. Returns the assertion's promise rather than
// awaiting it, so a caller that forgets to await gets an unhandled rejection
// rather than a silent pass.
export function expectCellState(page: Page, x: number, y: number, state: 'alive' | 'dead'): Promise<void> {
  return expect(cellLocator(page, x, y)).toHaveAttribute(
    CELL_ALIVE_ATTR,
    state === 'alive' ? CELL_ALIVE_VALUE : CELL_DEAD_VALUE,
  )
}

// ---------------------------------------------------------------------------
// Below this line: helpers added for the generated Playwright-BDD step modules
// under features/steps/. They are shared with the hand-written specs above --
// same layer, same rules -- but a step module's import allowlist is only
// playwright-bdd, @playwright/test and this file, so anything a step needs
// that it cannot reach through here has to be ADDED here rather than imported
// around.
// ---------------------------------------------------------------------------

// The five cells that describe a blinker's shape, wherever it is centered:
// its three live cells along the blinker's own axis, and the two neighbors
// along the OTHER axis that prove it hasn't smeared sideways. Shared by
// cell-life-and-death.ts (a remembered center) and infinite-grid.ts (a
// literal one) -- the step registry is global, so this is the one place the
// shape itself is stated rather than restated per caller.
export async function expectBlinker(
  page: Page,
  centerX: number,
  centerY: number,
  orientation: 'horizontal' | 'vertical',
): Promise<void> {
  const [ax, ay] = orientation === 'horizontal' ? ([1, 0] as const) : ([0, 1] as const)
  const [dx, dy] = orientation === 'horizontal' ? ([0, 1] as const) : ([1, 0] as const)
  await withCellInView(page, centerX, centerY, async () => {
    await expectCellState(page, centerX - ax, centerY - ay, 'alive')
    await expectCellState(page, centerX, centerY, 'alive')
    await expectCellState(page, centerX + ax, centerY + ay, 'alive')
    await expectCellState(page, centerX - dx, centerY - dy, 'dead')
    await expectCellState(page, centerX + dx, centerY + dy, 'dead')
  })
}

export { remember, recall, rememberText, recallText } from './screenplay/notepad.ts'
