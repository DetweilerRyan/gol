import { expect, type Locator, type Page } from '@playwright/test'
import {
  ALIVE_CELL_SELECTOR,
  CELL_ALIVE_ATTR,
  CELL_ALIVE_VALUE,
  CELL_DEAD_VALUE,
  cellSelector,
} from '../src/test-support/cellQuery.ts'

// The application's own boot camera -- centeredCamera(1280, 900) in
// src/camera.ts -- under playwright.config.ts's fixed 1280x900 viewport.
// CENTER and every pixel-math assertion in this suite is derived from these
// three numbers, so they are declared once here rather than re-literaled at
// each call site.
export const DEFAULT_CELL_SIZE_PX = 20
const DEFAULT_OFFSET_X = -32
const DEFAULT_OFFSET_Y = -22.5

// World (0,0) renders at screen (640, 450) -- the exact viewport center.
export const CENTER = { x: -DEFAULT_OFFSET_X * DEFAULT_CELL_SIZE_PX, y: -DEFAULT_OFFSET_Y * DEFAULT_CELL_SIZE_PX }

export function cellLocator(page: Page, x: number, y: number): Locator {
  return page.locator(cellSelector(x, y))
}

// The one way this suite asserts aliveness. It reads aria-pressed -- the
// accessible state a screen reader announces -- and not the bg-gray-900 /
// bg-white paint, which is a styling decision a black-box layer has no
// business knowing (rules/no-aliveness-by-paint-class.yml). The visual half
// of that contract lives in src/components/Cell.test.tsx's 'Cell paint'
// block, so nothing is lost by asserting only the accessible half here.
//
// Note this is STRICTER than the toHaveClass(/bg-white/) it replaced:
// toHaveAttribute compares the whole value, where the class regex matched a
// substring of a long className. Returns the assertion's promise rather than
// awaiting it, so a caller that forgets to await gets an unhandled rejection
// rather than a silent pass.
export function expectCellState(page: Page, x: number, y: number, state: 'alive' | 'dead'): Promise<void> {
  return expect(cellLocator(page, x, y)).toHaveAttribute(
    CELL_ALIVE_ATTR,
    state === 'alive' ? CELL_ALIVE_VALUE : CELL_DEAD_VALUE,
  )
}

export async function nextGeneration(page: Page) {
  await page.locator('#next-generation-button').click()
}

// Module-private: generationCount below is the only reader. The raw text is
// this file's business, the number is what a step or a spec asks for.
async function generationText(page: Page) {
  return page.getByText(/^Generation: \d+$/).textContent()
}

export async function zoomPercent(page: Page): Promise<number> {
  const text = await page.getByText(/^\d+%$/).textContent()
  return Number(text!.replace('%', ''))
}

export async function resetView(page: Page) {
  await page.locator('button[aria-label="Reset view"]').click()
}

export async function elementAtPoint(page: Page, x: number, y: number): Promise<string | null> {
  return page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.getAttribute('aria-label') ?? null, [
    x,
    y,
  ] as const)
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

export function patternsButton(page: Page): Locator {
  return page.locator('button[aria-label="Open pattern library"]')
}

export function patternLibraryModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Pattern library' })
}

export async function openPatternModal(page: Page) {
  await patternsButton(page).click()
}

