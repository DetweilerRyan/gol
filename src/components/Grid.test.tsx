import { fireEvent, render, screen, type RenderResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CELL_SIZE, screenToWorld, worldToScreen, type Camera } from '../camera'
import { anchorOffsetPx, computeAnchor } from '../cellAnchor'
import {
  coveringTileRange,
  enteringStripCellCount,
  nextTileRange,
  TILE_SPAN_CELLS,
  tileRangeCellCount,
} from '../cellTiles'
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
import Grid, { GRID_CONTENT_ID } from './Grid'

// Grid itself composes useElementSize (ResizeObserver), useWheelInput,
// useGridPointerGestures (both getBoundingClientRect/pointer capture), and
// useCellTiles -- each of those has its own focused test for the API wiring
// or math itself. What's left here is the composition: the DOM layering
// contract (including that #grid-content itself never carries a transform,
// since useGridPointerGestures/useWheelInput both read its
// getBoundingClientRect), the place-vs-toggle dispatch, one thin wiring test
// per hook proving Grid actually connects its handlers rather than testing
// the handlers' own logic again, and the "tile pan-stability" pair proving a
// pan that stays within the current tile range skips cell re-renders while a
// pan that crosses a tile boundary still triggers them (the guard isn't
// vacuous). See src/test-support/domStubs.ts for why each stub is needed.
// Pointer capture is stubbed (unused beyond that) purely so jsdom doesn't
// throw when a pointerdown-driven test calls setPointerCapture -- its own
// release-guard behavior is useGridPointerGestures.test.tsx's job.
//
// underStryker gates two tests in the "tile pan-stability" describe below --
// see each site's own comment for why. globalThis.__stryker__ is set at module load
// by any instrumented file's own bootstrap, before test collection, so it
// reliably distinguishes a mutation-testing run from a normal one (see
// useLiveCell.test.ts for the precedent).
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
    // be earliest in the DOM to stay furthest back, behind every mounted
    // Cell's own opaque border/background. See GridLines.tsx's own header.
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
  it('renders a small cell grid immediately on mount, before any ResizeObserver callback fires', () => {
    // Exercises the initial containerSize state ({ width: 0, height: 0 }), not
    // just the post-resize value -- useCellTiles/coveringTileRange still
    // produce a finite covering range from that default (a 0x0 viewport's
    // covering set collapses to a single tile, the one containing cell (0, 0)
    // -- see coveringTileRange's own "never inverts for a 0x0 pre-measurement
    // viewport" test in cellTiles.test.ts).
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
      shiftKey: false,
    })
  })

  it('reports screenToWorld(camera, ...) coordinates via onPreviewCell on pointermove while a pattern is armed', () => {
    const onPreviewCell = vi.fn()
    const { container } = renderGrid({ onPreviewCell, isPatternArmed: true })
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

// This is the slice's named deliverable: proof that a pan that stays within
// the current tile range re-renders no cell at all (the whole point of the
// tile-range layer -- see useCellTiles.ts/cellTiles.ts), paired with proof
// that the guard isn't vacuous -- a pan large enough to cross a tile boundary
// and force a range rebuild *does* re-render. getCellSnapshot is the right
// probe: useSyncExternalStore (inside useLiveCell, which every Cell calls)
// invokes it on every render of every Cell, so its call count is a direct
// per-cell render counter, cheaper and more direct than counting DOM
// mutations.
//
// The fixture is deliberately small: WIDTH x HEIGHT (40x40px) at cellSize 20
// is a 2x2-cell viewport, and TILE_SPAN_CELLS (4) means that viewport sits
// entirely inside a single tile -- so a pan of a couple of cells can stay
// within range, and a pan of TILE_SPAN_CELLS cells is guaranteed to cross a
// tile boundary.
//
// IF THE ZERO-CALLS TEST BELOW FAILS AND YOU DID NOT TOUCH TILING, the first
// thing to check is the *declaration form* of activateCell in Grid.tsx -- see
// its comment there. As a hoisted `function` declaration referenced from the
// onTap closure, React Compiler leaves it unmemoized, GridCells gets a new
// onActivateCell identity every render, and every cell re-renders on every
// pan even though every tile-derived prop is unchanged. That defeats the
// whole slice while every other test in the suite stays green, and the
// failure here reads as a call count (~16 in this fixture, ~34k in the real
// app) rather than as a cause. An ast-grep rule was considered for this and
// rejected: "declared as a const arrow before its first use" is not something
// a structural matcher expresses, and this assertion already discriminates
// the exact regression in a plain npm test run.
describe('tile pan-stability', () => {
  // The zero-calls half below is skipped under Stryker for the same reason
  // useLiveCell.test.ts skips its resubscription test (see that file's
  // comment on underStryker): Stryker's per-expression instrumentation of
  // Grid.tsx defeats React Compiler's memoization of activateCell (see
  // Grid.tsx's comment on activateCell), so every mutated build of this file
  // re-renders every cell on every pan and this assertion fails in Stryker's
  // dry run, before a single mutant executes -- npm run test:mutation never
  // starts. The non-vacuous half just below asserts the opposite (that calls
  // *do* happen), which holds regardless of whether the memoization survives
  // instrumentation, so it stays unskipped and still exercises this
  // describe's setup under mutation testing.
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

    const spy = vi.spyOn(store, 'getCellSnapshot')
    spy.mockClear()

    // 0 -> 1: the viewport shifts from world-x [0, 2] to [1, 3], still
    // entirely inside tile 0 (world cells [0, 4)), confirmed just below
    // rather than assumed, so useCellTiles keeps the exact same TileRange
    // object and every mounted CellTile keeps identical props -- only the
    // fractional pixel offset the transformed layer div applies changes.
    const withinRangePan: Camera = { ...CAMERA, offsetX: CAMERA.offsetX + 1 }
    const originalRange = coveringTileRange(CAMERA, WIDTH, HEIGHT, TILE_SPAN_CELLS)
    const requiredRange = coveringTileRange(withinRangePan, WIDTH, HEIGHT, TILE_SPAN_CELLS)
    expect(nextTileRange(originalRange, withinRangePan, WIDTH, HEIGHT)).toBe(originalRange)
    expect(requiredRange).toEqual(originalRange)

    rerenderWith({ camera: withinRangePan })

    expect(spy).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cell 0, 0' })).toBe(beforeCell)
    expect(layerDiv.className).toBe(classNameBefore)
    expect(layerDiv.style.transform).not.toBe(transformBefore)
  })

  it('a pan that crosses a tile boundary does re-render cells (the guard above is not vacuous)', () => {
    const store = createLiveCellStore()
    const { rerenderWith } = renderGrid({ store })
    // See the same-named comment in the test above: measure the WIDTH x
    // HEIGHT viewport these assertions are argued against before panning.
    triggerResize(WIDTH, HEIGHT)

    const spy = vi.spyOn(store, 'getCellSnapshot')
    spy.mockClear()

    // 0 -> 4: the viewport shifts from world-x [0, 2] to [4, 6], crossing
    // clean out of tile 0 into tile 1, confirmed just below rather than
    // assumed, so the range rebuilds and every mounted tile's identity
    // changes.
    const crossingPan: Camera = { ...CAMERA, offsetX: CAMERA.offsetX + 4 }
    const originalRange = coveringTileRange(CAMERA, WIDTH, HEIGHT, TILE_SPAN_CELLS)
    expect(nextTileRange(originalRange, crossingPan, WIDTH, HEIGHT)).not.toBe(originalRange)

    rerenderWith({ camera: crossingPan })

    expect(spy).toHaveBeenCalled()
  })

  // Step 5b's deliverable, and a DIFFERENT mechanism from the zero-calls test
  // above -- conflating the two is the way to ship this step looking green
  // while proving nothing (see the design's "the two bailout mechanisms are
  // different" section):
  //
  //   (A) within-range pan (above): GridCells' own props are unchanged, so
  //       React Compiler's memo on Grid's <GridCells> element means
  //       GridCells never runs at all.
  //   (B) strip event (here): GridCells DOES run, and creates a fresh
  //       <CellTile> element for every tile in the new range -- including
  //       retained ones. A retained tile's own body still runs, but hits
  //       React Compiler's memoization of THAT call (same props in, so the
  //       same children element out), and React bails below it without
  //       calling useLiveCell/getCellSnapshot again. Only an ENTERING
  //       tile's Cells are genuinely new function calls.
  //
  // The 40x40 fixture used everywhere else in this file can't discriminate
  // (B): at that size the covering range is a single tile, so "entering"
  // and "everything" are the same set and a call-count assertion would pass
  // even with no per-tile memoization at all. This needs a fixture spanning
  // multiple tiles per axis, with at least one tile that's RETAINED across
  // the pan, so "only the entering strip mounted" is actually falsifiable.
  describe('a strip event mounts only the entering strip (the O(entering) proof)', () => {
    // 160x160px at cellSize 20 = 8x8 cells (2 x TILE_SPAN_CELLS). An offset
    // that's a MULTIPLE of TILE_SPAN_CELLS -- like the module CAMERA
    // constant's 0 -- aligns that window exactly to 2 whole tiles per axis,
    // with no partially-covered tile at either edge, and panning by exactly
    // one tile span then evicts and admits a whole tile with nothing
    // retained in between. offsetX/offsetY -2 is NOT a multiple of 4, so the
    // same 8-cell window instead straddles 3 tile boundaries per axis
    // (confirmed below, not assumed) -- a 3x3, 144-cell covering range with
    // room for a genuinely RETAINED middle tile column as well as an
    // entering edge one.
    const STRIP_WIDTH = 160
    const STRIP_HEIGHT = 160
    const STRIP_CAMERA: Camera = { offsetX: -2, offsetY: -2, cellSize: DEFAULT_CELL_SIZE }

    it.skipIf(underStryker)(
      'a pan crossing one tile boundary mounts exactly the 48-cell entering column, not the 144-cell viewport',
      () => {
        const store = createLiveCellStore()
        const { rerenderWith } = renderGrid({ store, camera: STRIP_CAMERA })
        // Grid measures its own container via ResizeObserver (useElementSize),
        // not from stubBoundingClientRect -- it renders at containerSize
        // {0, 0} until an observer callback fires (see "measurement wiring"
        // above), and a 0x0 viewport collapses to a single tile regardless of
        // STRIP_WIDTH/STRIP_HEIGHT. Trigger it explicitly so the covering
        // range actually reflects the fixture size before the pan under test.
        triggerResize(STRIP_WIDTH, STRIP_HEIGHT)

        // Confirmed, not assumed: the starting range really is 3x3 tiles /
        // 144 cells, the pan really does force a rebuild, and the rebuilt
        // range's entering column really is 48 cells -- see cellTiles.ts's
        // own table-driven test for these same figures pinned against the
        // design. The REBUILT total is 192, not 144: nextTileRange retains
        // the evicted tile column for one more crossing (EVICT_LAG_TILES),
        // so this rebuild is admission-only -- 144 retained + 48 entering,
        // nothing evicted yet. The entering strip itself is unaffected by
        // that (still exactly 48), which is the O(entering) claim this test
        // actually exists to prove.
        const before = coveringTileRange(STRIP_CAMERA, STRIP_WIDTH, STRIP_HEIGHT, TILE_SPAN_CELLS)
        expect(tileRangeCellCount(before)).toBe(144)

        const crossingPan: Camera = { ...STRIP_CAMERA, offsetX: STRIP_CAMERA.offsetX + TILE_SPAN_CELLS }
        const after = nextTileRange(before, crossingPan, STRIP_WIDTH, STRIP_HEIGHT)
        expect(after).not.toBe(before)
        expect(tileRangeCellCount(after)).toBe(192)
        expect(enteringStripCellCount(after, 'x')).toBe(48)

        const spy = vi.spyOn(store, 'getCellSnapshot')
        spy.mockClear()

        rerenderWith({ camera: crossingPan })

        // Distinct keys, not raw call count: mounting calls getCellSnapshot
        // during render and again after subscribe (useSyncExternalStore's
        // own consistency check), so an exact call count is brittle.
        const distinctCells = new Set(spy.mock.calls.map((call) => call[0]))
        expect(distinctCells.size).toBe(48)
      },
    )

    // The EVICTION half of a strip event, which neither test above can see:
    // an unmounting Cell must release its store subscription, or a long pan
    // leaks one bucket per evicted cell for the life of the session --
    // invisible to every rendering assertion in this file, and unbounded.
    // liveCellStore.property.test.ts proves the store releases correctly when
    // it is asked to; this is what proves the tile layer actually asks.
    //
    // Crosses TWO tile boundaries rather than one, deliberately: the FIRST
    // crossing (see the test above) retains the old column as an
    // EVICT_LAG_TILES lag tile rather than evicting it, so 144 -> 192 there
    // is admission with nothing evicted, and a single-crossing assertion of
    // "still 192" couldn't tell a correctly-bounded range from a genuine
    // leak (a leak also reads 192 after one crossing, since nothing has been
    // evicted yet either way). The SECOND crossing is where the lag tile
    // from the first finally gets evicted (spent trailing tolerance -- see
    // useCellTiles.test.ts's "CONTINUING pan" test) while a fresh tile
    // enters, so it's the first point a leak and a correct implementation
    // diverge: bounded stays at 192 (48 evicted, 48 entered), a leak grows
    // to 240 (48 entered, nothing released) and keeps growing every further
    // tile crossed. Boundedness across repeated crossings, not a single
    // count, is what actually discriminates a leak here.
    it('an evicted tile releases its cell subscriptions rather than leaking them, across repeated crossings', () => {
      const store = createLiveCellStore()
      const { rerenderWith } = renderGrid({ store, camera: STRIP_CAMERA })
      triggerResize(STRIP_WIDTH, STRIP_HEIGHT)

      // One bucket per mounted cell, across the 3x3 tile range.
      expect(store.trackedCellCount()).toBe(144)

      const firstCrossing: Camera = { ...STRIP_CAMERA, offsetX: STRIP_CAMERA.offsetX + TILE_SPAN_CELLS }
      rerenderWith({ camera: firstCrossing })

      // 144 retained + 48 entering, nothing evicted yet (EVICT_LAG_TILES
      // retains the old column for one more crossing): 192.
      expect(store.trackedCellCount()).toBe(192)

      const secondCrossing: Camera = { ...STRIP_CAMERA, offsetX: STRIP_CAMERA.offsetX + 2 * TILE_SPAN_CELLS }
      rerenderWith({ camera: secondCrossing })

      // 144 retained + 48 entering, with the 48 from the first crossing's
      // lag tile now evicted: back to 192, not 240. A leak reads 240 here
      // and keeps growing by 48 on every further tile crossed.
      expect(store.trackedCellCount()).toBe(192)
    })

    // Non-vacuous companion, unskipped: proves this strip scenario really
    // does reach getCellSnapshot at all -- independent of whether React
    // Compiler's per-tile memoization (what the skipped test above actually
    // measures) survives Stryker's instrumentation -- so the skip above
    // doesn't remove all signal for this describe under mutation testing.
    it('a pan crossing one tile boundary does call getCellSnapshot (the skipped assertion above is not vacuous)', () => {
      const store = createLiveCellStore()
      const { rerenderWith } = renderGrid({ store, camera: STRIP_CAMERA })
      triggerResize(STRIP_WIDTH, STRIP_HEIGHT)

      const spy = vi.spyOn(store, 'getCellSnapshot')
      spy.mockClear()

      const crossingPan: Camera = { ...STRIP_CAMERA, offsetX: STRIP_CAMERA.offsetX + TILE_SPAN_CELLS }
      rerenderWith({ camera: crossingPan })

      expect(spy).toHaveBeenCalled()
    })
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
  // screenToWorld the pointer-surface describe above asserts against. Chosen
  // so all four of its neighbours are mounted: this describe runs against the
  // PRE-step-4 renderer, which still mounts one Cell per tile slot, so a
  // cursor moved outside the covering tile range has no element for
  // useGridFocus's DOM-sync effect to focus and focusedCellLabel would throw.
  // (Once the live-cell projection lands, liveCellWindow always includes the
  // focus cell and that constraint disappears.)
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
