import { fireEvent, render, screen, type RenderResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CELL_SIZE, screenToWorld, worldToScreen, type Camera } from '../camera'
import { DRAG_THRESHOLD_PX } from '../dragGesture'
import { type LiveCells } from '../gameOfLife'
import {
  stubBoundingClientRect,
  stubPointerCapture,
  stubResizeObserver,
  type ResizeObserverController,
} from '../test-support/domStubs'
import Grid, { GRID_CONTENT_ID } from './Grid'

// Grid itself composes useElementSize (ResizeObserver), useWheelInput and
// useGridPointerGestures (both getBoundingClientRect/pointer capture) -- each
// of those has its own focused test for the API wiring itself. What's left
// here is the composition: the DOM layering contract, the place-vs-toggle
// dispatch, and one thin wiring test per hook proving Grid actually connects
// its handlers rather than testing the handlers' own logic again. See
// src/test-support/domStubs.ts for why each stub is needed. Pointer capture
// is stubbed (unused beyond that) purely so jsdom doesn't throw when a
// pointerdown-driven test calls setPointerCapture -- its own release-guard
// behavior is useGridPointerGestures.test.tsx's job.
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
    liveCells: new Set<string>() as LiveCells,
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

function gridContentEl(container: HTMLElement): HTMLElement {
  const el = container.querySelector('#grid-content')
  if (!el) throw new Error('#grid-content not found')
  return el as HTMLElement
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
})

describe('cell activation dispatch (place vs toggle)', () => {
  it('a plain activation toggles when no pattern is armed', () => {
    const onToggleCell = vi.fn()
    const onStampPattern = vi.fn()
    renderGrid({ onToggleCell, onStampPattern, isPatternArmed: false })

    fireEvent.click(screen.getByRole('button', { name: 'Cell 0, 0' }))

    expect(onToggleCell).toHaveBeenCalledWith(0, 0)
    expect(onStampPattern).not.toHaveBeenCalled()
  })

  it('a plain activation stamps when a pattern is armed', () => {
    const onToggleCell = vi.fn()
    const onStampPattern = vi.fn()
    renderGrid({ onToggleCell, onStampPattern, isPatternArmed: true })

    fireEvent.click(screen.getByRole('button', { name: 'Cell 0, 0' }))

    expect(onStampPattern).toHaveBeenCalledWith(0, 0)
    expect(onToggleCell).not.toHaveBeenCalled()
  })
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
    // Exercises the initial containerSize state ({ width: 0, height: 0 }), not just the
    // post-resize value -- computeVisibleRange/cellsInRange still produce a finite (if tiny)
    // range from that default.
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
