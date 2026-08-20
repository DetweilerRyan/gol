import { fireEvent, render, screen, waitFor, type RenderResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cellKey,
  computeContentBounds,
  patternCellPositions,
  PATTERNS,
  type LiveCells,
  type Pattern,
} from '../gameOfLife'
import {
  applyWheelInput,
  centeredCamera,
  computeMajorGridlines,
  computeScrollbarMetrics,
  computeThumbGeometry,
  computeVisibleRange,
  DEFAULT_CELL_SIZE,
  panCamera,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
  zoomPercentage,
  ZOOM_FACTOR,
  type Camera,
} from '../viewport'
import {
  stubBoundingClientRect,
  stubPointerCapture,
  stubResizeObserver,
  type PointerCaptureStubs,
  type ResizeObserverController,
} from '../test-support/domStubs'
import Grid from './Grid'

// Grid composes three hooks that each touch a browser API jsdom doesn't
// usefully provide -- useElementSize (ResizeObserver), useWheelInput and
// pointerToWorldCell (getBoundingClientRect), and its own pan handlers
// (pointer capture). Each hook has its own focused test for the API wiring
// itself; these stubs are here so Grid can be exercised as the composition it
// is. See src/test-support/domStubs.ts for why each is needed.
let resizeObserver: ResizeObserverController
let pointerCapture: PointerCaptureStubs

beforeEach(() => {
  resizeObserver = stubResizeObserver()
  stubBoundingClientRect({ left: 0, top: 0, width: WIDTH, height: HEIGHT })
  pointerCapture = stubPointerCapture()
})

const WIDTH = 800
const HEIGHT = 600

function triggerResize(width: number, height: number) {
  resizeObserver.resize(width, height)
}

type GridProps = React.ComponentProps<typeof Grid>

function renderGrid(props: Partial<GridProps> = {}): RenderResult & GridProps {
  const merged: GridProps = {
    liveCells: new Set<string>() as LiveCells,
    onToggleCell: vi.fn(),
    onPlacePattern: vi.fn(),
    onSuppressEnterChange: vi.fn(),
    ...props,
  }
  const utils = render(<Grid {...merged} />)
  return { ...utils, ...merged }
}

function gridContentEl(container: HTMLElement): HTMLElement {
  const el = container.querySelector('#grid-content')
  if (!el) throw new Error('#grid-content not found')
  return el as HTMLElement
}

function rootEl(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement
}

function cellTransform(x: number, y: number): string {
  return screen.getByRole('button', { name: `Cell ${x}, ${y}` }).style.transform
}

function expectedTransform(camera: Camera, x: number, y: number): string {
  const { x: left, y: top } = worldToScreen(camera, x, y)
  return `translate(${left}px, ${top}px)`
}

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern

function openPatternModal() {
  fireEvent.click(screen.getByRole('button', { name: 'Open pattern library' }))
}

function selectPattern(pattern: Pattern) {
  fireEvent.click(screen.getByRole('button', { name: pattern.name }))
}

// Headless UI's Dialog stays mounted through its leave transition after a
// pattern is selected, and treats a pointerdown landing outside it during that
// window as a dismiss -- which runs onClose and disarms the pattern. Tests that
// drive pointer events at the grid right after selecting must wait this out
// first, or they'd be exercising idle mode instead of placing mode.
async function waitForModalToUnmount() {
  await waitFor(() => expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument())
}

function previewLabels(): string[] {
  return [...document.querySelectorAll('[aria-label^="Pattern preview cell"]')].map(
    (el) => el.getAttribute('aria-label') as string,
  )
}

// Shared by the drag-threshold boundary tests: a pointerdown followed by a single pointermove
// that doesn't (or just barely doesn't) cross DRAG_THRESHOLD_PX still resolves as a toggle-click
// at the pointerup coordinates, not a pan.
function expectPointerMoveStillTogglesAtPointerUp(
  pointerId: number,
  downX: number,
  downY: number,
  moveX: number,
  moveY: number,
) {
  const onToggleCell = vi.fn()
  const { container } = renderGrid({ onToggleCell })
  triggerResize(WIDTH, HEIGHT)
  const grid = gridContentEl(container)
  const camera = centeredCamera(WIDTH, HEIGHT)

  fireEvent.pointerDown(grid, { pointerId, clientX: downX, clientY: downY })
  fireEvent.pointerMove(grid, { pointerId, clientX: moveX, clientY: moveY })
  fireEvent.pointerUp(grid, { pointerId, clientX: moveX, clientY: moveY })

  const expected = screenToWorld(camera, moveX, moveY)
  expect(onToggleCell).toHaveBeenCalledWith(expected.x, expected.y)
}

