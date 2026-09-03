import { act, fireEvent, render, screen, type RenderResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CELL_SIZE, screenToWorld, worldToScreen, type Camera } from '../camera'
import { anchorOffsetPx, computeAnchor } from '../cellAnchor'
import { coveringTileRange, nextTileRange, TILE_SPAN_CELLS } from '../cellTiles'
import { DRAG_THRESHOLD_PX } from '../dragGesture'
import { computeOnScreenRange } from '../gridGeometry'
import { createLiveCellStore } from '../liveCellStore'
import {
  stubBoundingClientRect,
  stubPointerCapture,
  stubResizeObserver,
  type ResizeObserverController,
} from '../test-support/domStubs'
import { gridContentEl } from '../test-support/gridDom'
import Cell from './Cell'
import Grid, { GRID_CONTENT_ID } from './Grid'
import { HOVER_INDICATOR_ID } from './HoverIndicator'

// Automocked with `spy: true` (Vitest 4's sanctioned way to spy on a
// component the SUT imports directly, since a bare vi.spyOn on a named ESM
// export throws "cannot redefine property") -- the REAL Cell implementation
// still runs, so every other test in this file renders exactly the same DOM
// it always did. vi.mocked(Cell) is a direct per-Cell RENDER-CALL counter:
// the literal successor of the getCellSnapshot-call-count probe the "tile
// pan-stability" describe below used before this slice's step 4, which
// retired useLiveCell as a render source entirely (see Cell.tsx's own
// header). getCellSnapshot is not merely uncalled now -- the REVIEW pass of
// the same slice retired the whole per-cell channel it belonged to, so a spy
// on it would not compile at all; see liveCellStore.ts's header.
vi.mock('./Cell', { spy: true })

// Grid itself composes useElementSize (ResizeObserver), useWheelInput,
// useGridPointerGestures (both getBoundingClientRect/pointer capture), and
// useCellTiles -- each of those has its own focused test for the API wiring
// or math itself. What's left here is the composition: the DOM layering
// contract (including that #grid-content itself never carries a transform,
// since useGridPointerGestures/useWheelInput both read its
// getBoundingClientRect), the place-vs-toggle dispatch, one thin wiring test
// per hook proving Grid actually connects its handlers rather than testing
// the handlers' own logic again, and the "tile pan-stability" pair proving a
// pan that stays within the current tile range re-renders no mounted Cell
// while a real change (a store mutation on the mounted cell) still triggers
// one (the guard isn't vacuous). See src/test-support/domStubs.ts for why
// each stub is needed. Pointer capture is stubbed (unused beyond that)
// purely so jsdom doesn't throw when a pointerdown-driven test calls
// setPointerCapture -- its own release-guard behavior is
// useGridPointerGestures.test.tsx's job.
//
// underStryker gates one test in the "tile pan-stability" describe below --
// see that site's own comment for why. globalThis.__stryker__ is set at module load
// by any instrumented file's own bootstrap, before test collection, so it
// reliably distinguishes a mutation-testing run from a normal one -- the
// same pattern useLiveCell.test.ts's own resubscription test used, before
// this slice's step 5 retired that file along with useLiveCell.ts itself.
const underStryker = '__stryker__' in globalThis

let resizeObserver: ResizeObserverController

beforeEach(() => {
  resizeObserver = stubResizeObserver()
  stubBoundingClientRect({ left: 0, top: 0, width: WIDTH, height: HEIGHT })
  stubPointerCapture()
})

// Small on purpose: nothing left in this file depends on how many cells are
// on screen (see the composition described in the file header comment), so
// there's no reason to pay for a large GridCells render here.
const WIDTH = 40
const HEIGHT = 40

// Fixed at the origin (not viewport-centered) so every assertion here is
// independent of WIDTH/HEIGHT -- Grid no longer owns centering itself
// (see useInitialCentering.test.ts), it just receives whatever camera its
// caller passes.
const CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

function triggerResize(width: number, height: number) {
  resizeObserver.resize(width, height)
}

type GridProps = React.ComponentProps<typeof Grid>

function renderGrid(
  props: Partial<GridProps> = {},
): RenderResult & GridProps & { rerenderWith: (overrides: Partial<GridProps>) => void } {
  const merged: GridProps = {
    camera: CAMERA,
    store: createLiveCellStore(),
    previewPositions: [],
    isPatternArmed: false,
    onToggleCell: vi.fn(),
    onStampPattern: vi.fn(),
    onPan: vi.fn(),
    onPreviewCell: vi.fn(),
    onWheelInput: vi.fn(),
    onFirstMeasure: vi.fn(),
    renderOverlays: () => null,
    ...props,
  }
  const utils = render(<Grid {...merged} />)
  function rerenderWith(overrides: Partial<GridProps>) {
    utils.rerender(<Grid {...merged} {...overrides} />)
  }
  return { ...utils, ...merged, rerenderWith }
}

