// The Screenplay layer's single entry point, and a sink rather than a source:
// features/screenplay/* is imported only from here and from its own siblings,
// never the other way round (rules/no-barrel-import-in-screenplay.yml). Keeping
// it is what leaves the step modules' three-import allowlist -- playwright-bdd,
// @playwright/test, and this file -- untouched by the decomposition.
//
// So a helper a step needs and cannot reach through here is ADDED TO THE
// screenplay/ MODULE THAT OWNS IT and re-exported below, never imported around
// and never written in this file. That is the surviving half of the divider
// comment this split deleted, corrected for the new shape: before the split
// "add it here" meant a function body in this file, and after it that would be
// the wrong fix.

export {
  CENTER,
  DEFAULT_CELL_SIZE_PX,
  VIEWPORT_WIDTH_PX,
  VIEWPORT_HEIGHT_PX,
  defaultViewCellPx,
  defaultViewCellCenterPx,
  isCellInDefaultView,
} from './screenplay/viewport.ts'
export { remember, recall, rememberText, recallText, ORIGIN_RULER_X, ORIGIN_RULER_Y } from './screenplay/notepad.ts'
export { cellLocator, patternsButton, patternLibraryModal, previewCells } from './screenplay/elements.ts'
export type { ScrollbarOrientation } from './screenplay/elements.ts'
export {
  zoomPercent,
  watchZoomReadout,
  zoomReadoutTrail,
  elementAtPoint,
  patternCategoryInLibrary,
  previewCellPositions,
  cellScreenPosition,
  cellState,
  aliveCellCount,
  generationCount,
  axisLabelValues,
  visibleProportionPercent,
  thumbPositionPercent,
  axisLabelPx,
  originRulerPx,
  originDisplacement,
  focusedCell,
  rovingCell,
  hoverIndicatorBox,
  focusedCellBox,
  focusedCellAnnouncement,
  viewportBox,
} from './screenplay/questions.ts'
export {
  nextGeneration,
  resetView,
  dragPan,
  blurFocus,
  shiftWheel,
  pinchWheel,
  waitForZoomToSettle,
  zoomIn,
  zoomOut,
  zoomInTwiceQuickly,
  preferReducedMotion,
  dragScrollbarThumb,
  openGrid,
  openPatternModal,
  choosePatternFromLibrary,
  moveFocus,
  pressKey,
  tabForward,
  tabAwayAndBack,
  clickGridAt,
  hoverGridAt,
} from './screenplay/interactions.ts'
export {
  selectPattern,
  zoomInThenResetView,
  toggleFarCell,
  withCellInView,
  clickCell,
  clickCells,
  parkKeyboardCursorAt,
  hoverCell,
  focusGridCell,
  focusEdgeCellInView,
} from './screenplay/tasks.ts'
export { expectCellState, expectBlinker } from './screenplay/expectations.ts'