describe('Grid cell rendering', () => {
  it('renders alive cells with the live style and dead cells with the dead style, aria-labeled "Cell x, y"', () => {
    const liveCells = new Set([cellKey(0, 0)]) as LiveCells
    renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)

    const alive = screen.getByRole('button', { name: 'Cell 0, 0' })
    expect(alive.className).toContain('bg-gray-900')
    expect(alive.style.boxSizing).toBe('border-box')

    const dead = screen.getByRole('button', { name: 'Cell 1, 0' })
    expect(dead.className).toContain('bg-white')
  })

  it('renders negative-coordinate cells with the same aria-label format', () => {
    renderGrid()
    triggerResize(WIDTH, HEIGHT)
    expect(screen.getByRole('button', { name: 'Cell -3, -2' })).toBeInTheDocument()
  })

  it('renders a small cell grid immediately on mount, before any ResizeObserver callback fires', () => {
    // Exercises the initial containerSize state ({ width: 0, height: 0 }), not just the
    // post-resize value -- computeVisibleRange/cellsInRange still produce a finite (if tiny)
    // range from that default, centered on the default (uncentered) camera's origin.
    renderGrid()
    expect(screen.getByRole('button', { name: 'Cell 0, 0' })).toBeInTheDocument()
  })

  it('adds major-gridline border classes only to cells on a multiple-of-10 x or y coordinate', () => {
    renderGrid()
    triggerResize(WIDTH, HEIGHT)

    const onMajorX = screen.getByRole('button', { name: 'Cell 10, 1' })
    expect(onMajorX.className).toContain('border-l-2 border-l-gray-400')
    expect(onMajorX.className).not.toContain('border-t-2 border-t-gray-400')

    const onMajorY = screen.getByRole('button', { name: 'Cell 1, 10' })
    expect(onMajorY.className).toContain('border-t-2 border-t-gray-400')
    expect(onMajorY.className).not.toContain('border-l-2 border-l-gray-400')

    const onNeither = screen.getByRole('button', { name: 'Cell 1, 1' })
    expect(onNeither.className).not.toContain('border-l-2 border-l-gray-400')
    expect(onNeither.className).not.toContain('border-t-2 border-t-gray-400')
    // Pins down the exact class list (not just the absence of the gridline classes above), so a
    // mutation that swaps either '' fallback for stray literal text is still caught even though
    // that text isn't one of the specific substrings checked above.
    expect(onNeither.className.split(/\s+/).filter(Boolean)).toEqual(
      'absolute top-0 left-0 border border-gray-200 transition-colors bg-white hover:bg-gray-100'.split(' '),
    )
  })
})

describe('click-to-toggle via the cell button itself', () => {
  it('a plain click on a cell button calls onToggleCell with that cell’s world coordinates', () => {
    const onToggleCell = vi.fn()
    renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)

    fireEvent.click(screen.getByRole('button', { name: 'Cell 3, -2' }))
    expect(onToggleCell).toHaveBeenCalledTimes(1)
    expect(onToggleCell).toHaveBeenCalledWith(3, -2)
  })
})

