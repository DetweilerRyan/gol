import { useLayoutEffect, useState, useRef, type KeyboardEvent, type ReactNode } from 'react'
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
  //
  // MUTATION-SCAN NOTE -- corrected at the corrective's hardening gate, and
  // the correction matters more than the note. This comment previously said
  // all 5 unkilled mutants on the line below were equivalent, and that was
  // WRONG for 4 of them. The argument it gave -- "both branches return an
  // object whose own x/y are the same numbers either way, so only the
  // reference identity differs" -- holds ONLY for the whole-condition
  // mutant. For the per-axis ones it is false: with `prev.x === x` forced to
  // true, a move that changes x but not y takes the `prev` branch and
  // renders prev's OLD x. Those mutants were not equivalent, only
  // unexercised -- 4 of the 5 were NoCoverage, and the reasoning was applied
  // to the whole set on the strength of a hand-check that could not
  // distinguish "equivalent" from "nothing drives this yet".
  //
  // Measured on the corrective tree: the camera-change effect below gave
  // those mutants coverage for the first time, the Y-axis pair died to the
  // wheel-route test, and the X-axis pair died once its X-axis twin was
  // added (see Grid.test.tsx's 'hover indicator wiring' describe, which now
  // pins both axes and the mid-drag route).
  //
  // EXACTLY ONE EQUIVALENT MUTANT REMAINS: the whole condition -> false,
  // which returns a freshly allocated { x, y } carrying the same numbers
  // rather than `prev`. Nothing downstream reads that reference's identity,
  // only its x/y, so it changes React's re-render bailout and nothing a test
  // can observe.
  //
  // Still do NOT "fix" this by switching to isShallowEqual, which would not
  // be behavior-preserving: screenToWorld's Math.floor can return -0, and
  // Object.is(0, -0) is false where === is true, so the swap would treat two
  // renders of the same world cell (0 vs -0) as a coordinate change this
  // comparison exists to suppress. liveCellStore.ts's getBoundsSnapshot
  // comment documents the analogous box-identity check -- and note its own
  // survivor set was audited the same way, where 5 of 6 ARE equivalent and
  // the sixth is a real kill the tool misattributes.
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null)
  function updateHovered(x: number, y: number) {
    setHovered((prev) => (prev !== null && prev.x === x && prev.y === y ? prev : { x, y }))
  }

  // THE HOVER/CLICK-AGREEMENT COROLLARY (corrective, collapse-dead-cell-layer):
  // `hovered` above is a resolved WORLD cell, updated only when something
  // ACTUALLY calls updateHovered. That used to be pointermove alone, which
  // is exactly the gap architect's ADJUDICATE ruling measured -- a wheel-pan,
  // a coarse drag, or an arrow-key reveal-pan all move `camera` with no
  // pointermove of their own, so the indicator kept rendering the LAST
  // resolved world cell through worldToScreen while it silently rode the
  // panned content away from a pointer that never moved. See
  // HoverIndicator.tsx's own header for the measured numbers.
  //
  // The fix is the one sentence the ruling states as the whole brief: the
  // indicator is screenToWorld(CURRENT camera, CURRENT pointer pixels), same
  // as a click, at the same instant. `camera` is already a prop this
  // component re-renders on; what's missing is the CURRENT pointer pixels,
  // which onHover only captures while it's actually firing. lastPointerPixelsRef
  // closes that: every pointer position update (onHover -- not panning -- or
  // onPointerPosition -- mid-drag, see useGridPointerGestures.ts) stashes the
  // rect-relative pixels here, and this effect re-resolves `hovered` from
  // them whenever `camera` itself changes, regardless of why.
  //
  // WHY A REF FOR THE PIXELS, NOT useState. Raw pixels change on every
  // pointermove -- the highest-frequency event in the app, and this slice
  // cannot run test:perf to catch a regression there. Putting them in state
  // would re-render Grid on every pixel of travel; a ref lets
  // lastPointerPixelsRef.current update with no render at all, and the only
  // render this produces is the one updateHovered's own identity-deduped
  // setter already causes when the resolved CELL (not the pixel) actually
  // changes -- see that setter's own mutation-scan comment above, untouched
  // by this addition.
  //
  // WHY useLayoutEffect, NOT a plain useEffect or render-time state
  // adjustment (the pattern useCellTiles.ts/useGridFocus.ts's one-shot
  // centering both use for a camera-derived value). A plain effect would
  // let one frame commit and paint with the STALE indicator position before
  // this ever ran, which is a real, if brief, visible flash on the commonest
  // gesture there is (wheel-pan). Render-time adjustment (comparing `camera`
  // against a remembered previous value and calling setState synchronously
  // inside the render body) avoids that extra frame entirely, but it means
  // duplicating updateHovered's own dedup ternary at a second call site for
  // a saving that is invisible to a user either way -- useLayoutEffect fires
  // synchronously after the DOM update but BEFORE the browser paints, so
  // there is no visible flash, at the cost of one extra (pre-paint) commit
  // React already schedules for free. That trade matches this hook's own
  // pendingDomFocusRef sync effect one file over (useGridFocus.ts), which
  // reads the same way for the same reason.
  //
  // WHY THIS ALSO CLOSES THE ARROW-KEY REVEAL-PAN GAP, FOR FREE:
  // useGridFocus.moveFocus's panToRevealPx calls this component's own onPan,
  // which -- like a wheel-pan or a drag -- only ever surfaces here as a
  // change to the `camera` PROP. This effect does not know or care which of
  // the three caused that change; it only asks "is this a new camera", so
  // the same fix covers all three without a fourth call site.
  const lastPointerPixelsRef = useRef<{ pixelX: number; pixelY: number } | null>(null)
  useLayoutEffect(() => {
    const pixels = lastPointerPixelsRef.current
    if (pixels === null) return
    const { x, y } = screenToWorld(camera, pixels.pixelX, pixels.pixelY)
    updateHovered(x, y)
  }, [camera])

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
      lastPointerPixelsRef.current = { pixelX, pixelY }
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
    // Mid-drag only (see useGridPointerGestures.ts's own doc comment on this
    // callback) -- keeps lastPointerPixelsRef current WITHOUT resolving a
    // world cell or touching onPreviewCell here. The indicator itself
    // catches up once the camera-change effect above fires, which is what
    // actually re-resolves `hovered` -- deliberately not done here too, so
    // there is exactly one call site that turns pixels into a world cell
    // during a pan (the effect), not two that could disagree on timing.
    // Preview-during-pan is unchanged and out of scope for this fix: a
    // brief mid-drag divergence between the indicator and an armed
    // pattern's preview is accepted (see this slice's corrective handoff).
    onPointerPosition: (pixelX, pixelY) => {
      lastPointerPixelsRef.current = { pixelX, pixelY }
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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-gray-100 dark:bg-zinc-900">
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
        // free on every dead cell's own hover: class before this slice. Also
        // clears lastPointerPixelsRef, not just `hovered` -- otherwise a
        // camera change AFTER the pointer has left (a wheel-pan reachable
        // with the mouse off the grid entirely) would resurrect the
        // indicator at a stale position via the camera-change effect above.
        onPointerLeave={() => {
          lastPointerPixelsRef.current = null
          setHovered(null)
        }}
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