function rootEl(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement
}

function previewTransform(x: number, y: number): string {
  return screen.getByLabelText(`Pattern preview cell ${x}, ${y}`).style.transform
}

function expectedTransform(camera: Camera, x: number, y: number): string {
  const { x: left, y: top } = worldToScreen(camera, x, y)
  return `translate(${left}px, ${top}px)`
}

describe('DOM structure', () => {
  it('renders the overlay slot as a following sibling of #grid-content, never inside it', () => {
    const { container } = renderGrid({ renderOverlays: () => <div data-testid="overlay" /> })
    const content = gridContentEl(container)
    const overlay = screen.getByTestId('overlay')
    expect(content.contains(overlay)).toBe(false)
    expect(overlay.parentElement).toBe(content.parentElement)
    expect(content.compareDocumentPosition(overlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(content.className).toContain('inset-0')
  })

  it('gives the pointer-handled div id={GRID_CONTENT_ID}', () => {
    const { container } = renderGrid()
    const content = container.querySelector(`#${GRID_CONTENT_ID}`)
    expect(content).not.toBeNull()
    expect(content?.id).toBe(GRID_CONTENT_ID)
  })

  it('renders GridLines as the FIRST child of #grid-content, before the transformed layer', () => {
    // "First" is load-bearing: CSS paints later-in-DOM on top for two
    // same-stacking-level absolutely-positioned siblings, so GridLines has to
    // be earliest in the DOM to stay furthest back, behind every mounted,
    // alive Cell's own opaque background. See GridLines.tsx's own header.
    const { container } = renderGrid()
    const content = gridContentEl(container)
    const firstChild = content.firstElementChild as HTMLElement
    expect(firstChild.getAttribute('aria-hidden')).toBe('true')
    expect(firstChild.style.transform).toBe('')

    const layerDiv = content.children[1] as HTMLElement
    expect(layerDiv.style.transform).toContain('translate(')
  })

  it('#grid-content itself never carries a transform, before or after a pan', () => {
    // Load-bearing: useGridPointerGestures and useWheelInput both call
    // getBoundingClientRect() on #grid-content, so a transform here (rather
    // than on the layer div one level inside it) would shift that rect and
    // silently resolve every tap/hover to the wrong world cell. See the "NO
    // transform here" comment in Grid.tsx.
    const { container, rerenderWith } = renderGrid()
    const content = gridContentEl(container)
    expect(content.style.transform).toBe('')

    rerenderWith({ camera: { ...CAMERA, offsetX: CAMERA.offsetX + 5, offsetY: CAMERA.offsetY + 5 } })
    expect(content.style.transform).toBe('')
  })

  it("carries the transform one level in, on the layer div wrapping GridCells, via the tile anchor's offset", () => {
    // The complement of the test above: the transform useGridPointerGestures/
    // useWheelInput must never see on #grid-content itself has to live
    // somewhere -- this pins it to the layer div one level inside, sourced
    // from useCellTiles' offsetXPx/offsetYPx, plus the willChange hint.
    // Deliberately a single render with no rerender/identity comparison (see
    // "tile pan-stability" below for that), so it isn't sensitive to whether
    // a re-render happens -- only to what the layer div's style actually is.
    const { container } = renderGrid()
    // children[1], not firstElementChild -- GridLines is the actual first
    // child (see the DOM-structure test above); the transformed layer div
    // wrapping GridCells is the second.
    const layerDiv = gridContentEl(container).children[1] as HTMLElement
    const anchor = computeAnchor(CAMERA, TILE_SPAN_CELLS)
    const { xPx, yPx } = anchorOffsetPx(anchor, CAMERA)
    expect(layerDiv.style.transform).toBe(`translate(${xPx}px, ${yPx}px)`)
    expect(layerDiv.style.willChange).toBe('transform')

    // Generalises the assertion above: this virtualized design leans on
    // getBoundingClientRect() (post-transform) and layout-unit pixel math
    // (pre-transform) agreeing, which only a `scale` transform can break
    // (see discussion #248's units-mismatch hazard, cited in this slice's
    // design doc). This codebase never scales the layer -- a zoom changes
    // cellSize and re-lays every cell out instead -- so the layer's own
    // transform must always be a pure translate, never a scale.
    expect(layerDiv.style.transform).toMatch(/^translate\(-?\d+(\.\d+)?px, -?\d+(\.\d+)?px\)$/)
    expect(layerDiv.style.transform).not.toContain('scale')
  })

  it('renders the pattern preview after the cell buttons in DOM order', () => {
    // compareDocumentPosition rather than a sibling-index comparison
    // (container.children.indexOf(...)): GridCells' cell buttons sit inside
    // their own transformed layer div, not as direct siblings of the
    // preview, so an index-based assertion would break on that nesting even
    // though the actual paint order (later-in-DOM wins for same-stacking-
    // context absolutely-positioned elements) is unaffected by it.
    renderGrid({ previewPositions: [[0, 0]] })
    const cellButton = screen.getByRole('button', { name: 'Cell 0, 0' })
    const preview = screen.getByLabelText('Pattern preview cell 0, 0')
    expect(cellButton.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('cell activation dispatch (place vs toggle)', () => {
  it.each([
    { isPatternArmed: false, expectCalled: 'onToggleCell', expectNotCalled: 'onStampPattern' },
    { isPatternArmed: true, expectCalled: 'onStampPattern', expectNotCalled: 'onToggleCell' },
  ] as const)(
    'a plain activation calls $expectCalled, not $expectNotCalled, when isPatternArmed is $isPatternArmed',
    ({ isPatternArmed, expectCalled, expectNotCalled }) => {
      const onToggleCell = vi.fn()
      const onStampPattern = vi.fn()
      const handlers = { onToggleCell, onStampPattern }
      renderGrid({ ...handlers, isPatternArmed })

      fireEvent.click(screen.getByRole('button', { name: 'Cell 0, 0' }))

      expect(handlers[expectCalled]).toHaveBeenCalledWith(0, 0)
      expect(handlers[expectNotCalled]).not.toHaveBeenCalled()
    },
  )
})

describe('pointer surface wiring', () => {
  it('a pointerdown/pointerup on #grid-content resolves to onToggleCell at screenToWorld(camera, ...) coordinates', () => {
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    const grid = gridContentEl(container)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 50, clientY: 60 })
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 50, clientY: 60 })

    const expected = screenToWorld(CAMERA, 50, 60)
    expect(onToggleCell).toHaveBeenCalledWith(expected.x, expected.y)
  })

  it('flips #grid-content between cursor-grab and cursor-grabbing as the drag threshold is crossed and released', () => {
    const { container } = renderGrid()
    const grid = gridContentEl(container)
    expect(grid.classList.contains('cursor-grab')).toBe(true)
    expect(grid.classList.contains('cursor-grabbing')).toBe(false)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: DRAG_THRESHOLD_PX + 1, clientY: 0 })
    expect(grid.classList.contains('cursor-grabbing')).toBe(true)
    expect(grid.classList.contains('cursor-grab')).toBe(false)

    fireEvent.pointerUp(grid, { pointerId: 1, clientX: DRAG_THRESHOLD_PX + 1, clientY: 0 })
    expect(grid.classList.contains('cursor-grabbing')).toBe(false)
    expect(grid.classList.contains('cursor-grab')).toBe(true)
  })

  it('a cancelled drag does not commit a pattern placement', () => {
    const onStampPattern = vi.fn()
    const { container } = renderGrid({ onStampPattern, isPatternArmed: true })
    const grid = gridContentEl(container)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 0 })
    fireEvent.pointerCancel(grid, { pointerId: 1, clientX: 20, clientY: 0 })

    expect(onStampPattern).not.toHaveBeenCalled()
  })
})