describe('drag-vs-click resolution on the grid-content pointer surface', () => {
  it('pointerdown -> pointermove past the drag threshold -> pointerup does not toggle', () => {
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 110, clientY: 100 })
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 110, clientY: 100 })

    expect(onToggleCell).not.toHaveBeenCalled()
  })

  it('pointerdown captures the pointer with its pointerId', () => {
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    fireEvent.pointerDown(grid, { pointerId: 7, clientX: 0, clientY: 0 })

    expect(pointerCapture.setPointerCapture).toHaveBeenCalledWith(7)
  })

  it('a move of exactly DRAG_THRESHOLD_PX (4px) does not cross the drag threshold -- the check is strictly greater-than', () => {
    // hypot(4, 0) === 4, the threshold itself.
    expectPointerMoveStillTogglesAtPointerUp(1, 0, 0, 4, 0)
  })

  it('pans the camera by each incremental pointer-move delta once the drag threshold is crossed', () => {
    const liveCells = new Set([cellKey(5, 5)]) as LiveCells
    const { container } = renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)
    const before = centeredCamera(WIDTH, HEIGHT)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 110, clientY: 100 }) // crosses threshold, delta (10, 0)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 120, clientY: 90 }) // delta since *last* move: (10, -10)

    // panByPixels is applied once per move with the delta since the previous move, not the
    // cumulative drag distance -- panCamera(before, dxPixels, dyPixels) chained the same way.
    const afterFirstMove = panCamera(before, 10, 0)
    const expected = panCamera(afterFirstMove, 10, -10)
    expect(cellTransform(5, 5)).toBe(expectedTransform(expected, 5, 5))
  })

  it('resolves toggle coordinates relative to a non-zero container rect, not raw clientX/clientY', () => {
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    stubBoundingClientRect({ left: 50, top: 30, width: WIDTH, height: HEIGHT })
    const grid = gridContentEl(container)
    const camera = centeredCamera(WIDTH, HEIGHT)

    fireEvent.pointerDown(grid, { pointerId: 5, clientX: 150, clientY: 130 })
    fireEvent.pointerUp(grid, { pointerId: 5, clientX: 150, clientY: 130 })

    const expected = screenToWorld(camera, 150 - 50, 130 - 30)
    expect(onToggleCell).toHaveBeenCalledWith(expected.x, expected.y)
  })

  it('pointerdown -> pointerup with no intervening move toggles using the pointerup coordinates', () => {
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)
    const camera = centeredCamera(WIDTH, HEIGHT)

    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(grid, { pointerId: 2, clientX: 50, clientY: 60 })

    const expected = screenToWorld(camera, 50, 60)
    expect(onToggleCell).toHaveBeenCalledTimes(1)
    expect(onToggleCell).toHaveBeenCalledWith(expected.x, expected.y)
  })

  it('a pointermove that stays within the drag threshold still resolves to a toggle at pointerup coordinates', () => {
    // hypot(2, 1) < 4px threshold.
    expectPointerMoveStillTogglesAtPointerUp(3, 200, 200, 202, 201)
  })

  it('does not resolve pointer-to-world coordinates on pointermove while no pattern is armed', () => {
    // previewAt itself is a no-op outside placing mode, but the armedPattern guard exists so an
    // ordinary pan drag never pays for the getBoundingClientRect layout call pointerToWorldCell
    // needs -- assert on that call directly, since previewPositions() staying empty either way
    // wouldn't distinguish "guarded" from "computed and discarded".
    const rectSpy = stubBoundingClientRect({ left: 0, top: 0, width: WIDTH, height: HEIGHT })
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)
    rectSpy.mockClear()

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 10, clientY: 10 })

    expect(rectSpy).not.toHaveBeenCalled()
  })

  it('a pointerup with no prior pointerdown still resolves as a toggle-click rather than throwing', () => {
    // dragStateRef.current is null here (no pointerdown primed it), which is exactly the case
    // the optional chaining in `!dragStateRef.current?.isPanning` guards against.
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)
    const camera = centeredCamera(WIDTH, HEIGHT)

    fireEvent.pointerUp(grid, { pointerId: 99, clientX: 10, clientY: 10 })

    const expected = screenToWorld(camera, 10, 10)
    expect(onToggleCell).toHaveBeenCalledWith(expected.x, expected.y)
  })
})

describe('isPanning cursor-class toggling', () => {
  it('flips grid-content between cursor-grab and cursor-grabbing exactly as the drag threshold is crossed and released', () => {
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    expect(grid.classList.contains('cursor-grab')).toBe(true)
    expect(grid.classList.contains('cursor-grabbing')).toBe(false)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 2, clientY: 0 }) // within threshold
    expect(grid.classList.contains('cursor-grabbing')).toBe(false)

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 10, clientY: 0 }) // crosses threshold
    expect(grid.classList.contains('cursor-grabbing')).toBe(true)
    expect(grid.classList.contains('cursor-grab')).toBe(false)

    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 10, clientY: 0 })
    expect(grid.classList.contains('cursor-grabbing')).toBe(false)
    expect(grid.classList.contains('cursor-grab')).toBe(true)
  })
})

