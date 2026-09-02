// SCREENPLAY: the Interactions -- one act a user performs, each of them, and
// nothing read back out. A spec or a step composes these; what the app then
// says about it is questions.ts's business.
//
// EXPECT AS A WAIT, AND THAT IS LICENSED HERE. openPatternModal and
// choosePatternFromLibrary each await a Playwright retrying assertion, and in
// both cases it is a WAIT rather than a statement of accepted behaviour: the
// first says the modal has actually mounted before anything reads it, the
// second that Headless UI's ~100ms leave transition has finished and the
// dialog no longer covers the click point. In Playwright the retrying
// assertion IS the sanctioned synchronization primitive, and rewriting these
// as page.waitForSelector would be worse on Playwright's own advice. That is
// exactly why rules/no-expect-in-screenplay-questions.yml is scoped to
// questions.ts alone rather than to this directory -- a directory-wide ban
// would report these two correct functions.
//
// AND WHY THERE IS NO interactions -> questions EDGE. dragScrollbarThumb needs
// the thumb's box, and it measures elements.ts's scrollbarThumb directly
// rather than asking a Question for it. Going through the Question layer would
// put an edge on the graph for the sake of one boundingBox() call; the layering
// under the barrel is what makes the extraction acyclic, so it is kept thin on
// purpose.
import { expect, type Page } from '@playwright/test'
import { patternLibraryModal, patternsButton, scrollbarThumb, type ScrollbarOrientation } from './elements.ts'

// Every scenario starts on a freshly loaded grid, but the step that opens it
// is a scenario's FIRST step in one feature and a LATER one in another:
// "a camera centered on the origin at the default zoom" opens every
// camera-pan-and-zoom scenario and follows a live-cell step in
// grid-scrollbars'. Navigating unconditionally would wipe the cells the
// earlier step just placed, so this navigates only from the blank page
// Playwright hands each test.
export async function openGrid(page: Page) {
  if (page.url().startsWith('http')) return
  await page.goto('/')
}

export async function nextGeneration(page: Page) {
  await page.locator('#next-generation-button').click()
}

export async function resetView(page: Page) {
  await page.locator('button[aria-label="Reset view"]').click()
}

export async function zoomIn(page: Page) {
  await page.locator('button[aria-label="Zoom in"]').click()
}

export async function zoomOut(page: Page) {
  await page.locator('button[aria-label="Zoom out"]').click()
}

// TWO CLICKS A GLIDE CANNOT OUTRUN, and the tightest form of them a pointer
// can actually produce: clickCount 2 is one double-click gesture, so the
// second press follows the first with no artificial delay rather than after
// another round trip from the test process.
//
// What the scenario using it discriminates depends on the second click
// landing while the first is still moving, and nothing here can name a
// duration to guarantee that -- the contract deliberately never names one.
// What holds it up is the SIBLING scenario: "should have passed through the
// levels in between" requires several distinct readouts, which no animation
// short enough to finish inside a double-click's own gap can produce. The two
// scenarios are load-bearing for each other, so don't delete that one as
// redundant with this.
export async function zoomInTwiceQuickly(page: Page) {
  await page.locator('button[aria-label="Zoom in"]').click({ clickCount: 2 })
}

// Set before the app is opened, so it never depends on the app noticing the
// preference CHANGE -- a player who prefers reduced motion has that preference
// before they arrive, and emulating it that way is also the form that works
// whether the app reads the query once at mount or subscribes to it.
export async function preferReducedMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

// useGridPointerGestures reports panByPixels per pointermove with the
// incremental delta (drag.lastX/lastY), so the net camera shift always equals
// the requested (dx, dy) regardless of step count.
export async function dragPan(page: Page, fromX: number, fromY: number, dx: number, dy: number, steps = 10) {
  await page.mouse.move(fromX, fromY)
  await page.mouse.down()
  await page.mouse.move(fromX + dx, fromY + dy, { steps })
  await page.mouse.up()
}

