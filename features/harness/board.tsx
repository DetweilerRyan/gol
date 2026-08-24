// The SHARED CORE of the black-box acceptance harness. features/harness/ is
// the ONE place a .steps.test.tsx file is allowed to reach the application
// from, and it is one core plus one module per feature: a steps file imports
// its own features/harness/<feature>.tsx, @amiceli/vitest-cucumber and vitest
// -- nothing else. Reaching into src/ from a steps file turns the black-box
// layer back into the white-box one it replaced without changing a single
// filename, which is the failure mode this boundary exists to make visible;
// rules/no-domain-imports-in-black-box-steps.yml checks it mechanically, and
// its allowlist is a single kebab-case segment under ./harness/ so the
// traversal and nesting escapes are excluded with it. Even cellLabel() is a
// violation in a steps file -- the label format belongs here.
//
// WHAT LIVES HERE AND WHAT DOES NOT. This module owns everything independent
// of which feature is being specified: the viewport, the mount lifecycle, the
// single active board, and the cell/generation queries. A per-feature module
// owns the world window its scenarios need plus any capability only that
// feature drives, and composes those onto the Board this module returns. A
// per-feature module NEVER mounts -- if one calls createRoot, the split has
// failed and the single-active-board guarantee goes with it. Adding a
// feature's capabilities must not modify this file: that Open-Closed property
// is the whole reason the harness is two kinds of file rather than one.
//
// WHY IT MOUNTS <App />, NOT <LifeBoard />. App.tsx and
// src/components/LifeBoard.tsx are excluded from BOTH stryker.config.json
// and crap4ts.config.ts, so composition-root wiring -- App owning the live
// cell store, GenerationHud owning the generation counter and the Next
// Generation button, the store handle threaded down to the leaves -- is
// today covered only by Playwright. An acceptance layer that mounts App is
// the one FAST layer that can see it. Mounting LifeBoard instead would give
// up the whole architectural argument for this layer's existence, and would
// also lose the generation counter, which is what makes a silently no-op
// "when the next generation is computed" step detectable at all.
//
// WHY IT DOES NOT USE @testing-library/react's render(). @amiceli/vitest-
// cucumber compiles every Gherkin STEP into its own vitest `test`, not every
// scenario (measured: cell-life-and-death.feature is 48 tests, one per step),
// and src/test-setup.ts installs a global afterEach(cleanup). An
// RTL-registered tree is therefore unmounted BETWEEN a scenario's Given and
// its When -- verified with a throwaway probe, which failed on exactly that.
// Rendering into a container this module owns keeps cleanup() a no-op for the
// board, so a scenario's steps see one continuous app the way a user would.
// The cost is that teardown is ours: mountBoardRequiring() unmounts the
// previous board first, so at most one is ever in document.body.
import { act, fireEvent, screen } from '@testing-library/react'
import { createRoot, type Root } from 'react-dom/client'
import App from '../../src/App'
import {
  ALIVE_CELL_SELECTOR,
  CELL_ALIVE_ATTR,
  CELL_ALIVE_VALUE,
  CELL_DEAD_VALUE,
  cellLabel,
  cellSelector,
} from '../../src/test-support/cellQuery'
import { stubBoundingClientRect, stubPointerCapture, stubResizeObserver } from '../../src/test-support/domStubs'

// 200x200 CSS pixels, and the size is derived rather than picked. At
// DEFAULT_CELL_SIZE 20 this mounts world cells -8..11 on both axes (400 cell
// buttons); see assertWindowMounted() below for why the window is wider on
// the positive side than centeredCamera alone would suggest. 180 and 240
// mount the identical 400 cells, so 200 is the smallest round viewport that
// covers that range.
//
// ONE VIEWPORT, SHARED BY EVERY FEATURE HARNESS: mountBoardRequiring()
// renders at this size for all of them, and a feature whose required window
// this viewport cannot mount fails assertWindowMounted() by name rather than
// quietly observing the wrong cells. THE FALSIFIER, recorded here on
// purpose: if two post-ruling conversions independently need a viewport
// other than 200x200, stop and parameterize VIEWPORT before converting any
// more features. One such feature is a special case; two is evidence the
// size belongs on the seam next to the required window, and every conversion
// made past that point inherits a number that was only ever derived for
// cell-life-and-death.
export const VIEWPORT = { width: 200, height: 200 } as const