describe('handlePointerCancel', () => {
  it('resets drag state without toggling, and restores cursor-grab', () => {
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 0 })
    expect(grid.classList.contains('cursor-grabbing')).toBe(true)

    fireEvent.pointerCancel(grid, { pointerId: 1, clientX: 20, clientY: 0 })
    expect(onToggleCell).not.toHaveBeenCalled()
    expect(grid.classList.contains('cursor-grabbing')).toBe(false)
    expect(grid.classList.contains('cursor-grab')).toBe(true)

    // A fresh down/up with no move behaves like a plain click, proving the
    // drag-ref state was actually cleared by the cancel, not just isPanning.
    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(grid, { pointerId: 2, clientX: 0, clientY: 0 })
    expect(onToggleCell).toHaveBeenCalledTimes(1)
  })

  it('does not commit a pattern placement, leaving placing mode armed', () => {
    const onPlacePattern = vi.fn()
    const { container } = renderGrid({ onPlacePattern })
    triggerResize(WIDTH, HEIGHT)
    openPatternModal()
    selectPattern(GLIDER)

    const grid = gridContentEl(container)
    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 20, clientY: 0 })
    fireEvent.pointerCancel(grid, { pointerId: 1, clientX: 20, clientY: 0 })

    expect(onPlacePattern).not.toHaveBeenCalled()
    // Placing mode is still armed: a fresh click now places, it doesn't toggle.
    fireEvent.pointerMove(grid, { pointerId: 2, clientX: 300, clientY: 300 })
    expect(previewLabels().length).toBe(GLIDER.cells.length)
  })
})

describe('pointer-capture release guard', () => {
  // Shared by both handlePointerUp and handlePointerCancel: each only releases pointer capture
  // when the element currently reports having it, so `fireUp` here is either fireEvent.pointerUp
  // or fireEvent.pointerCancel depending which handler's guard is under test.
  function expectReleaseGuardedByHasPointerCapture(fireUp: typeof fireEvent.pointerUp) {
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    fireUp(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(pointerCapture.releasePointerCapture).toHaveBeenCalledWith(1)

    pointerCapture.releasePointerCapture.mockClear()
    pointerCapture.hasPointerCapture.mockReturnValue(false)
    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 0, clientY: 0 })
    fireUp(grid, { pointerId: 2, clientX: 0, clientY: 0 })
    expect(pointerCapture.releasePointerCapture).not.toHaveBeenCalled()
  }

  it('handlePointerUp releases pointer capture only when the element currently has it', () => {
    expectReleaseGuardedByHasPointerCapture(fireEvent.pointerUp)
  })

  it('handlePointerCancel releases pointer capture only when the element currently has it', () => {
    expectReleaseGuardedByHasPointerCapture(fireEvent.pointerCancel)
  })
})

describe('toolbar zoom-in/zoom-out/reset (Grid’s own center-point math)', () => {
  it('zoom in zooms at (containerSize.width / 2, containerSize.height / 2) using ZOOM_FACTOR', () => {
    const liveCells = new Set([cellKey(5, 5)]) as LiveCells
    renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)
    const before = centeredCamera(WIDTH, HEIGHT)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))

    const expected = zoomCameraAtPoint(before, WIDTH / 2, HEIGHT / 2, ZOOM_FACTOR)
    expect(screen.getByText(`${zoomPercentage(expected)}%`)).toBeInTheDocument()
    expect(cellTransform(5, 5)).toBe(expectedTransform(expected, 5, 5))
  })

  it('zoom out zooms at the same center point using 1 / ZOOM_FACTOR', () => {
    const liveCells = new Set([cellKey(5, 5)]) as LiveCells
    renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)
    const before = centeredCamera(WIDTH, HEIGHT)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))

    const expected = zoomCameraAtPoint(before, WIDTH / 2, HEIGHT / 2, 1 / ZOOM_FACTOR)
    expect(screen.getByText(`${zoomPercentage(expected)}%`)).toBeInTheDocument()
    expect(cellTransform(5, 5)).toBe(expectedTransform(expected, 5, 5))
  })

  it('reset re-centers using the current containerSize, undoing prior zoom/pan', () => {
    const liveCells = new Set([cellKey(5, 5)]) as LiveCells
    renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)
    const before = centeredCamera(WIDTH, HEIGHT)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }))

    expect(screen.getByText(`${zoomPercentage(before)}%`)).toBeInTheDocument()
    expect(cellTransform(5, 5)).toBe(expectedTransform(before, 5, 5))
  })
})

