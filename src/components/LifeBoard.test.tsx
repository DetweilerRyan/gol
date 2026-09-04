import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { centeredCamera, screenToWorld } from '../camera'
import { DRAG_THRESHOLD_PX } from '../dragGesture'
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
import Cell from './Cell'
import LifeBoard from './LifeBoard'

// LifeBoard is the composition root: this file exists only to recover the
// four behaviors that no single unit below it can prove on its own -- that a
// pointer tap on the grid reaches usePatternPlacement's single-shot
// stampArmedPattern (whose own disarm-in-the-same-action rule is
// usePatternPlacement.test.ts's job), the Patterns-button-while-placing
// cancel path, (as of smooth-zoom-transitions step 7) that a toolbar zoom
// click actually reaches the on-screen zoom readout through the real button
// -> useCamera -> useZoomGlide -> badge chain, and (as of
// stable-hook-identities) that arming a pattern and moving the pointer does
// NOT re-render every mounted cell -- all four of which would otherwise be
// e2e-only, and the fourth of which no e2e test could even observe (a render
// count is not a rendered pixel). Grid's own composition (pointer surface,
// DOM layering, measurement) is Grid.test.tsx's job -- this file stays
// deliberately small.
// Gates the wheel-registration guard below, on Grid.test.tsx's/
// useCamera.test.ts's/useZoomGlide.test.ts's precedent: Stryker's
// per-expression instrumentation defeats React Compiler's memoization, so an
// ungated identity assertion reds the dry run and npm run test:mutation
// never starts. globalThis.__stryker__ is set at module load by any
// instrumented file's own bootstrap, before test collection.
const underStryker = '__stryker__' in globalThis

// Automocked with `spy: true`, Grid.test.tsx's own precedent (see that
// file's header comment for why this is the sanctioned way to spy on a
// component the SUT imports directly under Vitest 4) -- the real Cell
// implementation still runs, so every other test in this file renders
// exactly the same DOM it always did. vi.mocked(Cell) is a direct per-Cell
// render-call counter, used only by the "armed hover does not re-render
// mounted cells" describe below.
vi.mock('./Cell', { spy: true })

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

// stable-hook-identities: architect's DESIGN pass measured that arming a
// pattern and moving the pointer re-rendered every mounted Cell on every
// pointer move -- 5 renders across 5 moves in the fixture this describe is
// modelled on, scaling to one render per mounted cell per move in the real
// app (probe 2). The cause was usePatternPlacement's stampArmedPattern
// capturing `placement` directly, so its identity churned every time
// previewAt moved the preview -- which flowed into Grid's activateCell,
// GridCells' onActivateCell prop, and from there defeated GridCells' (and
// every Cell's) own compiler memoization even though every tile-derived
// prop was unchanged. See usePatternPlacement.ts's own comment on the ref
// fix that stops it. Positions below are spread by multiples of the default
// 20px cellSize so each move resolves to a genuinely different world cell --
// a move that resolves to the SAME cell is a no-op through
// patternPlacement.ts's movePreviewTo (see Grid.tsx's own comment on why
// that identity-dedup makes an isPatternArmed guard on the hover callback
// unnecessary), so a same-cell fixture would pass this test even unfixed.
describe('armed hover does not re-render mounted cells', () => {
  // Skipped under Stryker for the same reason Grid.test.tsx's own
  // tile-pan-stability test is: Stryker's per-expression instrumentation
  // defeats React Compiler's memoization, so a mutated build re-renders Cell
  // on every move and this assertion fails in Stryker's dry run, before a
  // single mutant executes. The unskipped companion below proves the harness
  // can observe a Cell render at all, independent of memoization surviving
  // instrumentation.
  it.skipIf(underStryker)('moving the pointer while a pattern is armed re-renders zero cells', async () => {
    const store = createLiveCellStore()
    const { container } = renderBoard({ store })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    await waitForModalToUnmount()

    vi.mocked(Cell).mockClear()

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 10, clientY: 260 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 150, clientY: 260 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 290, clientY: 260 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 430, clientY: 260 })
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 570, clientY: 260 })

    expect(Cell).not.toHaveBeenCalled()
  })

  // Non-vacuous companion, unskipped: proves this harness (the vi.mock spy,
  // the assertion shape) really can observe a Cell render at all --
  // independent of whether React Compiler's memoization (what the skipped
  // test above actually measures) survives Stryker's instrumentation. A
  // stamp click mutates the store, a genuine prop change no memoization can
  // bail out of, so this holds with or without compiler memoization intact.
  it('stamping the armed pattern does re-render Cell (the guard above is not vacuous)', async () => {
    const store = createLiveCellStore()
    const { container } = renderBoard({ store })
    triggerResize(WIDTH, HEIGHT)
    const grid = gridContentEl(container)

    openPatternModal()
    selectPattern(GLIDER)
    await waitForModalToUnmount()

    vi.mocked(Cell).mockClear()

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 10, clientY: 260 })
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 10, clientY: 260 })

    expect(Cell).toHaveBeenCalled()
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