export async function selectPattern(page: Page, name: string) {
  await openPatternModal(page)
  await page.getByRole('button', { name, exact: true }).click()

  // Headless UI's Dialog stays mounted through its ~100ms leave transition,
  // still covering the click point during that window -- waiting for it to
  // fully unmount here (rather than at each call site) keeps the subsequent
  // mouse.move/click in every caller from landing on the closing dialog
  // instead of the grid underneath.
  await expect(patternLibraryModal(page)).toHaveCount(0)
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

// Pans an off-screen world cell to a spot clear of the toolbar/scrollbars/HUD,
// leaving the camera there. Callers are responsible for getting back to the
// default view -- toggleFarCell and withCellInView below both do.
// Module-private: it leaves the camera moved, which is a trap for a caller
// that does not put it back. toggleFarCell and withCellInView below are the
// two supported ways to use it, and both restore the default camera.
async function panCellIntoView(page: Page, worldX: number, worldY: number) {
  const SPOT = { x: 200, y: 200 }
  const desiredOffsetX = worldX - SPOT.x / DEFAULT_CELL_SIZE_PX
  const desiredOffsetY = worldY - SPOT.y / DEFAULT_CELL_SIZE_PX
  const dx = -(desiredOffsetX - DEFAULT_OFFSET_X) * DEFAULT_CELL_SIZE_PX
  const dy = -(desiredOffsetY - DEFAULT_OFFSET_Y) * DEFAULT_CELL_SIZE_PX
  await dragPan(page, CENTER.x, CENTER.y, dx, dy, 20)
}

// Brings an off-screen world cell into view at a spot clear of the
// toolbar/scrollbars/HUD, toggles it, then resets back to the default
// camera so later pixel-math assertions can keep using the default
// (offsetX=-32, offsetY=-22.5) formulas.
export async function toggleFarCell(page: Page, worldX: number, worldY: number) {
  await panCellIntoView(page, worldX, worldY)
  await cellLocator(page, worldX, worldY).click()
  await resetView(page)
}

// Runs `body` with the given world cell guaranteed to have a DOM node.
//
// Only a bounded window of the infinite grid is mounted at a time, so a cell
// far from the camera has no element at all -- a click or an aria-pressed read
// on it fails with "no such element" rather than with anything about the
// game. A cell that is ALREADY mounted is left exactly where it is, so the
// default-camera pixel formulas above stay valid for the common case; only an
// off-screen one costs a pan, and the camera is put back afterwards even if
// `body` throws.
export async function withCellInView<T>(page: Page, worldX: number, worldY: number, body: () => Promise<T>) {
  if ((await cellLocator(page, worldX, worldY).count()) > 0) return body()
  await panCellIntoView(page, worldX, worldY)
  try {
    return await body()
  } finally {
    await resetView(page)
  }
}

// Clicks a single, possibly off-screen, cell -- the withCellInView + click
// pair every step that toggles one cell (rather than a batch) needs.
export async function clickCell(page: Page, x: number, y: number) {
  await withCellInView(page, x, y, () => cellLocator(page, x, y).click())
}

// ---------------------------------------------------------------------------
// Below this line: helpers added for the generated Playwright-BDD step modules
// under features/steps/. They are shared with the hand-written specs above --
// same layer, same rules -- but a step module's import allowlist is only
// playwright-bdd, @playwright/test and this file, so anything a step needs
// that it cannot reach through here has to be ADDED here rather than imported
// around.
// ---------------------------------------------------------------------------

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

// Where a world cell's top-left corner currently sits on screen -- i.e. the
// pixel worldToScreen puts it at. Comparing this against CENTER (where the
// origin sits under the default camera) is how a step states which way the
// camera moved without ever naming a camera field.
export async function cellScreenPosition(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const box = await cellLocator(page, x, y).boundingBox()
  if (!box) throw new Error(`Cell ${x}, ${y} is not mounted, so it has no screen position`)
  return { x: box.x, y: box.y }
}

// Aliveness as the domain word rather than as the attribute value, so a step
// can compare an observed outcome against a Gherkin Examples cell directly.
export async function cellState(page: Page, x: number, y: number): Promise<'alive' | 'dead'> {
  const value = await cellLocator(page, x, y).getAttribute(CELL_ALIVE_ATTR)
  if (value === CELL_ALIVE_VALUE) return 'alive'
  if (value === CELL_DEAD_VALUE) return 'dead'
  throw new Error(`Cell ${x}, ${y} announces ${CELL_ALIVE_ATTR}="${value}", which is neither alive nor dead`)
}

// Counts only MOUNTED live cells -- the grid is infinite, so there is no such
// thing as counting all of them. Sound wherever every cell that could change
// is inside the mounted window.
export function aliveCellCount(page: Page): Promise<number> {
  return page.locator(ALIVE_CELL_SELECTOR).count()
}

export async function generationCount(page: Page): Promise<number> {
  const text = await generationText(page)
  return Number(text!.replace('Generation: ', ''))
}

export async function zoomIn(page: Page) {
  await page.locator('button[aria-label="Zoom in"]').click()
}

export async function zoomOut(page: Page) {
  await page.locator('button[aria-label="Zoom out"]').click()
}

// THE ONE ARIA REACH-AROUND IN THIS FILE, and it is confined here on purpose.
//
// Ruler labels are <span> elements whose text is just the coordinate number
// (RulerLabel, rendered per major gridline by GridRuler.tsx, supplied through
// Grid's overlay slot), bucketed by axis via the class it's pinned to
// (top-0.5 for the x-axis strip, left-0.5 for the y-axis strip). No other
// on-screen text matches a bare "-?\d+" pattern (the zoom badge has a "%"
// suffix, the generation counter has a "Generation: " prefix).
//
// There is no accessible affordance that says which axis a label belongs to,
// which is why these two select on a Tailwind class. Moved here out of
// grid-reference-lines.e2e.spec.ts so the class name appears exactly once in
// features/ and the step module under features/steps/ carries no selector of
// its own. DELETION TRIGGER: the `ruler-label-axis-affordance` slice. When a
// real axis affordance lands, these two functions are what it replaces -- one
// edit, in this file, and nothing else in features/ has to move.
export function xAxisLabels(page: Page): Locator {
  return page.locator('span[class*="top-0.5"]')
}

export function yAxisLabels(page: Page): Locator {
  return page.locator('span[class*="left-0.5"]')
}

// The coordinate numbers currently on show along one edge of the viewport --
// what a player reads off the ruler.
export async function axisLabelValues(page: Page, axis: 'x' | 'y'): Promise<number[]> {
  const texts = await (axis === 'x' ? xAxisLabels(page) : yAxisLabels(page)).allTextContents()
  return texts.map(Number)
}

export type ScrollbarOrientation = 'horizontal' | 'vertical'

// Module-private: the three functions below are what a caller wants -- the
// locator itself only ever exists to be measured or dragged.
function scrollbarThumb(page: Page, orientation: ScrollbarOrientation): Locator {
  return page.locator(`[role="scrollbar"][aria-orientation="${orientation}"]`)
}

// How much of its track the thumb covers, as a fraction: 1 means the whole of
// the content fits in the viewport. The track is the thumb's own parent (it
// is inset from the viewport edge by the corner gap, so the viewport size is
// NOT the track length), reached by DOM position rather than by class.
//
// REACH-AROUND: this is geometry, because nothing announces it. The thumb
// carries aria-valuenow/valuemin/valuemax, which express only the thumb's
// POSITION -- there is no accessible expression of how much of the content is
// visible, so "fills its track" cannot be read out of the accessibility tree.
// That is a missing affordance rather than a test-side shortcut: proportion is
// the most useful thing a scrollbar tells a sighted user and this app tells a
// screen reader nothing about it. Adjudicated as an observability gap, not as
// a defect in this slice. DELETION TRIGGER: the
// `scrollbar-visible-proportion-affordance` slice. When the scrollbar
// announces its proportion, this function is what that announcement replaces
// -- one edit, in this file, exactly like the ruler pair above.
export async function thumbTrackFraction(page: Page, orientation: ScrollbarOrientation): Promise<number> {
  const thumb = scrollbarThumb(page, orientation)
  const thumbBox = (await thumb.boundingBox())!
  const trackBox = (await thumb.locator('..').boundingBox())!
  return orientation === 'horizontal' ? thumbBox.width / trackBox.width : thumbBox.height / trackBox.height
}

// Where along its track the thumb sits, 0 (start) to 100 (end), read from the
// accessible value the scrollbar announces rather than measured in pixels.
export async function thumbPositionPercent(page: Page, orientation: ScrollbarOrientation): Promise<number> {
  const value = await scrollbarThumb(page, orientation).getAttribute('aria-valuenow')
  return Number(value)
}

// The five cells that describe a blinker's shape, wherever it is centered:
// its three live cells along the blinker's own axis, and the two neighbors
// along the OTHER axis that prove it hasn't smeared sideways. Shared by
// cell-life-and-death.ts (a remembered center) and infinite-grid.ts (a
// literal one) -- the step registry is global, so this is the one place the
// shape itself is stated rather than restated per caller.
export async function expectBlinker(
  page: Page,
  centerX: number,
  centerY: number,
  orientation: 'horizontal' | 'vertical',
): Promise<void> {
  const [ax, ay] = orientation === 'horizontal' ? ([1, 0] as const) : ([0, 1] as const)
  const [dx, dy] = orientation === 'horizontal' ? ([0, 1] as const) : ([1, 0] as const)
  await withCellInView(page, centerX, centerY, async () => {
    await expectCellState(page, centerX - ax, centerY - ay, 'alive')
    await expectCellState(page, centerX, centerY, 'alive')
    await expectCellState(page, centerX + ax, centerY + ay, 'alive')
    await expectCellState(page, centerX - dx, centerY - dy, 'dead')
    await expectCellState(page, centerX + dx, centerY + dy, 'dead')
  })
}

// Scenario-scoped scratch state for the generated step modules.
//
// A Gherkin step's arguments are only its own placeholders, so a Then that
// speaks of something an earlier Given named ("the blinker should be
// vertical") needs somewhere to keep it. playwright-bdd's own answer is a
// custom fixture, which would have to live in a module the step modules'
// three-import allowlist forbids -- so the store is keyed by the `page`
// fixture instead, which Playwright creates fresh for every test and never
// shares between them. Every value a step needs to carry is a coordinate or a
// count, so `number` is the whole type: nothing here is a smuggling route for
// application state.
const scenarioNumbers = new WeakMap<Page, Map<string, number>>()

export function remember(page: Page, key: string, value: number): void {
  const store = scenarioNumbers.get(page) ?? new Map<string, number>()
  store.set(key, value)
  scenarioNumbers.set(page, store)
}

export function recall(page: Page, key: string): number {
  const value = scenarioNumbers.get(page)?.get(key)
  if (value === undefined) throw new Error(`No step in this scenario has established "${key}"`)
  return value
}