// Thrown when a step asks about a cell the grid never mounted. Its own
// marker string, so a step that died because a coordinate fell out of the
// viewport is greppable in a mutation run's output rather than inferred from
// a generic "unable to find an element" message.
export const CELL_NOT_MOUNTED = 'CELL_NOT_MOUNTED'

// A string, not a boolean, on purpose. It lets a Then compare the observed
// outcome to the Examples-table literal DIRECTLY, which is what makes a
// mutated <next state> always detected rather than only detected when the
// mutation happens to land on the string "alive". Do not simplify this to a
// boolean -- the pre-conversion steps file carried the same property and it
// is load-bearing for the mutation score.
export type CellState = 'alive' | 'dead'

// What mountBoardRequiring() hands a per-feature harness: the black-box board,
// plus the liveness guard the board's own methods already apply internally. A
// feature harness that composes an EXTRA capability onto the board -- a wheel
// gesture, a modal query -- must make the same "is this still the current
// board?" check, and `active` is deliberately NOT exported for it to read:
// cellButton()'s ambiguity check ("a board leaked") is a sound diagnosis only
// while mounting is globally unique, which is a property of this module owning
// that state alone. assertActive() carries the guard across the seam without
// moving the state across it.
export interface MountedBoard {
  board: Board
  assertActive(): void
}

export interface Board {
  toggle(x: number, y: number): void
  advance(): void
  stateAt(x: number, y: number): CellState
  liveCount(): number
  generation(): number
}

