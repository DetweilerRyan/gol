// SCREENPLAY: the Expectations -- the assertions this suite makes about a cell,
// stated once so that fifteen specs and step modules cannot each phrase them
// slightly differently.
//
// This is where an assertion over a Question or a Task belongs, and it is the
// other half of rules/no-expect-in-screenplay-questions.yml: a Question returns
// what the app says and an Expectation decides whether that is right. The
// expectations -> questions edge below is that sentence realized: expectCellState
// asks cellState what the cell says and decides. It closes no cycle -- questions
// imports elements and nothing above it.
import { expect, type Page } from '@playwright/test'
import { CELL_ALIVE_ATTR, CELL_ALIVE_VALUE } from '../../src/test-support/cellQuery.ts'
import { cellLocator } from './elements.ts'
import { cellState } from './questions.ts'
import { withCellInView } from './tasks.ts'

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
//
// THE TWO STATES ARE ASSERTED DIFFERENTLY, AND DELIBERATELY SO. Alive keeps the
// attribute assertion: a live cell always has an element, so toHaveAttribute's
// auto-wait for it is exactly right and nothing weaker should be accepted. Dead
// goes through cellState, which treats an absent element and a present
// unpressed one as the same answer -- both are real once dead cells stop
// rendering, and the focus cursor is the mounted case (see cellState's header).
// Polled rather than awaited once, so it keeps the retry window the attribute
// assertion has.
export function expectCellState(page: Page, x: number, y: number, state: 'alive' | 'dead'): Promise<void> {
  if (state === 'alive') return expect(cellLocator(page, x, y)).toHaveAttribute(CELL_ALIVE_ATTR, CELL_ALIVE_VALUE)
  return expect.poll(() => cellState(page, x, y)).toBe('dead') as unknown as Promise<void>
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
