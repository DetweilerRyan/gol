import { useState, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { screenToWorld, type Camera, type WheelInput } from '../camera'
import { computeVisibleRange, type VisibleRange } from '../gridGeometry'
import type { FocusDirection } from '../gridFocus'
import { useCellTiles } from '../hooks/useCellTiles'
import { useElementSize, type ElementSize } from '../hooks/useElementSize'
import { useGridFocus } from '../hooks/useGridFocus'
import { useGridPointerGestures } from '../hooks/useGridPointerGestures'
import { useInitialCentering } from '../hooks/useInitialCentering'
import { useLiveCells } from '../hooks/useLiveCells'
import { useRafCoalescedPan } from '../hooks/useRafCoalescedPan'
import { useWheelInput } from '../hooks/useWheelInput'
import { liveCellsInRange } from '../liveCellWindow'
import type { LiveCellStore } from '../liveCellStore'
import GridCells from './GridCells'
import GridLines from './GridLines'
import HoverIndicator from './HoverIndicator'
import PatternPreview from './PatternPreview'

// The four arrow keys plus Home/End, mapped to the direction/edge vocabulary
// gridFocus.ts's pure functions take -- kept as a lookup rather than a
// longer if/else chain so ARROW_KEY_DIRECTIONS and the Home/End branch below
// read as one small table each.
const ARROW_KEY_DIRECTIONS: Readonly<Record<string, FocusDirection>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export interface GridOverlayContext {
  size: ElementSize
  visibleRange: VisibleRange
}

export const GRID_CONTENT_ID = 'grid-content'

interface GridProps {
  camera: Camera
  store: LiveCellStore
  previewPositions: ReadonlyArray<readonly [number, number]>
  isPatternArmed: boolean
  onToggleCell: (x: number, y: number) => void
  onStampPattern: (x: number, y: number) => void
  onPan: (dxPixels: number, dyPixels: number) => void
  onPreviewCell: (x: number, y: number) => void
  onWheelInput: (input: WheelInput) => void
  onFirstMeasure: (widthPx: number, heightPx: number) => void
  renderOverlays: (context: GridOverlayContext) => ReactNode
}

export default function Grid({
  camera,
  store,
  previewPositions,
  isPatternArmed,
  onToggleCell,
  onStampPattern,
  onPan,
  onPreviewCell,
  onWheelInput,
  onFirstMeasure,
  renderOverlays,
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerSize = useElementSize(containerRef)

  useWheelInput(containerRef, onWheelInput)
  useInitialCentering(containerSize, onFirstMeasure)

  const visibleRange = computeVisibleRange(camera, containerSize.width, containerSize.height)
  const tiles = useCellTiles(camera, containerSize)
  const gridFocus = useGridFocus(camera, containerSize, onPan)

  // The render window itself: every live cell inside the mounted tile range,
  // plus the focus cursor's own cell (liveCellWindow.ts's +1 guarantee) --
  // see GridCells.tsx's own header. A plain expression, not a hand-written
  // useMemo (rules/no-manual-memo-tsx.yml forbids it under React Compiler
  // anyway): the compiler memoizes this call on its own three inputs --
  // liveCells (the store's identity, stable across everything except a
  // mutation), tiles.range (nextTileRange's own by-reference contract, held
  // stable across an in-range pan), and gridFocus.focus (state, stable
  // across everything except a focus move) -- so a within-range pointer-drag
  // pan that touches none of the three still bails before this call ever
  // reruns, exactly the pan-stable-cell-cheap contract GridCells used to get
  // from CellTile's own prop stability. If that ever regresses, it shows up
  // as Grid.test.tsx's existing pan-stability tests going red, not as a new
  // assertion here.
  const liveCells = useLiveCells(store)
  const cells = liveCellsInRange(liveCells, tiles.range, gridFocus.focus)

  // The single cursor-following hover affordance (HoverIndicator.tsx) that
  // replaced ~19,680 per-cell `hover:` classes -- see that component's own
  // header. Kept as its own bit of state, separate from usePatternPlacement's
  // preview positions, because a hovered cell exists whether or not a
  // pattern is armed -- onHover below now feeds both unconditionally (see
  // its own comment on why that's safe for the preview half too).
  //
  // The updater function form, not a plain setHovered(next): it re-reads the
  // PREVIOUS value at update time and keeps that exact object when the
  // coordinate hasn't moved, so a sub-cell pointermove that resolves to the
  // same world cell doesn't hand HoverIndicator (and anything watching this
  // state) a new object identity for no visible change.
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null)
  function updateHovered(x: number, y: number) {
    setHovered((prev) => (prev !== null && prev.x === x && prev.y === y ? prev : { x, y }))
  }

  // Single-shot stamping (disarming immediately after a placement) belongs to
  // whoever owns the placement state -- usePatternPlacement's
  // stampArmedPattern -- not here: this branch only decides which of the two
  // upward callbacks a given activation resolves to.
  //
  // Declared as a const arrow above its first use (rather than a hoisted
  // function declaration below it, as this used to read) so React Compiler
  // memoizes it against its own dependencies (isPatternArmed, onStampPattern,
  // onToggleCell) -- see the compiled output referenced from Grid.test.tsx's
  // tile pan-stability tests. A function declaration referenced from
  // inside the onTap closure below it compiled to a fresh function every
  // render, which defeated GridCells' own memoization even though every
  // tile-derived prop it receives was unchanged.
  const activateCell = (x: number, y: number) => {
    if (isPatternArmed) {
      onStampPattern(x, y)
    } else {
      onToggleCell(x, y)
    }
  }

  // Coalesces however many pointermove-driven onPan calls land within one
  // animation frame into a single call carrying their sum -- a real win for
  // trackpad input, which can deliver several pointermoves per frame; a
  // once-per-frame mouse cadence has nothing to coalesce either way. See
  // useRafCoalescedPan's own header for the invariant (net shift == sum of
  // pushes, regardless of flush timing) this must preserve.
  const coalescedPan = useRafCoalescedPan(onPan)

  // trackHover is unconditionally true now, not gated on isPatternArmed --
  // this slice's own inherited acceptance criterion (see the idea file) is
  // "the hover indicator and the click must resolve to the same cell at
  // every point", which only holds if hover always runs through the same
  // screenToWorld resolver onTap uses, whether or not a pattern is armed.
  // useGridPointerGestures itself still skips the dispatch once a drag has
  // crossed the pan threshold (see its own handlePointerMove comment), which
  // is what keeps this from adding a getBoundingClientRect call to every
  // pointermove of an ordinary pan drag -- the cost the old,
  // isPatternArmed-gated flag used to avoid a different way.
  const { isPanning, handlers } = useGridPointerGestures({
    trackHover: true,
    onPan: coalescedPan.push,
    // Flushes synchronously on release/cancel so a pan mid-frame settles
    // immediately rather than waiting on a queued animation frame -- see
    // useGridPointerGestures' onPanEnd doc comment for why it must run
    // first, before capture release or tap resolution.
    onPanEnd: coalescedPan.flush,
    onTap: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      activateCell(x, y)
      // A pointer click also moves the roving keyboard cursor to the
      // clicked cell -- one "current cell" shared by both routes (see
      // keyboard-grid-navigation.feature's "Clicking a cell makes it the
      // cell the keyboard comes back to"). setFocus moves the cursor and
      // requests real DOM focus, but never a reveal-pan: a click is resolved
      // from on-screen pixels, so its cell is already in view. See
      // useGridFocus.ts's own header.
      gridFocus.setFocus(x, y)
      // DELIBERATELY no blur() here, and the click ends with real DOM focus
      // ON the clicked cell. That is the behavior the contract wants, not a
      // compromise: the cursor and real focus then coincide on one cell,
      // which is what "one current cell shared by both routes" means, and it
      // is what makes the click-then-Enter route work at all -- pinned by
      // features/hud-layout-and-shortcuts.e2e.spec.ts's "Enter on a focused
      // grid cell...", which polls document.activeElement immediately after
      // a click, with no intervening Tab, and requires it to already be the
      // clicked cell. Blurring here would break that route outright: a user
      // who clicks a cell and presses Enter would toggle nothing.
      //
      // WHAT CHANGED AT STEP 4, since the previous form of this comment
      // credited the wrong mechanism: Chromium's own click-focuses-button
      // default used to deliver that focus for free, because every cell in
      // range had a button to be clicked on. Only live cells (plus the
      // cursor) have one now, so a click on a DEAD cell resolves native focus
      // to nothing -- the button does not exist until React commits the
      // toggle. useGridFocus's setFocus is what puts focus back on it.
    },
    onHover: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      updateHovered(x, y)
      // Called unconditionally now that this runs on every hover move, not
      // just while a pattern is armed -- verified safe rather than guarded
      // defensively: onPreviewCell is usePatternPlacement's previewAt,
      // wrapping patternPlacement.ts's movePreviewTo, which returns its
      // INPUT STATE UNCHANGED (same object identity) whenever mode isn't
      // 'placing'. React's setState bails out on that exact identity, so a
      // plain hover with nothing armed triggers no re-render anywhere this
      // reaches -- an isPatternArmed guard here would only be defending
      // against a cost that provably doesn't exist.
      onPreviewCell(x, y)
    },
  })

  // Arrow keys, Home/End -- Enter and Space need no handling here at all:
  // they're native <button> activation, already wired via Cell's own
  // onClick (see Cell.tsx's comment on that), and firing on whichever
  // element genuinely holds DOM focus is exactly the roving-tabindex cell
  // useGridFocus's el.focus() calls keep it pointed at. preventDefault only
  // on the six keys this actually handles, so Tab/Shift+Tab (native
  // sequential navigation) and every other key pass through untouched.
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const direction = ARROW_KEY_DIRECTIONS[e.key]
    if (direction) {
      e.preventDefault()
      gridFocus.moveFocus(direction)
      return
    }
    if (e.key === 'Home') {
      e.preventDefault()
      gridFocus.jumpToEdge('left')
    } else if (e.key === 'End') {
      e.preventDefault()
      // EQUIVALENT MUTANT, measured -- do not chase it. Stryker reports
      // 'right' -> "" here as Survived and nothing can kill it:
      // gridFocus.ts's jumpToRowEdge is `edge === 'left' ? minX : maxX`, so
      // every non-'left' value takes the same branch 'right' does. The
      // Home site's own 'left' -> "" mutant IS killed, by the Home case in
      // Grid.test.tsx's keyboard describe.
      gridFocus.jumpToEdge('right')
    }
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* Owns the pan/toggle pointer handlers and sits below every overlay the
          caller supplies (today: ruler, zoom%, scrollbars, toolbar, modal) as
          a sibling rather than an ancestor, so overlay pointer events never
          bubble into these
          handlers in the first place -- no stopPropagation/open-state guards
          needed on either side. inset-0 keeps its rect identical to the
          outer container's, which useGridPointerGestures' pointer handlers
          and useWheelInput both rely on. The overlay slot below is invoked as
          a following sibling of this div, inside the same parent, for the
          same reason: callers supply *what* the overlays are, never *where*
          they sit, so this sibling-not-ancestor layering can't be broken
          from outside Grid. */}
      {/* Delegated, not an interactive control of its own -- this div is
          never itself a focus/tab target (no role, no tabIndex), and never
          will be. Its onKeyDown only catches keydown events BUBBLING up from
          whichever Cell button currently holds real focus (the
          roving-tabindex cursor -- see useGridFocus.ts), the same
          delegation shape {...handlers}'s pointer listeners already use.
          The actual interactive elements a11y cares about are the Cell
          buttons themselves, each already correctly exposed as
          role="button". */}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        id={GRID_CONTENT_ID}
        {...handlers}
        onKeyDown={handleKeyDown}
        // Clears the hover indicator when the pointer leaves the grid
        // entirely -- the one case trackHover's own pointermove-driven
        // updateHovered can't reach, since there's no move event once the
        // pointer is off the element. Mirrors what CSS :hover used to do for
        // free on every dead cell's own hover: class before this slice.
        onPointerLeave={() => setHovered(null)}
        className={`absolute inset-0 touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* NO transform here -- #grid-content's client rect is load-bearing.
            useGridPointerGestures and useWheelInput both call
            getBoundingClientRect() on this element, and a transform here
            would shift that rect, silently resolving every tap/hover to the
            wrong world cell (rectRelativePixels -> screenToWorld). The
            transform that makes a pan pan-stable-cell-cheap lives one level
            deeper, on the layer div below, which affects only where its
            children paint, not this element's own rect. */}
        {/* GridLines paints first -- furthest back in stacking order for two
            same-level absolutely-positioned siblings -- so every mounted,
            ALIVE Cell's own opaque background occludes it (a dead cell no
            longer mounts at all, except the rare dead-and-focused case,
            which stays transparent for exactly this reason -- see Cell.tsx's
            own header). Showing through the vast unmounted majority of the
            grid is the point now, not incidental staging: see
            GridLines.tsx's own header for why it sits here, untransformed,
            rather than as a background on the transformed layer div below. */}
        <GridLines camera={camera} />

        {/* Grid -> GridCells is a real component edge, kept even though every
            other sibling component was inverted into the overlay slot: cells
            must render *inside* #grid-content, and owning that containment is
            exactly why Grid exists as a component rather than folding into
            LifeBoard. Do not invert this edge too. */}
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${tiles.offsetXPx}px, ${tiles.offsetYPx}px)`, willChange: 'transform' }}
        >
          <GridCells
            cells={cells}
            anchorX={tiles.anchorX}
            anchorY={tiles.anchorY}
            cellSize={tiles.cellSize}
            onActivateCell={activateCell}
            focus={gridFocus.focus}
          />
        </div>

        {/* HoverIndicator renders after GridCells' layer and BEFORE
            PatternPreview, deliberately -- later-in-DOM wins for two
            same-level absolutely-positioned siblings, so the indicator paints
            over an alive cell's own background (visible feedback on a live
            cell too, not just the empty majority), and an armed pattern's
            preview still paints over the indicator rather than fighting it
            for the same pixels while a pattern is being aimed. Camera-exact
            like PatternPreview, outside the transformed layer -- see
            HoverIndicator.tsx. */}
        <HoverIndicator camera={camera} hovered={hovered} />

        {/* PatternPreview renders after GridCells' layer, deliberately: both
            are absolutely positioned with auto z-index, so later-in-DOM wins,
            and the preview must paint over the cell buttons rather than
            behind them. See Grid.test.tsx's DOM-order assertion below. It
            stays outside the transformed layer and camera-exact -- see
            PatternPreview.tsx. */}
        <PatternPreview camera={camera} positions={previewPositions} />
      </div>

      {renderOverlays({ size: containerSize, visibleRange })}
    </div>
  )
}
