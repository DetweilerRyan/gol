import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { centeredCamera, screenToWorld } from '../camera'
import { createLiveCellStore } from '../liveCellStore'
import { PATTERNS, type Pattern } from '../patternLibrary'
import {
  stubAnimationFrames,
  stubBoundingClientRect,
  stubMatchMedia,
  stubPointerCapture,
  stubResizeObserver,
  type AnimationFrameController,
  type ResizeObserverController,
} from '../test-support/domStubs'
import { gridContentEl } from '../test-support/gridDom'
import LifeBoard from './LifeBoard'

// LifeBoard is the composition root: this file exists only to recover the
// three behaviors that no single unit below it can prove on its own -- that a
// pointer tap on the grid reaches usePatternPlacement's single-shot
// stampArmedPattern (whose own disarm-in-the-same-action rule is
// usePatternPlacement.test.ts's job), the Patterns-button-while-placing
// cancel path, and (as of smooth-zoom-transitions step 7) that a toolbar
// zoom click actually reaches the on-screen zoom readout through the real
// button -> useCamera -> useZoomGlide -> badge chain -- all three of which
// would otherwise be e2e-only. Grid's own composition (pointer surface, DOM
// layering, measurement) is Grid.test.tsx's job -- this file stays
// deliberately small.
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
  // LifeBoard composes useCamera -> useZoomGlide -> useReducedMotion, which
  // reads window.matchMedia -- undefined in this repo's jsdom project (see
  // useReducedMotion.ts's own comment). Neither test here drives a toolbar
  // zoom glide, so the stubbed value itself is arbitrary.
  stubMatchMedia(false)
})

function triggerResize(width: number, height: number) {
  resizeObserver.resize(width, height)
}

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern

function renderBoard(props: Partial<React.ComponentProps<typeof LifeBoard>> = {}) {
  const merged: React.ComponentProps<typeof LifeBoard> = {
    store: createLiveCellStore(),
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

// The zoom-percentage badge (LifeBoard.tsx's bottom-right span) is the only
// on-screen readout of the camera's cellSize -- matched by its own text
// shape (always "<number>%") rather than an exact value, since the value is
// exactly what these tests watch change over time.
function zoomBadgeText(): string {
  return screen.getByText(/^\d+%$/).textContent as string
}

describe('single-shot stamping', () => {
  it('places once on the first click, then toggles rather than stamping again on the next', async () => {
    const store = createLiveCellStore()
    const onPlacePattern = vi.spyOn(store, 'place')
    const onToggleCell = vi.spyOn(store, 'toggle')
    const { container } = renderBoard({ store })
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
    const store = createLiveCellStore()
    const onToggleCell = vi.spyOn(store, 'toggle')
    const { container } = renderBoard({ store })
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

// The seam architect named after hardener found a whole keyboard translation
// layer that was green in Playwright and green at the hook level with
// nothing pinning the seam between them (20 NoCoverage mutants in exactly
// the code that slice existed to add). Nothing below LifeBoard renders the
// zoom badge, so THIS is the only place the button -> useCamera -> glide ->
// readout chain is provable without a browser -- Grid.test.tsx never mounts
// GridToolbar or the badge (see LifeBoard's own renderOverlays), and
// useCamera.test.ts/useZoomGlide.test.ts both stop at the hook boundary,
// asserting on the returned `camera` value directly rather than on anything
// a real click dispatches or a real component renders. What THIS test would
// catch that neither of those can: GridToolbar's onClick wired to the wrong
// useCamera export (e.g. accidentally back to the old zoomAtPoint, which
// would still pass every useCamera-level assertion but never glide on
// screen), or renderOverlays failing to pass camera through to the badge at
// all.
describe('toolbar zoom glide reaches the on-screen badge', () => {
  let raf: AnimationFrameController

  beforeEach(() => {
    raf = stubAnimationFrames()
  })

  it('clicking Zoom in passes through at least 3 distinct intermediate readings and rests at 125%', () => {
    renderBoard()
    triggerResize(WIDTH, HEIGHT)
    expect(zoomBadgeText()).toBe('100%')

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))

    const readings = new Set<string>()
    for (let i = 0; i < 12; i++) {
      act(() => raf.advance(200 / 12))
      readings.add(zoomBadgeText())
    }

    // Matches features/steps/camera-pan-and-zoom.ts's GLIDE_PERCENTAGES: a
    // single extra reading is one frame, not motion anyone would call a
    // glide -- three is the smallest count rounding noise around a single
    // extra frame couldn't produce.
    expect(readings.size).toBeGreaterThanOrEqual(3)
    expect(zoomBadgeText()).toBe('125%')
  })

  it('with prefers-reduced-motion, goes straight from 100% to 125% with nothing in between', () => {
    stubMatchMedia(true)
    renderBoard()
    triggerResize(WIDTH, HEIGHT)
    expect(zoomBadgeText()).toBe('100%')

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))

    // The synchronous progress-0 apply IS the whole (instantaneous)
    // transition at duration 0 -- see useZoomGlide.ts's own comment on why
    // reduced motion is nowhere a branch in that hook. No frame should even
    // be pending, let alone produce an intermediate reading.
    expect(raf.pendingCount()).toBe(0)
    expect(zoomBadgeText()).toBe('125%')
  })
})
