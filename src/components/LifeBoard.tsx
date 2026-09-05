import type { AppearancePreference } from '../appearance'
import { zoomPercentage } from '../camera'
import { computeMajorGridlines } from '../gridGeometry'
import { useCamera } from '../hooks/useCamera'
import { usePatternPlacement } from '../hooks/usePatternPlacement'
import type { LiveCellStore } from '../liveCellStore'
import { armedPattern, isLibraryOpen, previewPositions } from '../patternPlacement'
import Grid, { GRID_CONTENT_ID, type GridOverlayContext } from './Grid'
import GridRuler from './GridRuler'
import GridScrollbars from './GridScrollbars'
import GridToolbar from './GridToolbar'
import PatternLibraryModal from './PatternLibraryModal'

interface LifeBoardProps {
  store: LiveCellStore
  // Owned by App.tsx's single useAppearance() call and forwarded here
  // unchanged -- see that hook's own comment on why there is exactly one
  // call site. LifeBoard makes no decision about either value; it only
  // hands them down to the one overlay that renders the control.
  appearancePreference: AppearancePreference
  onAppearanceChange: (preference: AppearancePreference) => void
}

// The composition root: owns the camera and placement state, derives what
// Grid's overlay slot needs, and supplies the overlays themselves. Grid owns
// the measurement and the pointer-handled DOM; this component owns
// everything above it. Kept wiring-only -- rules/no-logic-in-composition-root.yml
// enforces that mechanically -- so any branching/arithmetic/string-building
// belongs in a hook or pure module instead.
export default function LifeBoard({ store, appearancePreference, onAppearanceChange }: LifeBoardProps) {
  const { camera, panByPixels, applyWheel, centerView, zoomInCentered, zoomOutCentered, panByScrollbarDrag } =
    useCamera()
  const { placement, openOrCancelLibrary, closeLibrary, selectPattern, previewAt, stampArmedPattern } =
    usePatternPlacement(store.place)

  function renderOverlays({ size, visibleRange }: GridOverlayContext) {
    return (
      <>
        <GridRuler gridlines={computeMajorGridlines(visibleRange)} camera={camera} />

        {/* Bottom-right, not top-left, so it never overlaps the coordinate
            ruler labels above, which can appear anywhere along the top/left
            edges depending on pan position. Nudged in from the corner (rather
            than the plain right-2/bottom-2 it used before the scrollbars were
            added) so it clears the new bottom/right scrollbar tracks. */}
        <span className="pointer-events-none absolute right-4 bottom-4 rounded bg-gray-50/80 px-1.5 py-1 text-xs font-medium text-gray-600 dark:bg-zinc-800/80 dark:text-zinc-300">
          {zoomPercentage(camera)}%
        </span>

        <GridScrollbars
          camera={camera}
          store={store}
          size={size}
          contentId={GRID_CONTENT_ID}
          onDrag={panByScrollbarDrag}
        />

        {/* Overlay order is load-bearing: all of these are position:absolute
            with auto z-index, so the later sibling wins hit-testing wherever
            two overlap. GridToolbar (top-2 right-2) overlaps the vertical
            scrollbar track (right-0 w-2.5), so it must stay after
            GridScrollbars here. e2e/camera-pan-and-zoom.e2e.spec.ts is what
            proves it. */}
        <GridToolbar
          onZoomIn={() => zoomInCentered(size.width, size.height)}
          onZoomOut={() => zoomOutCentered(size.width, size.height)}
          onReset={() => centerView(size.width, size.height)}
          onPatterns={openOrCancelLibrary}
          appearancePreference={appearancePreference}
          onAppearanceChange={onAppearanceChange}
        />

        {/* No open-state guard on onPatterns: Headless UI's Dialog makes the
            rest of the page (including the toolbar) inert while the library
            is open, so that handler can't fire in the browsing state at all.
            Covered by e2e/modal-inertness.e2e.spec.ts. */}
        <PatternLibraryModal open={isLibraryOpen(placement)} onSelectPattern={selectPattern} onClose={closeLibrary} />
      </>
    )
  }

  return (
    <Grid
      camera={camera}
      store={store}
      previewPositions={previewPositions(placement)}
      isPatternArmed={Boolean(armedPattern(placement))}
      onToggleCell={store.toggle}
      onStampPattern={stampArmedPattern}
      onPan={panByPixels}
      onPreviewCell={previewAt}
      onWheelInput={applyWheel}
      onFirstMeasure={centerView}
      renderOverlays={renderOverlays}
    />
  )
}