describe('measurement wiring', () => {
  it('mounts the focus cursor immediately on mount, before any ResizeObserver callback fires', () => {
    // Exercises the initial containerSize state ({ width: 0, height: 0 }):
    // computeOnScreenRange collapses to the single cell (0, 0) at that
    // default (Math.ceil/Math.floor both land on 0 for a 0x0 viewport at
    // this camera), so useGridFocus's initial centerCell call lands there
    // too -- and liveCellWindow.ts's own +1 guarantee is what actually
    // mounts it with an empty store (this is the one cell in the whole
    // grid that isn't live). Not a tile-coverage claim any more -- see
    // liveCellWindow.ts's header for why a dead, unfocused cell in range
    // stays unmounted regardless of what useCellTiles computes.
    renderGrid()
    expect(screen.getByRole('button', { name: 'Cell 0, 0' })).toBeInTheDocument()
  })

  it('calls onFirstMeasure with the observed size once ResizeObserver reports one', () => {
    const onFirstMeasure = vi.fn()
    renderGrid({ onFirstMeasure })

    triggerResize(WIDTH, HEIGHT)

    expect(onFirstMeasure).toHaveBeenCalledWith(WIDTH, HEIGHT)
  })
})

describe('wheel and preview wiring', () => {
  it('a wheel event on the root reports rect-relative pixels via onWheelInput', () => {
    const onWheelInput = vi.fn()
    const { container } = renderGrid({ onWheelInput })
    stubBoundingClientRect({ left: 50, top: 30, width: WIDTH, height: HEIGHT })

    fireEvent.wheel(rootEl(container), { deltaX: 40, deltaY: -20, shiftKey: false, clientX: 150, clientY: 130 })

    expect(onWheelInput).toHaveBeenCalledWith({
      pixelX: 150 - 50,
      pixelY: 130 - 30,
      deltaX: 40,
      deltaY: -20,
      deltaMode: 0,
      shiftKey: false,
      ctrlKey: false,
    })
  })

  // onPreviewCell fires on hover REGARDLESS of whether a pattern is armed:
  // trackHover is unconditionally true now (see Grid.tsx's own comment at the
  // useGridPointerGestures call site). The unarmed row is the companion the
  // old isPatternArmed-gated flag made untestable -- onPreviewCell still fires
  // with NOTHING armed, proven safe by usePatternPlacement's own movePreviewTo
  // returning its input state unchanged in idle mode (verified at that call
  // site's own comment). One row per armed state rather than two hand-written
  // twins, so a regression that re-gates the callback on `armed` is still
  // killed by whichever row it breaks.
  it.each([
    ['while a pattern is armed', true],
    ['on an ordinary hover with no pattern armed', false],
  ])('reports screenToWorld(camera, ...) coordinates via onPreviewCell %s', (_label, isPatternArmed) => {
    const onPreviewCell = vi.fn()
    const { container } = renderGrid({ onPreviewCell, isPatternArmed })
    const grid = gridContentEl(container)

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 30 })

    const expected = screenToWorld(CAMERA, 20, 30)
    expect(onPreviewCell).toHaveBeenCalledWith(expected.x, expected.y)
  })

  it('repositions a preview cell via worldToScreen(camera, ...) when the camera prop changes, not a real pan', () => {
    const { rerenderWith } = renderGrid({ previewPositions: [[5, 5]] })
    expect(previewTransform(5, 5)).toBe(expectedTransform(CAMERA, 5, 5))

    const otherCamera: Camera = { offsetX: -3, offsetY: -1, cellSize: 20 }
    rerenderWith({ camera: otherCamera, previewPositions: [[5, 5]] })

    expect(previewTransform(5, 5)).toBe(expectedTransform(otherCamera, 5, 5))
  })
})

