import { act, fireEvent, render, screen, waitFor, type RenderResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
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
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
  zoomPercentage,
  ZOOM_FACTOR,
  type Camera,
} from '../viewport'
import Grid from './Grid'

// jsdom has no ResizeObserver at all. Grid's initial-centering effect
// constructs one and calls .observe() on mount, then reacts to entries
// pushed through the callback it was constructed with -- so the stub only
// needs to capture that callback per-instance and let tests invoke it with a
// controlled contentRect, exactly the way a real observation would.
class ResizeObserverStub {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeObserverInstances.push(this)
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

let resizeObserverInstances: ResizeObserverStub[]

// jsdom's Element.prototype.getBoundingClientRect returns an all-zero rect by
// default. pointerToWorldCell and the native wheel listener both compute
// coordinates relative to a container rect, so tests exercising those paths
// need a controlled, non-default stub. Typed to the exact
// Element.prototype.getBoundingClientRect signature (`(): DOMRect`) rather
// than a bare vi.fn(), per the precedent/warning in Scrollbar.test.tsx: a
// loosely-typed spy assigned to a prototype method can pass `npm run
// test:unit` while still failing `npm run build`, since vitest doesn't
// typecheck.
let getBoundingClientRect: Mock<() => DOMRect>

function stubBoundingClientRect(rect: { left: number; top: number; width: number; height: number }) {
  const domRect: DOMRect = {
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON() {
      return this
    },
  }
  getBoundingClientRect = vi.fn<() => DOMRect>(() => domRect)
  Element.prototype.getBoundingClientRect = getBoundingClientRect
}

// jsdom doesn't implement pointer capture either -- same spirit as
// Scrollbar.test.tsx's stub, since Grid's own pointer handlers (and the
// Scrollbar/thumb children it renders) call these.
let setPointerCapture: Mock<(pointerId: number) => void>
let hasPointerCapture: Mock<(pointerId: number) => boolean>
let releasePointerCapture: Mock<(pointerId: number) => void>

beforeEach(() => {
  resizeObserverInstances = []
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)

  stubBoundingClientRect({ left: 0, top: 0, width: WIDTH, height: HEIGHT })

  setPointerCapture = vi.fn<(pointerId: number) => void>()
  hasPointerCapture = vi.fn<(pointerId: number) => boolean>(() => true)
  releasePointerCapture = vi.fn<(pointerId: number) => void>()
  Element.prototype.setPointerCapture = setPointerCapture
  Element.prototype.hasPointerCapture = hasPointerCapture
  Element.prototype.releasePointerCapture = releasePointerCapture
})

const WIDTH = 800
const HEIGHT = 600

function triggerResize(width: number, height: number) {
  const instance = resizeObserverInstances.at(-1)
  if (!instance) throw new Error('ResizeObserver was never constructed -- render Grid first')
  act(() => {
    instance.callback(
      [{ contentRect: { width, height } } as unknown as ResizeObserverEntry],
      instance as unknown as ResizeObserver,
    )
  })
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

function previewLabels(): string[] {
  return [...document.querySelectorAll('[aria-label^="Pattern preview cell"]')].map(
    (el) => el.getAttribute('aria-label') as string,
  )
}

describe('Grid cell rendering', () => {
  it('renders alive cells with the live style and dead cells with the dead style, aria-labeled "Cell x, y"', () => {
    const liveCells = new Set([cellKey(0, 0)]) as LiveCells
    renderGrid({ liveCells })
    triggerResize(WIDTH, HEIGHT)

    const alive = screen.getByRole('button', { name: 'Cell 0, 0' })
    expect(alive.className).toContain('bg-gray-900')

    const dead = screen.getByRole('button', { name: 'Cell 1, 0' })
    expect(dead.className).toContain('bg-white')
  })

  it('renders negative-coordinate cells with the same aria-label format', () => {
    renderGrid()
    triggerResize(WIDTH, HEIGHT)
    expect(screen.getByRole('button', { name: 'Cell -3, -2' })).toBeInTheDocument()
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
    const onToggleCell = vi.fn()
    const { container } = renderGrid({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)
    const camera = centeredCamera(WIDTH, HEIGHT)

    fireEvent.pointerDown(grid, { pointerId: 3, clientX: 200, clientY: 200 })
    fireEvent.pointerMove(grid, { pointerId: 3, clientX: 202, clientY: 201 }) // hypot(2,1) < 4px threshold
    fireEvent.pointerUp(grid, { pointerId: 3, clientX: 202, clientY: 201 })

    const expected = screenToWorld(camera, 202, 201)
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

    fireEvent.wheel(rootEl(container), { deltaX: 40, deltaY: -20, shiftKey: false, clientX: 0, clientY: 0 })

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
})