// zoom-glide-regressed-the-pan-path: the cost this slice's identity fix
// actually removes -- see useZoomGlide.test.ts's "controller identity" and
// useCamera.test.ts's "returned action identity" for the identity guards
// themselves. #grid-content's non-passive wheel listener (useWheelInput.ts)
// is registered with effect deps [ref, onWheelInput], and pre-fix
// onWheelInput (useCamera's applyWheel, routed through commit()) churned
// identity on every render -- so it was torn down and re-added on every
// camera commit during a drag pan (measured by architect's DESIGN pass: 6
// re-registrations over a 6-frame paced pan, 0 after the fix). Whether that
// explains the perf regression pan-min-zoom-50k measured is a hypothesis
// jsdom cannot test (see the DESIGN ruling); this guard only pins the
// registration count itself.
describe('wheel listener registration during a pan', () => {
  let raf: AnimationFrameController
  // addEventListener is inherited from EventTarget.prototype rather than
  // owned by HTMLElement.prototype, so the spy has to target the former to
  // intercept #grid-content's own call -- verified by the non-vacuous
  // companion below, which fails (proving the spy is live) if this is wrong.
  // Nothing in vite.config.ts or src/test-setup.ts configures restoreMocks
  // or clearMocks, so the spy is restored explicitly rather than relying on
  // global cleanup.
  let addEventListenerSpy: MockInstance<typeof EventTarget.prototype.addEventListener>

  beforeEach(() => {
    raf = stubAnimationFrames()
    // In place before render(), so the mount registration -- the
    // non-vacuity check's other half -- is captured too.
    addEventListenerSpy = vi.spyOn(EventTarget.prototype, 'addEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
  })

  function wheelRegistrationCount(): number {
    return addEventListenerSpy.mock.calls.filter(([type]) => type === 'wheel').length
  }

  // Six pointermove/raf-advance pairs past the drag threshold, each one its
  // own animation frame -- useRafCoalescedPan.ts coalesces multiple moves
  // within one frame into a single onPan/commit, so this drives six distinct
  // camera commits rather than one, matching the DESIGN measurement's
  // 6-frame paced pan.
  function driveMultiFramePan(grid: HTMLElement) {
    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 0, clientY: 0 })
    for (let i = 1; i <= 6; i++) {
      fireEvent.pointerMove(grid, { pointerId: 1, clientX: DRAG_THRESHOLD_PX + i * 20, clientY: 0 })
      act(() => raf.advance(16))
    }
    fireEvent.pointerUp(grid, { pointerId: 1, clientX: DRAG_THRESHOLD_PX + 120, clientY: 0 })
  }

  it.skipIf(underStryker)('does not re-register the wheel listener during a multi-frame drag pan', () => {
    const { container } = renderBoard()
    triggerResize(WIDTH, HEIGHT)

    const atMount = wheelRegistrationCount()
    expect(atMount).toBeGreaterThanOrEqual(1)

    driveMultiFramePan(gridContentEl(container))

    // No further registrations beyond the one mount made -- a churning
    // onWheelInput identity would add one per commit.
    expect(wheelRegistrationCount()).toBe(atMount)
  })

  // Non-vacuous companion, unskipped: proves this instrument (the
  // EventTarget.prototype spy) really can observe a wheel registration at
  // all, independent of whether the pan re-registers one -- so the skip
  // above doesn't remove all signal for this describe under mutation
  // testing.
  it('registers a wheel listener at mount, proving the instrument observes the thing at all', () => {
    renderBoard()
    triggerResize(WIDTH, HEIGHT)

    expect(wheelRegistrationCount()).toBeGreaterThanOrEqual(1)
  })
})