// HoverIndicator.tsx: the single cursor-following affordance that replaced
// ~19,680 per-cell hover: classes (see that component's own header). Its own
// positioning math is HoverIndicator.test.tsx's job -- what's left here is
// that Grid actually feeds it a resolved world cell and clears it on
// pointer-leave, and that it sits at the DOM position its own header claims
// (children[2]: GridLines, the transformed layer div, then this -- it has no
// ARIA role by design, so it can't be reached via screen.getByRole).
describe('hover indicator wiring', () => {
  function hoverIndicator(container: HTMLElement): HTMLElement | null {
    return gridContentEl(container).querySelector(`#${HOVER_INDICATOR_ID}`)
  }

  it('positions the hover indicator at screenToWorld(camera, ...) on pointermove', () => {
    const { container } = renderGrid()
    const grid = gridContentEl(container)

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 30 })

    const indicator = hoverIndicator(container)!
    const expected = screenToWorld(CAMERA, 20, 30)
    expect(indicator.style.transform).toBe(expectedTransform(CAMERA, expected.x, expected.y))
  })

  it('renders no indicator at all before any hover has been reported', () => {
    const { container } = renderGrid()
    expect(hoverIndicator(container)).toBeNull()
  })

  it('clears the indicator when the pointer leaves #grid-content', () => {
    const { container } = renderGrid()
    const grid = gridContentEl(container)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 30 })
    expect(hoverIndicator(container)).not.toBeNull()

    fireEvent.pointerLeave(grid)

    expect(hoverIndicator(container)).toBeNull()
  })

  // THE WHEEL-ROUTE REGRESSION TEST, written first per this fix's own
  // ordering (see this slice's corrective handoff): a wheel-pan moves
  // `camera` with NO pointermove of its own, so the pointer never reports a
  // new position -- recomputing the indicator from `camera` alone, against
  // the LAST pointer position already on file, is sufficient and is the
  // whole fix. Before the fix, the indicator kept rendering the world cell
  // resolved at the ORIGINAL pointermove and silently rode the panned
  // content away from a pointer that never moved -- see HoverIndicator.tsx's
  // own header for the measured, then-shipped defect this closes
  // (architect ADJUDICATE).
  //
  // rerenderWith, not a real wheel event: useWheelInput's own translation
  // from a native wheel event to a new `camera` prop is that hook's own
  // tested contract (useWheelInput.test.ts) and LifeBoard's
  // (useCamera.test.ts) -- what belongs here is only "given `camera` changed
  // by ANY means, does the indicator re-resolve", which a direct prop change
  // states more precisely than reconstructing a wheel event would.
  // ONE ROW PER AXIS, and the second is not symmetry for its own sake: a
  // Y-only pan exercises only the `prev.y === y` half of updateHovered's
  // identity dedup. Measured on this tree -- with the Y row alone, both
  // `prev.x === x` mutants (-> true, and -> !==) survive a full unfiltered
  // run while both `prev.y === y` mutants die. A dedup comparing one axis and
  // ignoring the other would leave the indicator stuck on any purely
  // horizontal camera move, which is the very class of staleness this
  // corrective exists to remove. 130px at cellSize=20 is 6.5 cells, well past
  // a single-cell rounding wobble.
  it.each([
    ['Y', (c: Camera): Camera => ({ ...c, offsetY: c.offsetY + 130 / c.cellSize })],
    ['X', (c: Camera): Camera => ({ ...c, offsetX: c.offsetX + 130 / c.cellSize })],
  ])('re-resolves the indicator against a camera panned on the %s axis, with no further pointermove', (_axis, pan) => {
    const { container, rerenderWith } = renderGrid()
    const grid = gridContentEl(container)

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 30 })
    const before = hoverIndicator(container)!.style.transform

    const pannedCamera = pan(CAMERA)
    rerenderWith({ camera: pannedCamera })

    const indicator = hoverIndicator(container)!
    const expected = screenToWorld(pannedCamera, 20, 30)
    expect(indicator.style.transform).toBe(expectedTransform(pannedCamera, expected.x, expected.y))
    expect(indicator.style.transform).not.toBe(before)
  })

  // THE MID-DRAG ROUTE, which is the half of this corrective that the wheel
  // tests above cannot reach. Once a drag crosses the pan threshold,
  // useGridPointerGestures stops calling onHover and reports raw pixels
  // through onPointerPosition instead (see that hook's own handlePointerMove
  // comment); Grid stashes them in lastPointerPixelsRef WITHOUT resolving a
  // cell, and the camera-change effect is what resolves them. So nothing
  // observable happens until a camera change arrives -- which is precisely
  // why an empty onPointerPosition body went unnoticed: measured on this
  // tree, deleting that callback's body entirely leaves all 636 tests green.
  //
  // The drag route is also the one architect's ADJUDICATE pass found broken
  // AND passing by luck at Playwright's default pointermove granularity, so a
  // unit-level pin on it is the specific thing that was missing.
  it('tracks the pointer through a drag-pan, resolving the indicator at the LATEST drag pixels', () => {
    const { container, rerenderWith } = renderGrid()
    const grid = gridContentEl(container)

    // Establish a hover position first, so a regression that ignores the
    // mid-drag updates resolves against THIS stale point rather than nothing.
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 30 })
    const staleTransform = hoverIndicator(container)!.style.transform

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 20, clientY: 30 })
    const draggedToX = 20 + DRAG_THRESHOLD_PX + 100
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: draggedToX, clientY: 30 })

    // The parent applying the pan the drag just requested -- the only way a
    // camera change reaches this component, drag or otherwise.
    const pannedCamera: Camera = { ...CAMERA, offsetX: CAMERA.offsetX + 60 / CAMERA.cellSize }
    rerenderWith({ camera: pannedCamera })

    const indicator = hoverIndicator(container)!
    const expected = screenToWorld(pannedCamera, draggedToX, 30)
    expect(indicator.style.transform).toBe(expectedTransform(pannedCamera, expected.x, expected.y))
    expect(indicator.style.transform).not.toBe(staleTransform)
  })

  it('stays cleared across a camera change once the pointer has left the grid, rather than resurrecting a stale position', () => {
    const { container, rerenderWith } = renderGrid()
    const grid = gridContentEl(container)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 30 })
    fireEvent.pointerLeave(grid)
    expect(hoverIndicator(container)).toBeNull()

    rerenderWith({ camera: { ...CAMERA, offsetY: CAMERA.offsetY + 130 / CAMERA.cellSize } })

    expect(hoverIndicator(container)).toBeNull()
  })
})

