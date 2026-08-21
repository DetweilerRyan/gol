import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { centeredCamera, screenToWorld } from '../camera'
import { type LiveCells } from '../gameOfLife'
import { PATTERNS, type Pattern } from '../patternLibrary'
import {
  stubBoundingClientRect,
  stubPointerCapture,
  stubResizeObserver,
  type ResizeObserverController,
} from '../test-support/domStubs'
import { gridContentEl } from '../test-support/gridDom'
import LifeBoard from './LifeBoard'

// LifeBoard is the composition root: this file exists only to recover the two
// behaviors that live entirely in its own wiring (single-shot stamping via
// stampPattern's disarm() call, and the Patterns-button-while-placing cancel
// path) which would otherwise be e2e-only. Grid's own composition (pointer
// surface, DOM layering, measurement) is Grid.test.tsx's job -- this file
// stays deliberately small.
let resizeObserver: ResizeObserverController

// Small on purpose -- this file only exists to recover two wiring behaviors
// that don't depend on how many cells are on screen (see file header
// comment), so there's no reason to pay for a large GridCells render here.
const WIDTH = 40
const HEIGHT = 40

beforeEach(() => {
  resizeObserver = stubResizeObserver()
  stubBoundingClientRect({ left: 0, top: 0, width: WIDTH, height: HEIGHT })
  stubPointerCapture()
})

function triggerResize(width: number, height: number) {
  resizeObserver.resize(width, height)
}

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern

function renderBoard(props: Partial<React.ComponentProps<typeof LifeBoard>> = {}) {
  const merged: React.ComponentProps<typeof LifeBoard> = {
    liveCells: new Set<string>() as LiveCells,
    onToggleCell: vi.fn(),
    onPlacePattern: vi.fn(),
    ...props,
  }
  const utils = render(<LifeBoard {...merged} />)
  return { ...utils, ...merged }
}

function openPatternModal() {
  fireEvent.click(screen.getByRole('button', { name: 'Open pattern library' }))
}

function selectPattern(pattern: Pattern) {
  fireEvent.click(screen.getByRole('button', { name: pattern.name }))
}

// Headless UI's Dialog stays mounted through its leave transition after a
// pattern is selected, and treats a pointerdown landing outside it during
// that window as a dismiss -- wait for it before driving pointer events at
// the grid, or the assertion would exercise idle mode instead of placing
// mode.
async function waitForModalToUnmount() {
  await waitFor(() => expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument())
}

function previewLabels(): string[] {
  return [...document.querySelectorAll('[aria-label^="Pattern preview cell"]')].map(
    (el) => el.getAttribute('aria-label') as string,
  )
}

describe('single-shot stamping', () => {
  it('places once on the first click, then toggles rather than stamping again on the next', async () => {
    const onPlacePattern = vi.fn()
    const onToggleCell = vi.fn()
    const { container } = renderBoard({ onPlacePattern, onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const camera = centeredCamera(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    await waitForModalToUnmount()

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 240, clientY: 260 })

    const anchor = screenToWorld(camera, 240, 260)
    expect(onPlacePattern).toHaveBeenCalledTimes(1)
    expect(onPlacePattern).toHaveBeenCalledWith(GLIDER, anchor.x, anchor.y)
    expect(onToggleCell).not.toHaveBeenCalled()

    // A further click at a different empty cell toggles, it doesn't stamp a second copy.
    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 100, clientY: 100 })
    fireEvent.pointerUp(grid, { pointerId: 2, clientX: 100, clientY: 100 })

    const secondCell = screenToWorld(camera, 100, 100)
    expect(onPlacePattern).toHaveBeenCalledTimes(1)
    expect(onToggleCell).toHaveBeenCalledTimes(1)
    expect(onToggleCell).toHaveBeenCalledWith(secondCell.x, secondCell.y)
  })
})

describe('Patterns toolbar button while placing', () => {
  it('cancels the armed pattern instead of reopening the library', async () => {
    const onToggleCell = vi.fn()
    const { container } = renderBoard({ onToggleCell })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 240, clientY: 260 })
    expect(previewLabels().length).toBeGreaterThan(0)
    // Let the modal's own close-on-select transition finish before proving
    // the next click doesn't reopen it, so this assertion isn't just
    // observing the earlier transition still in flight.
    await waitForModalToUnmount()

    fireEvent.click(screen.getByRole('button', { name: 'Open pattern library' }))

    expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument()
    expect(previewLabels()).toHaveLength(0)

    // Placing mode is gone, not the library reopened: the very next click toggles.
    fireEvent.pointerDown(grid, { pointerId: 2, clientX: 240, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 2, clientX: 240, clientY: 260 })
    expect(onToggleCell).toHaveBeenCalledTimes(1)
  })
})