// WorldWindow, not Window: these files compile under lib: DOM, where `Window`
// is a global interface a local declaration would shadow rather than replace.
// One type serves both directions -- the rectangle a feature harness REQUIRES,
// and the rectangle the grid actually mounted -- because assertWindowMounted()
// compares exactly those two and nothing else distinguishes them.
export interface WorldWindow {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const GENERATION_TEXT = /^Generation: \d+$/
const NEXT_GENERATION_BUTTON = 'Next Generation'

// Bounds the outward scan in mountedWindow() so a query helper that stopped
// matching anything can never spin. Far larger than any window this viewport
// produces (20 cells per axis).
const SCAN_LIMIT = 512

let active: { root: Root; container: HTMLDivElement } | null = null

function unmountActiveBoard(): void {
  if (!active) return
  const { root, container } = active
  active = null
  act(() => root.unmount())
  container.remove()
}

// How far the mounted grid extends from the origin along one unit direction.
// Uses cellSelector()'s exact aria-label attribute selector rather than a
// hand-written regex over every mounted label: the label FORMAT lives in
// src/test-support/cellQuery.ts and this module must not carry a second copy
// of it (the same rule Cell.test.tsx pins for the component side). The scan
// is exact because the mounted set is always a rectangle -- cellTiles.ts
// mounts a TileRange -- so the two axis extents determine all four bounds.
function extentFrom(stepX: number, stepY: number): number {
  let n = 0
  while (n < SCAN_LIMIT && document.querySelector(cellSelector(stepX * (n + 1), stepY * (n + 1)))) n++
  return n
}

function mountedWindow(): WorldWindow {
  if (!document.querySelector(cellSelector(0, 0))) {
    throw new Error('The grid did not mount cell (0, 0) -- the mounted window cannot be measured from the origin')
  }
  return {
    minX: -extentFrom(-1, 0),
    maxX: extentFrom(1, 0),
    minY: -extentFrom(0, -1),
    maxY: extentFrom(0, 1),
  }
}

function describeWindow(w: WorldWindow): string {
  return `x ${w.minX}..${w.maxX}, y ${w.minY}..${w.maxY}`
}

// CONTAINMENT, NOT EQUALITY, and the reason is that the mounted window is
// partly an artifact of render order rather than of the viewport alone.
// centeredCamera(200, 200) does give offsetX/offsetY -5, which on its own
// covers cells -5..4. But Grid's FIRST render happens at camera (0, 0),
// before useInitialCentering's layout effect fires, so useCellTiles has
// already stored the tile range covering 0..11; nextTileRange then rebuilds
// onto the eviction-lag-clamped UNION of that range and the newly required
// one (see cellTiles.ts), landing on -8..11.
//
// Pinning that exactly would overfit this harness to today's hysteresis and
// centering order. A future change that ENLARGES the window is harmless and
// must not fail here; one that shrinks it past what the feature needs must.
// The message names both ranges so the second case reads as a real diagnosis
// rather than as a mystery missing element.
function assertWindowMounted(required: WorldWindow): void {
  const mounted = mountedWindow()
  const contains =
    mounted.minX <= required.minX &&
    mounted.maxX >= required.maxX &&
    mounted.minY <= required.minY &&
    mounted.maxY >= required.maxY
  if (!contains) {
    throw new Error(
      `The mounted window (${describeWindow(mounted)}) does not contain the window this feature requires ` +
        `(${describeWindow(required)}). Every cell coordinate a scenario -- or a mutant of one -- ` +
        `touches must be observable, or a mutant would be killed by a missing element instead of by an assertion.`,
    )
  }
}

// getByLabelText, never getByRole + name. Measured at this harness's 400
// mounted buttons: 1.98ms per label query against 48.11ms per role+name
// query, a 24x difference -- accessible-name computation walks every
// candidate element, while the label query is an attribute-map lookup. Both
// read the same accessible information; only the cost differs.
//
// queryAll rather than get, so "no such cell" and "more than one such cell"
// stay distinguishable: get() throws for both, and folding the second into
// CELL_NOT_MOUNTED would hide a leaked second board behind a message saying
// the opposite.
//
// EXPORTED although this module's own Board never hands it out: a per-feature
// harness composing an extra capability (hovering a cell, dragging from one to
// another) needs the same single-cell lookup with the same two diagnoses, and
// the alternative is that the first feature to need one edits this file --
// exactly the coupling the harness split exists to remove.
export function cellButton(x: number, y: number): HTMLElement {
  const matches = screen.queryAllByLabelText(cellLabel(x, y))
  if (matches.length === 0) {
    throw new Error(`${CELL_NOT_MOUNTED}: (${x}, ${y}) is outside the mounted window`)
  }
  if (matches.length > 1) {
    throw new Error(`Ambiguous cell (${x}, ${y}): ${matches.length} elements carry that label -- a board leaked`)
  }
  return matches[0]
}

function assertActive(container: HTMLDivElement): void {
  if (active?.container !== container) {
    throw new Error('This board has been unmounted -- mounting a later board replaced it. Use the current board.')
  }
}

function readGeneration(): number {
  const label = screen.getByText(GENERATION_TEXT)
  const digits = /(\d+)$/.exec(label.textContent ?? '')
  if (!digits) throw new Error(`Could not read a generation count from ${JSON.stringify(label.textContent)}`)
  return Number(digits[1])
}

function readCellState(x: number, y: number): CellState {
  const pressed = cellButton(x, y).getAttribute(CELL_ALIVE_ATTR)
  if (pressed === CELL_ALIVE_VALUE) return 'alive'
  if (pressed === CELL_DEAD_VALUE) return 'dead'
  // A cell announced as neither pressed nor unpressed is not a toggle button
  // at all -- a different and wrong statement from "dead". Failing loudly
  // here rather than defaulting to 'dead' keeps the aria-pressed contract
  // (cell-life-and-death.e2e.spec.ts's accepted outline, point 2) observable
  // from this layer too.
  throw new Error(
    `Cell (${x}, ${y}) is not announced as a toggle button: ${CELL_ALIVE_ATTR}=${JSON.stringify(pressed)}`,
  )
}

function makeBoard(container: HTMLDivElement): Board {
  return {
    // WHICH ACTIVATION ROUTE THIS IS, because it is not the one a mouse user
    // takes. useGridPointerGestures takes pointer capture on #grid-content,
    // which retargets the subsequent native click to the container, so
    // Cell's own onClick never fires for pointer-driven interaction -- Grid's
    // onTap resolves the cell from pointerup pixels through screenToWorld
    // instead. Cell.onClick is the KEYBOARD activation route (Enter/Space),
    // and a bare fireEvent.click with no pointer sequence is exactly that
    // route. So this layer drives keyboard activation, and hit-testing --
    // pointer pixels to world cell -- is invisible from here.
    //
    // What that does NOT mean, measured in this slice's VERIFY pass: it does
    // not make the two black-box layers cover disjoint routes. Playwright
    // drives BOTH -- .click() for the pointer route, and
    // hud-layout-and-shortcuts.e2e.spec.ts:102 (focus a cell, press Enter)
    // for this one. Swapping Cell's onActivate(x, y) to (y, x) fails that
    // e2e test on aria-pressed, while the paired cell-life-and-death e2e
    // spec, whose every activation is .click(), passes it. Read the
    // relationship as "this layer sees a strict subset of the routes the
    // browser layer sees, and cannot see hit-testing at all" -- not as
    // "each layer covers something the other cannot".
    toggle(x, y) {
      assertActive(container)
      fireEvent.click(cellButton(x, y))
    },
    advance() {
      assertActive(container)
      fireEvent.click(screen.getByRole('button', { name: NEXT_GENERATION_BUTTON }))
    },
    stateAt(x, y) {
      assertActive(container)
      return readCellState(x, y)
    },
    // MOUNTED CELLS ONLY -- this counts what the user can see, which is the
    // whole point of a black-box layer, not what the store holds. It is a
    // sound statement of "nothing else came to life" only where every cell
    // that COULD be born is inside the mounted window; for the 2x2 block at
    // the origin every candidate birth is adjacent to the block and
    // therefore mounted, which is the case it exists for.
    liveCount() {
      assertActive(container)
      return document.querySelectorAll(ALIVE_CELL_SELECTOR).length
    },
    // Exists so a "when the next generation is computed" step that silently
    // no-ops cannot pass: without it, a broken Next Generation button leaves
    // a dead cell dead and every "should end up dead" row still green. The
    // same guard cell-life-and-death.e2e.spec.ts already applies in the
    // browser.
    generation() {
      assertActive(container)
      return readGeneration()
    },
  }
}

// Renders the whole app at VIEWPORT and hands back the black-box controls.
// Cleanup between steps is src/test-setup.ts's afterEach (a no-op for this
// board, deliberately -- see the module header); cleanup between SCENARIOS
// is the unmountActiveBoard() call below, so a steps file adds no
// beforeEach/afterEach of its own.
//
// requiredWindow is a REQUIRED POSITIONAL, not an optional or an option-bag
// field, and that is the ruling this whole split turns on. An optional needs a
// default, and a default is a window asserted on behalf of some feature that
// did not state one -- so the second feature to mount would silently inherit
// cell-life-and-death's rectangle and pass an assertion about the wrong cells.
// Making it unsupplied-able is what forces each feature harness to say, in its
// own file, which part of the world its scenarios can observe.
export function mountBoardRequiring(requiredWindow: WorldWindow): MountedBoard {
  unmountActiveBoard()

  // jsdom implements none of these three usefully: ResizeObserver not at all
  // (useElementSize would never measure, so the grid would stay at 0x0),
  // getBoundingClientRect as an all-zero constant, pointer capture not at
  // all. Shared with the src/ component tests rather than re-rolled here --
  // three hand-written copies of a stub drift.
  //
  // READ THIS BEFORE ADDING A PIXEL-DRIVEN CAPABILITY TO A FEATURE HARNESS:
  // stubBoundingClientRect installs ONE constant rect on Element.prototype, so
  // every element in the tree reports the same box and no element's real
  // screen position is readable from here at all. A gesture that needs to
  // start at a particular cell, thumb, or ruler tick therefore has to compute
  // its client pixels from camera math (the default camera this viewport
  // produces) rather than measure them -- and a capability that measured them
  // instead would read the viewport's own rect for every target and drive
  // every gesture from the same point while still passing.
  const resizeObserver = stubResizeObserver()
  stubBoundingClientRect({ left: 0, top: 0, width: VIEWPORT.width, height: VIEWPORT.height })
  stubPointerCapture()

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  active = { root, container }
  act(() => root.render(<App />))

  // Exactly one measurement, matching what a real ResizeObserver delivers on
  // first observation. useInitialCentering latches on this first non-zero
  // size and centers the camera.
  resizeObserver.resize(VIEWPORT.width, VIEWPORT.height)

  assertWindowMounted(requiredWindow)

  return { board: makeBoard(container), assertActive: () => assertActive(container) }
}