// This is the slice's named deliverable: proof that a pan that stays within
// the current tile range re-renders no cell at all (the whole point of the
// tile-range layer -- see useCellTiles.ts/cellTiles.ts and
// liveCellWindow.ts's own header). The old probe here (spying on
// store.getCellSnapshot, called by every mounted Cell's own useLiveCell
// subscription) was retired along with that subscription at this slice's
// step 4 -- Cell now takes isAlive as a plain prop instead (see Cell.tsx's
// header). The method itself is gone as of this slice's REVIEW pass, along
// with the rest of the per-cell channel, so there is nothing left to watch
// even by mistake. The successor probe is
// vi.mocked(Cell) (see the vi.mock('./Cell', { spy: true }) call at the top
// of this file) -- a direct per-Cell render-call counter, the literal
// successor of what getCellSnapshot's call count used to stand in for.
//
// The mechanism this now rests on: Grid computes `cells` via
// liveCellsInRange(liveCells, tiles.range, gridFocus.focus) as a plain
// expression, which React Compiler memoizes on those three inputs (see
// Grid.tsx's own comment at that call site). A within-range pan touches none
// of them -- tiles.range holds by nextTileRange's own by-reference contract,
// liveCells and gridFocus.focus are untouched -- so `cells` keeps the exact
// same array reference, <GridCells cells={cells} .../> is itself
// compiler-memoized on unchanged props, and the whole subtree bails before
// GridCells' own body (let alone any <Cell>) runs again.
//
// The fixture is deliberately small: WIDTH x HEIGHT (40x40px) at cellSize 20
// is a 2x2-cell viewport, and TILE_SPAN_CELLS (4) means that viewport sits
// entirely inside a single tile -- so a pan of a couple of cells can stay
// within range. The default store is empty, so exactly one cell mounts
// throughout this describe: the focus cursor at (0, 0) (liveCellWindow.ts's
// own +1 guarantee) -- see the "measurement wiring" describe above for the
// same derivation.
//
// IF THE ZERO-CALLS TEST BELOW FAILS AND YOU DID NOT TOUCH TILING, the first
// thing to check is the *declaration form* of activateCell in Grid.tsx -- see
// its comment there. As a hoisted `function` declaration referenced from the
// onTap closure, React Compiler leaves it unmemoized, GridCells gets a new
// onActivateCell identity every render, and every cell re-renders on every
// pan even though every tile-derived prop is unchanged. That defeats the
// whole slice while every other test in the suite stays green, and the
// failure here reads as a call count (0 or 1 in this fixture, tens of
// thousands in the real app) rather than as a cause. An ast-grep rule was
// considered for this and rejected: "declared as a const arrow before its
// first use" is not something a structural matcher expresses, and this
// assertion already discriminates the exact regression in a plain npm test
// run.
//
// STRIP-EVENT SUB-DESCRIBE, RETIRED HERE, NOT REPLACED IN KIND: the
// pre-step-4 renderer's O(entering) proof (144/192/48 tile-slot counts) and
// its companion subscription-leak test pinned per-tile-slot mounting and
// per-cell subscribeCell -- both mechanisms this slice deletes outright
// (CellTile.tsx is gone; Cell no longer subscribes). Their successor
// property is the mounted-count guard in GridCells.test.tsx (|live ∩
// window| + focus, exercised through the real liveCellsInRange pipeline) plus
// liveCellWindow.test.ts's own culling pins (lines 32/46 there exclude a
// live cell on either axis outside the window) -- both already prove "only
// what should mount, mounts" without needing a tile-boundary crossing at
// all, since mounting no longer has a tile-shaped unit to cross a boundary
// of.
describe('tile pan-stability', () => {
  // Skipped under Stryker for the same reason useLiveCell.test.ts used to
  // skip its resubscription test: Stryker's per-expression instrumentation
  // of Grid.tsx/GridCells.tsx defeats React Compiler's memoization, so a
  // mutated build re-renders Cell on every pan and this assertion fails in
  // Stryker's dry run, before a single mutant executes -- npm run
  // test:mutation never starts. The non-vacuous companion just below asserts
  // the opposite (that a real render-worthy change *does* call Cell again),
  // which holds regardless of whether memoization survives instrumentation,
  // so it stays unskipped and still exercises this describe's setup under
  // mutation testing.
  it.skipIf(underStryker)('a pan that stays within the current tile range re-renders zero cells', () => {
    const store = createLiveCellStore()
    const { container, rerenderWith } = renderGrid({ store })
    // The comments and pans below are argued in terms of a WIDTH x HEIGHT
    // (40x40px, a 2x2-cell) viewport, so measure one before asserting
    // anything -- otherwise this render stays at the pre-measurement {0, 0}
    // containerSize (see "measurement wiring" above) and the assertions
    // below would describe a viewport the component was never actually
    // given. It's a same-tile result either way here (coveringTileRange
    // collapses to tile 0 at both sizes, since a 2-cell or a 0-cell window
    // both fit inside one 4-cell-span tile), which is exactly why this went
    // unnoticed -- but the fixture should still be the one the assertions
    // describe.
    triggerResize(WIDTH, HEIGHT)
    const beforeCell = screen.getByRole('button', { name: 'Cell 0, 0' })
    // children[1], not firstElementChild -- see the same note above.
    const layerDiv = gridContentEl(container).children[1] as HTMLElement
    const transformBefore = layerDiv.style.transform
    const classNameBefore = layerDiv.className

    vi.mocked(Cell).mockClear()

    // 0 -> 1: the viewport shifts from world-x [0, 2] to [1, 3], still
    // entirely inside tile 0 (world cells [0, 4)), confirmed just below
    // rather than assumed, so useCellTiles keeps the exact same TileRange
    // object and liveCellsInRange's own `range` input is unchanged.
    const withinRangePan: Camera = { ...CAMERA, offsetX: CAMERA.offsetX + 1 }
    const originalRange = coveringTileRange(CAMERA, WIDTH, HEIGHT, TILE_SPAN_CELLS)
    const requiredRange = coveringTileRange(withinRangePan, WIDTH, HEIGHT, TILE_SPAN_CELLS)
    expect(nextTileRange(originalRange, withinRangePan, WIDTH, HEIGHT)).toBe(originalRange)
    expect(requiredRange).toEqual(originalRange)

    rerenderWith({ camera: withinRangePan })

    expect(Cell).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cell 0, 0' })).toBe(beforeCell)
    expect(layerDiv.className).toBe(classNameBefore)
    expect(layerDiv.style.transform).not.toBe(transformBefore)
  })

  // Non-vacuous companion, unskipped: proves this harness (the vi.mock spy,
  // the assertion shape) really can observe a Cell render at all --
  // independent of whether React Compiler's memoization (what the skipped
  // test above actually measures) survives Stryker's instrumentation, so the
  // skip above doesn't remove all signal for this describe under mutation
  // testing. A store mutation on the one mounted cell, not a "crossing" pan:
  // liveCellsInRange's `range` input no longer has a tile-shaped mounting
  // unit to cross the boundary of (see the retirement note above this
  // describe), but a toggle changes that cell's own isAlive value, a genuine
  // prop change no memoization can bail out of -- this holds with or without
  // compiler memoization intact.
  it('a store mutation on the mounted cell does re-render Cell (the guard above is not vacuous)', () => {
    const store = createLiveCellStore()
    renderGrid({ store })
    triggerResize(WIDTH, HEIGHT)

    vi.mocked(Cell).mockClear()

    act(() => store.toggle(0, 0))

    expect(Cell).toHaveBeenCalled()
  })
})