describe('native wheel listener', () => {
  it('a plain wheel event pans using rect-relative pixel deltas (via applyWheelInput)', () => {
    const liveCells = new Set([cellKey(5, 5)]) as LiveCells
    const { container } = renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)
    const before = centeredCamera(WIDTH, HEIGHT)

    const notCancelled = fireEvent.wheel(rootEl(container), {
      deltaX: 40,
      deltaY: -20,
      shiftKey: false,
      clientX: 0,
      clientY: 0,
    })
    // dispatchEvent's return value is false when preventDefault() actually took effect, which
    // requires both the call itself and a non-passive listener (jsdom no-ops preventDefault on
    // passive listeners, same as real browsers) -- so this one assertion covers both.
    expect(notCancelled).toBe(false)

    const expected = applyWheelInput(before, { pixelX: 0, pixelY: 0, deltaX: 40, deltaY: -20, shiftKey: false })
    expect(cellTransform(5, 5)).toBe(expectedTransform(expected, 5, 5))
  })

  it('shift+wheel zooms at the container-rect-relative pixel position under the cursor', () => {
    const liveCells = new Set([cellKey(5, 5)]) as LiveCells
    const { container } = renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)
    stubBoundingClientRect({ left: 50, top: 30, width: WIDTH, height: HEIGHT })
    const before = centeredCamera(WIDTH, HEIGHT)

    fireEvent.wheel(rootEl(container), { deltaX: 0, deltaY: -100, shiftKey: true, clientX: 450, clientY: 330 })

    const expected = applyWheelInput(before, {
      pixelX: 450 - 50,
      pixelY: 330 - 30,
      deltaX: 0,
      deltaY: -100,
      shiftKey: true,
    })
    expect(screen.getByText(`${zoomPercentage(expected)}%`)).toBeInTheDocument()
    expect(cellTransform(5, 5)).toBe(expectedTransform(expected, 5, 5))
  })
})