// TOGGLES OR STAMPS THE CELL AT A PIXEL, which is what a mouse user does and
// what Grid actually resolves: useGridPointerGestures takes pointer capture on
// #grid-content, so the click retargets to the container and onTap resolves the
// cell arithmetically through screenToWorld. Driving a cell's own element with
// .click() was never that route -- it worked only because a dead cell happened
// to have an element under the pointer, and it stops working entirely when dead
// cells stop rendering.
//
// The caller supplies the pixel, computed from the cell's coordinate (see
// viewport.ts's defaultViewCellCenterPx). Nothing here resolves a pixel back to
// an element.
export async function clickGridAt(page: Page, pixel: { x: number; y: number }) {
  await page.mouse.click(pixel.x, pixel.y)
}

// Puts the pointer over a world cell, which is what arms the preview: Grid's
// trackHover reports the cell under the pointer, and nothing is previewed
// until it has. Same conversion as clickGridAt above and for the same reason --
// a hover aimed at a dead cell's element has nothing to aim at after the flip.
export async function hoverGridAt(page: Page, pixel: { x: number; y: number }) {
  await page.mouse.move(pixel.x, pixel.y)
}

// Playwright keeps keyboard focus on the button that was last clicked.
// "Enter with nothing focused" scenarios need an explicit blur first --
// otherwise Enter would trigger that button's own native click instead of
// exercising the no-op case they're meant to check.
export async function blurFocus(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

export async function shiftWheel(page: Page, atX: number, atY: number, deltaX: number, deltaY: number) {
  await page.mouse.move(atX, atY)
  await page.keyboard.down('Shift')
  await page.mouse.wheel(deltaX, deltaY)
  await page.keyboard.up('Shift')
}

export async function dragScrollbarThumb(page: Page, orientation: ScrollbarOrientation, deltaPx: number) {
  const box = (await scrollbarThumb(page, orientation).boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  if (orientation === 'horizontal') {
    await page.mouse.move(x + deltaPx, y, { steps: 10 })
  } else {
    await page.mouse.move(x, y + deltaPx, { steps: 10 })
  }
  await page.mouse.up()
}

// Opens the library AND waits for it to be there. The wait is the load-bearing
// half: every toHaveCount(0) this file asserts about the modal is satisfied
// vacuously by a locator that resolves to nothing, so "the library closed" only
// means anything once "the library was open" has been asserted through the same
// locator. Positively asserting it here covers both negative sites, since every
// path to either one opens the modal through this function first.
//
// It also removes a latent race: patternCategoryInLibrary's evaluateAll does
// not auto-wait, so it would read an empty list off a dialog React had not
// mounted yet.
export async function openPatternModal(page: Page) {
  await patternsButton(page).click()
  await expect(patternLibraryModal(page)).toHaveCount(1)
}

// Arms a pattern from an ALREADY-OPEN library. Split out of the selectPattern
// task because pattern-library.feature reads the library's contents before it
// arms anything: its category step needs the modal open, and its shape step
// then arms from that same open modal. Re-opening in between is not available
// -- the modal makes the rest of the page inert, so the Patterns button cannot
// be reached while it is up.
export async function choosePatternFromLibrary(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click()

  // Headless UI's Dialog stays mounted through its ~100ms leave transition,
  // still covering the click point during that window -- waiting for it to
  // fully unmount here (rather than at each call site) keeps the subsequent
  // mouse.move/click in every caller from landing on the closing dialog
  // instead of the grid underneath.
  await expect(patternLibraryModal(page)).toHaveCount(0)
}

// The four arrow keys, by the direction a player would name rather than by
// the key's own DOM name. Throwing on anything else is load-bearing for
// npm run acceptance-mutation: a mutated <direction> Examples cell must fail
// by name here, not press nothing and let the scenario decide the focus
// simply did not move.
const ARROW_KEYS: Readonly<Record<string, string>> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
}

export async function moveFocus(page: Page, direction: string) {
  const key = ARROW_KEYS[direction]
  if (!key) throw new Error(`"${direction}" names no direction the focus can move in`)
  await page.keyboard.press(key)
}

export async function pressKey(page: Page, key: string) {
  await page.keyboard.press(key)
}

export async function tabForward(page: Page) {
  await page.keyboard.press('Tab')
}

// Leaves the grid in the forward direction and comes back the way it went, so
// what is being checked is the grid's own memory of where the focus was --
// not a fresh entry that happens to start in the same place.
export async function tabAwayAndBack(page: Page) {
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
}