// The keyboard half of the roving-tabindex focus cursor: Grid owns the
// keydown -> gridFocus translation (ARROW_KEY_DIRECTIONS plus the Home/End
// branch), while useGridFocus owns what a move then does. These assert the
// translation through the real hook rather than a mock, because the wiring
// is exactly what a mock would assume rather than prove.
//
// The cursor is read off document.activeElement, which is the roving
// tabindex's own observable: useGridFocus deliberately does NOT take DOM
// focus on mount or on its one-shot recenter, and does take it on every
// keyboard move, so a label is readable only after a key has been pressed.
// That is why each test primes the cursor with a pointer tap first -- a tap
// sets the cursor without touching DOM focus (see Grid's onTap comment), so
// priming this way pins the tap -> setFocus half of "one current cell shared
// by both routes" at the same time, rather than needing the pre-tap cursor's
// coordinates restated here as geometry.
describe('keyboard focus-cursor wiring', () => {
  // The cell a tap at TAP_PX resolves to under CAMERA -- the same
  // screenToWorld the pointer-surface describe above asserts against.
  //
  // SELF-RETIRED CONSTRAINT, LEFT AS-IS RATHER THAN SIMPLIFIED: this used to
  // be chosen so all four of its neighbours were mounted, because the
  // pre-step-4 renderer mounted one Cell per tile slot and a cursor moved
  // outside the covering tile range had no element for useGridFocus's
  // DOM-sync effect to focus (focusedCellLabel would throw). Since step 4,
  // liveCellWindow.ts's own +1 guarantee mounts the focus cursor's cell
  // unconditionally -- in range or not, alive or not -- so that constraint no
  // longer applies to ANY tap point, and TAP_PX could now be chosen
  // anywhere. Verified unchanged rather than "simplified for tidiness": this
  // whole describe was run against the flipped renderer with no edits below
  // this comment, and it passed as-is (see this slice's step-4 handoff).
  const TAP_PX = { clientX: 30, clientY: 30 }
  const TAPPED = screenToWorld(CAMERA, TAP_PX.clientX, TAP_PX.clientY)

  function focusedCellLabel(): string {
    const label = document.activeElement?.getAttribute('aria-label')
    if (!label) throw new Error('expected the roving tabindex to have moved DOM focus onto a cell')
    return label
  }

  function renderMeasuredGrid(props: Partial<GridProps> = {}) {
    const utils = renderGrid(props)
    // Real measurement first: useGridFocus's one-shot latch recenters the
    // cursor off centeredCamera(w, h) when the first size arrives, and a
    // latch firing midway through a test would move the cursor under it.
    triggerResize(WIDTH, HEIGHT)
    return utils
  }

  function tapToPrimeCursor(grid: HTMLElement) {
    fireEvent.pointerDown(grid, { pointerId: 1, ...TAP_PX })
    fireEvent.pointerUp(grid, { pointerId: 1, ...TAP_PX })
  }

  // One case per key rather than one test over a table: each
  // `ArrowLeft: 'left'` entry is its own StringLiteral mutant, and a mutant
  // that blanks a single direction is killed only by that direction's own
  // assertion.
  it.each([
    ['ArrowLeft', -1, 0],
    ['ArrowRight', 1, 0],
    ['ArrowUp', 0, -1],
    ['ArrowDown', 0, 1],
  ])('%s moves the focus cursor exactly one cell from where it was', (key, dx, dy) => {
    const { container } = renderMeasuredGrid()
    const grid = gridContentEl(container)
    tapToPrimeCursor(grid)

    fireEvent.keyDown(grid, { key })

    expect(focusedCellLabel()).toBe(`Cell ${TAPPED.x + dx}, ${TAPPED.y + dy}`)
  })

  it.each([
    ['Home', 'minX' as const],
    ['End', 'maxX' as const],
  ])('%s jumps the cursor along its own row to the on-screen edge', (key, edge) => {
    const { container } = renderMeasuredGrid()
    const grid = gridContentEl(container)
    tapToPrimeCursor(grid)
    const onScreen = computeOnScreenRange(CAMERA, WIDTH, HEIGHT)

    fireEvent.keyDown(grid, { key })

    expect(focusedCellLabel()).toBe(`Cell ${onScreen[edge]}, ${TAPPED.y}`)
  })

  // Home and End must differ from each other, which the two cases above
  // cannot show on their own: a mutant collapsing both onto the same edge
  // satisfies each of them separately whenever minX and maxX are compared
  // against independently-computed expectations.
  it('Home and End land on opposite edges of the row', () => {
    const { container } = renderMeasuredGrid()
    const grid = gridContentEl(container)
    tapToPrimeCursor(grid)

    fireEvent.keyDown(grid, { key: 'Home' })
    const home = focusedCellLabel()
    fireEvent.keyDown(grid, { key: 'End' })

    expect(focusedCellLabel()).not.toBe(home)
  })

  // fireEvent returns false exactly when a handler called preventDefault, so
  // this pins the six keys Grid claims to consume -- and, in the other
  // direction, that every other key passes through untouched, which is what
  // leaves native Tab/Shift+Tab sequential navigation working.
  it.each(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])(
    'consumes %s, preventing the browser default',
    (key) => {
      const { container } = renderMeasuredGrid()
      expect(fireEvent.keyDown(gridContentEl(container), { key })).toBe(false)
    },
  )

  it.each(['Tab', 'Enter', ' ', 'PageDown', 'a'])('lets %s through untouched, moving no cursor', (key) => {
    const { container } = renderMeasuredGrid()
    const grid = gridContentEl(container)
    tapToPrimeCursor(grid)
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    const before = focusedCellLabel()

    expect(fireEvent.keyDown(grid, { key })).toBe(true)

    expect(focusedCellLabel()).toBe(before)
  })

  // The tap -> setFocus wiring on its own terms. Every test above primes with
  // a tap, so each of them would also fail if setFocus were dropped -- but
  // only by landing on the *centered* cursor's neighbour instead, which is a
  // coordinate none of them names. This states the difference directly.
  it('steps from the tapped cell rather than from the cursor the tap should have replaced', () => {
    const withoutTap = renderMeasuredGrid()
    fireEvent.keyDown(gridContentEl(withoutTap.container), { key: 'ArrowRight' })
    const fromCentered = focusedCellLabel()
    withoutTap.unmount()

    const withTap = renderMeasuredGrid()
    const grid = gridContentEl(withTap.container)
    tapToPrimeCursor(grid)
    fireEvent.keyDown(grid, { key: 'ArrowRight' })

    expect(focusedCellLabel()).toBe(`Cell ${TAPPED.x + 1}, ${TAPPED.y}`)
    expect(focusedCellLabel()).not.toBe(fromCentered)
  })
})