describe('placing-mode state machine', () => {
  it('follows pointermove with a preview, places via pointer click at the resolved anchor, and exits single-shot', async () => {
    const onPlacePattern = vi.fn()
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onPlacePattern, onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const camera = centeredCamera(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    expect(screen.getByText('Pattern Library')).toBeInTheDocument()
    selectPattern(GLIDER)
    // Headless UI's Dialog exit transition keeps the closed dialog's DOM
    // mounted briefly (there's no real animation duration in jsdom, but the
    // unmount still happens on a microtask/rAF-driven tick, not
    // synchronously with the click) -- wait for it rather than asserting
    // immediately.
    await waitFor(() => expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument())

    fireEvent.pointerMove(grid, { pointerId: 9, clientX: 240, clientY: 260 })
    const anchor = screenToWorld(camera, 240, 260)
    const expectedPreview = patternCellPositions(GLIDER, anchor.x, anchor.y)
    expect(previewLabels().sort()).toEqual(expectedPreview.map(([x, y]) => `Pattern preview cell ${x}, ${y}`).sort())

    const [firstPreviewX, firstPreviewY] = expectedPreview[0]
    const firstPreviewEl = screen.getByLabelText(`Pattern preview cell ${firstPreviewX}, ${firstPreviewY}`)
    expect(firstPreviewEl.style.transform).toBe(expectedTransform(camera, firstPreviewX, firstPreviewY))
    expect(firstPreviewEl.style.boxSizing).toBe('border-box')

    fireEvent.pointerDown(grid, { pointerId: 9, clientX: 240, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 9, clientX: 240, clientY: 260 })

    expect(onPlacePattern).toHaveBeenCalledTimes(1)
    expect(onPlacePattern).toHaveBeenCalledWith(GLIDER, anchor.x, anchor.y)
    expect(onToggleCell).not.toHaveBeenCalled()
    expect(previewLabels()).toHaveLength(0)

    // Single-shot: a further click toggles a cell rather than stamping again.
    fireEvent.pointerDown(grid, { pointerId: 10, clientX: 240, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 10, clientX: 240, clientY: 260 })
    expect(onPlacePattern).toHaveBeenCalledTimes(1)
    expect(onToggleCell).toHaveBeenCalledTimes(1)
  })

  it('a past-threshold drag while placing pans instead of stamping, and leaves the pattern armed', async () => {
    const onPlacePattern = vi.fn()
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onPlacePattern, onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    await waitForModalToUnmount()

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 300, clientY: 260 }) // crosses DRAG_THRESHOLD_PX
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 300, clientY: 260 })

    expect(onPlacePattern).not.toHaveBeenCalled()
    expect(onToggleCell).not.toHaveBeenCalled()

    // A pan-drag isn't a stamp, but it isn't a cancel either: the pattern is
    // still armed, so the very next plain click does stamp it.
    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 300, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 2, clientX: 300, clientY: 260 })
    expect(onPlacePattern).toHaveBeenCalledTimes(1)
    expect(onToggleCell).not.toHaveBeenCalled()
  })

  it('anchors the preview on the panned camera, not the pre-pan one, once a drag has moved the view', async () => {
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    await waitForModalToUnmount()

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 300, clientY: 260 }) // crosses threshold, pans by (60, 0)
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 300, clientY: 260 })

    // A hover move at the same screen point as the drag ended: the pointer
    // hasn't moved, but the camera under it has, so the anchor must come out
    // different from the pre-pan one -- that difference is what proves
    // pointerToWorldCell reads the current camera rather than a stale capture.
    const panned = panCamera(centeredCamera(WIDTH, HEIGHT), 60, 0)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 300, clientY: 260 })

    const anchor = screenToWorld(panned, 300, 260)
    expect(anchor).not.toEqual(screenToWorld(centeredCamera(WIDTH, HEIGHT), 300, 260))

    const expectedPreview = patternCellPositions(GLIDER, anchor.x, anchor.y)
    expect(previewLabels().sort()).toEqual(expectedPreview.map(([x, y]) => `Pattern preview cell ${x}, ${y}`).sort())
    const [firstX, firstY] = expectedPreview[0]
    expect(screen.getByLabelText(`Pattern preview cell ${firstX}, ${firstY}`).style.transform).toBe(
      expectedTransform(panned, firstX, firstY),
    )
  })

  it('Escape cancels placing mode', () => {
    const onPlacePattern = vi.fn()
    const onToggleCell = vi.fn()
    const onSuppressEnterChange = vi.fn()
    const { container } = renderGrid({ onPlacePattern, onToggleCell, onSuppressEnterChange })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    expect(previewLabels().length).toBeGreaterThan(0)
    expect(onSuppressEnterChange).toHaveBeenLastCalledWith(true)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(previewLabels()).toHaveLength(0)
    expect(onSuppressEnterChange).toHaveBeenLastCalledWith(false)

    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 240, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 2, clientX: 240, clientY: 260 })
    expect(onPlacePattern).not.toHaveBeenCalled()
    expect(onToggleCell).toHaveBeenCalledTimes(1)
  })

  it('remounts preview-cell DOM nodes (rather than reusing them) when the preview anchor moves to a new cell', () => {
    // The preview cell's key encodes its world position (`preview-${x}-${y}`), not a stable
    // per-slot index, so moving the anchor changes every preview cell's key at once and React
    // tears down and recreates all of them -- this is the one place an incorrect/constant key is
    // observable through testing-library, since it changes DOM node identity, not just the props
    // rendered on it (which end up correct either way once React finishes reconciling).
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    const before = [...document.querySelectorAll('[aria-label^="Pattern preview cell"]')]
    expect(before.length).toBe(GLIDER.cells.length)

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 300, clientY: 300 })
    const after = [...document.querySelectorAll('[aria-label^="Pattern preview cell"]')]

    expect(after.length).toBe(GLIDER.cells.length)
    expect(after.some((el) => before.includes(el))).toBe(false)
  })

  it('a non-Escape keydown does not cancel placing mode', () => {
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    expect(previewLabels().length).toBeGreaterThan(0)

    fireEvent.keyDown(window, { key: 'a' })

    expect(previewLabels().length).toBeGreaterThan(0)
  })

  it('Escape closes the pattern library modal via its own onClose while no pattern is armed yet', async () => {
    renderGrid()
    triggerResize(WIDTH, HEIGHT)

    openPatternModal()
    expect(screen.getByText('Pattern Library')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument())
  })

  it('clicking the Patterns toolbar button while already placing cancels instead of reopening the modal', async () => {
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    expect(previewLabels().length).toBeGreaterThan(0)
    // Let the modal's own close-on-select transition finish before proving
    // the next click doesn't reopen it, so this assertion isn't just
    // observing the earlier transition still in flight.
    await waitFor(() => expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Open pattern library' }))

    expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument()
    expect(previewLabels()).toHaveLength(0)

    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 240, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 2, clientX: 240, clientY: 260 })
    expect(onToggleCell).toHaveBeenCalledTimes(1)
  })
})

