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

        {/* ORDER HERE IS RENDERING INTENT, NOT A CHECKED INVARIANT, and this
            comment used to say the opposite. These overlays are
            position:absolute siblings with auto z-index, so the later one
            wins hit-testing wherever two overlap -- and measured at 1280x900
            exactly one pair does: the toolbar's right edge lands at x=1272
            while the vertical scrollbar track spans 1270..1280, leaving a 2px
            sliver down the side of the Patterns button contested. The toolbar
            takes it as ordered here (document.elementFromPoint(1271, 9)
            returns that button). NOTHING TESTS THAT: swapping this element
            with GridScrollbars leaves npm test (953) and npm run test:e2e
            (126) entirely green, measured 2026-09-06 on this tree.

            What IS checked is the LAYERING these overlays sit in, which is a
            different claim -- they are siblings of #grid-content, never
            descendants of it. See Grid.tsx's overlay-slot comment,
            rules/no-overlays-inside-grid-content.yml, and
            camera-pan-and-zoom.feature's "Pressing a zoom control brings no
            cell to life underneath it"; inverting the slot into #grid-content
            reds 45 of those 126 tests. */}
        <GridToolbar
          onZoomIn={() => zoomInCentered(size.width, size.height)}
          onZoomOut={() => zoomOutCentered(size.width, size.height)}
          onReset={() => centerView(size.width, size.height)}
          onPatterns={openOrCancelLibrary}
          appearancePreference={appearancePreference}
          onAppearanceChange={onAppearanceChange}
        />

        {/* NO OPEN-STATE GUARD ON onPatterns, and THREE independent things
            make that safe. This comment used to name only the last of them,
            which is the one most likely to change under you.

            (1) The reducer already handles it. toggleLibrary maps `browsing`
            to the BROWSING constant the state already IS, so a handler that
            did fire is a no-op that does not even re-render -- pinned by
            patternPlacement.test.ts's "is idempotent on browsing, down to the
            reference" and by the identity property beside it, neither of which
            existed before this comment leaned on the fact.
            (2) The dialog physically covers the button's pixel.
            (3) Headless UI marks #root inert and aria-hidden while it is up.

            (2) AND (3) ARE REDUNDANT, NOT A CHAIN. Measured at rest -- after
            the open transition settles -- neutralising either one alone
            leaves all three acts in
            features/while-the-pattern-library-is-open.feature inert; only
            neutralising both lets them land, and then all three do (a grid
            click brings a cell to life, a zoom press moves the badge
            100 -> 125, a drag moves the ruler). So a Headless UI upgrade that
            changed one mechanism would not on its own break anything here,
            and (1) holds even if both go. */}
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