describe('onSuppressEnterChange', () => {
  it('reports false on mount, true while the modal is open, true while placing is armed, then false again once placed', () => {
    const onSuppressEnterChange = vi.fn()
    const { container } = renderGrid({ onSuppressEnterChange })
    triggerResize(WIDTH, HEIGHT)
    expect(onSuppressEnterChange).toHaveBeenLastCalledWith(false)

    openPatternModal()
    expect(onSuppressEnterChange).toHaveBeenLastCalledWith(true)

    selectPattern(GLIDER)
    expect(onSuppressEnterChange).toHaveBeenLastCalledWith(true)

    const grid = gridContentEl(container)
    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    expect(onSuppressEnterChange).toHaveBeenLastCalledWith(false)
  })
})

describe('initial centering via ResizeObserver', () => {
  it('centers once on the first nonzero size observation and does not re-center on later observations', () => {
    const liveCells = new Set([cellKey(0, 0)]) as LiveCells
    const { container } = renderGrid({ liveCells })

    // A zero-sized initial observation (typical before layout settles) must
    // not trigger centering.
    triggerResize(0, 0)
    triggerResize(WIDTH, HEIGHT)

    const centeredAfterFirst = centeredCamera(WIDTH, HEIGHT)
    expect(cellTransform(0, 0)).toBe(expectedTransform(centeredAfterFirst, 0, 0))

    // Pan away from the centered position so a later accidental re-center
    // would be observable.
    fireEvent.wheel(rootEl(container), { deltaX: 100, deltaY: 0, shiftKey: false, clientX: 0, clientY: 0 })
    const afterPan = applyWheelInput(centeredAfterFirst, {
      pixelX: 0,
      pixelY: 0,
      deltaX: 100,
      deltaY: 0,
      shiftKey: false,
    })
    expect(cellTransform(0, 0)).toBe(expectedTransform(afterPan, 0, 0))

    // A later resize to a different size updates containerSize but must not
    // re-run centerView -- the camera should still reflect afterPan.
    triggerResize(900, 700)
    expect(cellTransform(0, 0)).toBe(expectedTransform(afterPan, 0, 0))
  })

  it('does not center, or render scrollbars, while only one dimension of a resize observation is nonzero', () => {
    const liveCells = new Set([cellKey(0, 0)]) as LiveCells
    renderGrid({ liveCells })
    const uncentered: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE } // useCamera's initial value

    triggerResize(0, HEIGHT)
    expect(cellTransform(0, 0)).toBe(expectedTransform(uncentered, 0, 0))
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(0)

    triggerResize(WIDTH, 0)
    expect(cellTransform(0, 0)).toBe(expectedTransform(uncentered, 0, 0))
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(0)

    triggerResize(WIDTH, HEIGHT)
    const centered = centeredCamera(WIDTH, HEIGHT)
    expect(cellTransform(0, 0)).toBe(expectedTransform(centered, 0, 0))
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(2)
  })
})

describe('scrollbar and ruler wiring', () => {
  it('renders no scrollbars while containerSize is still zero', () => {
    renderGrid()
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(0)
  })

  it('renders both scrollbars sized to containerSize, with metrics from computeScrollbarMetrics, once nonzero', () => {
    const liveCells = new Set([cellKey(2, 3), cellKey(10, 10)]) as LiveCells
    renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)

    const camera = centeredCamera(WIDTH, HEIGHT)
    const contentBounds = computeContentBounds(liveCells)
    const metrics = computeScrollbarMetrics(camera, contentBounds, WIDTH, HEIGHT)

    const scrollbars = screen.getAllByRole('scrollbar')
    expect(scrollbars).toHaveLength(2)
    const horizontal = scrollbars.find((el) => el.getAttribute('aria-orientation') === 'horizontal')
    const vertical = scrollbars.find((el) => el.getAttribute('aria-orientation') === 'vertical')
    expect(horizontal).toHaveAttribute('aria-controls', 'grid-content')
    expect(vertical).toHaveAttribute('aria-controls', 'grid-content')
    expect(horizontal).toHaveAttribute('aria-valuenow', String(Math.round(metrics.horizontal.thumbOffsetRatio * 100)))
    expect(vertical).toHaveAttribute('aria-valuenow', String(Math.round(metrics.vertical.thumbOffsetRatio * 100)))

    const { lengthPx: hLength } = computeThumbGeometry(metrics.horizontal, WIDTH)
    const { lengthPx: vLength } = computeThumbGeometry(metrics.vertical, HEIGHT)
    expect(horizontal).toHaveStyle({ width: `${hLength}px` })
    expect(vertical).toHaveStyle({ height: `${vLength}px` })
  })

  it('renders one RulerLabel per axis per majorGridlines entry', () => {
    renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const camera = centeredCamera(WIDTH, HEIGHT)
    const range = computeVisibleRange(camera, WIDTH, HEIGHT)
    const gridlines = computeMajorGridlines(range)

    const rulerLabels = [...document.querySelectorAll('span')].filter((el) => el.className.includes('text-[10px]'))
    expect(rulerLabels).toHaveLength(gridlines.x.length + gridlines.y.length)
  })

  it('reuses a ruler-label DOM node (either axis) for a coordinate that stays visible across a pan, and mounts a fresh node for the newly visible one', () => {
    // RulerLabel's key encodes its coordinate value (`x-${x}` / `y-${y}`), not a stable per-slot
    // index, so a pan that shifts the visible gridline set by one entry should move the
    // persisting coordinates' labels in place (same node, updated position) rather than
    // remounting the whole row -- this is the one place a wrong/constant key is observable
    // through testing-library. Pans both axes at once so both RulerLabel key expressions are
    // exercised in a single test.
    const { container } = renderGrid()
    triggerResize(WIDTH, HEIGHT)
    const before = centeredCamera(WIDTH, HEIGHT)
    const rangeBefore = computeVisibleRange(before, WIDTH, HEIGHT)
    const gridlinesBefore = computeMajorGridlines(rangeBefore)

    function labelNodesByText(edgeClass: 'top-0.5' | 'left-0.5'): Map<string, Element> {
      const nodes = [...document.querySelectorAll('span')].filter((el) => el.className.includes(edgeClass))
      return new Map(nodes.map((el) => [el.textContent ?? '', el]))
    }
    const xNodesBefore = labelNodesByText('top-0.5')
    const yNodesBefore = labelNodesByText('left-0.5')

    const wheelInput = {
      pixelX: 0,
      pixelY: 0,
      deltaX: 10 * before.cellSize,
      deltaY: 10 * before.cellSize,
      shiftKey: false,
    }
    fireEvent.wheel(rootEl(container), { ...wheelInput, clientX: 0, clientY: 0 })
    const after = applyWheelInput(before, wheelInput)
    const gridlinesAfter = computeMajorGridlines(computeVisibleRange(after, WIDTH, HEIGHT))

    function assertKeyedByCoordinate(
      before: readonly number[],
      after: readonly number[],
      nodesBefore: Map<string, Element>,
      nodesAfter: Map<string, Element>,
    ) {
      const persisting = before.filter((v) => after.includes(v))
      const newlyVisible = after.filter((v) => !before.includes(v))
      const noLongerVisible = before.filter((v) => !after.includes(v))
      expect(persisting.length).toBeGreaterThan(0)
      expect(newlyVisible.length).toBeGreaterThan(0)
      expect(noLongerVisible.length).toBeGreaterThan(0)

      for (const v of persisting) {
        expect(nodesAfter.get(String(v))).toBe(nodesBefore.get(String(v)))
      }
      for (const v of newlyVisible) {
        expect(nodesBefore.get(String(v))).toBeUndefined()
      }
      for (const v of noLongerVisible) {
        expect(nodesAfter.get(String(v))).toBeUndefined()
      }
    }

    assertKeyedByCoordinate(gridlinesBefore.x, gridlinesAfter.x, xNodesBefore, labelNodesByText('top-0.5'))
    assertKeyedByCoordinate(gridlinesBefore.y, gridlinesAfter.y, yNodesBefore, labelNodesByText('left-0.5'))
  })
})
