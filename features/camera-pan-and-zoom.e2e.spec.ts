import { test, expect } from '@playwright/test'
import { CENTER, cellScreenPosition, dragPan, resetView, zoomPercent } from './e2e-helpers'
import { ALIVE_CELL_SELECTOR } from '../src/test-support/cellQuery.ts'

// Re-homed from camera-pan-and-zoom.feature by the feature-prose-honesty slice,
// under the acceptance-contract-rulings ruling that a geometric promise moved to
// the paired spec survives in features/** only if this header records it. Two
// promises live here and nowhere else in the contract:
//
//   1. Zooming in keeps the point it is anchored on fixed. The Gherkin clause
//      said "the point under the cursor should not move", which cannot be
//      stated without pixel vocabulary and cannot be observed at all from
//      jsdom. The toolbar's own anchor is the viewport center, so the spec
//      below asserts the world origin still renders at CENTER after a
//      zoom-in click.
//   2. Resetting the view puts the origin back at the exact center of the
//      viewport. The feature now states reset through the ruler instead --
//      the coordinate labels come back balanced around the origin -- which is
//      true but only to the ruler's 10-cell resolution. The pixel-exact form
//      is the last test in this file.
//
// Both are asserted below through the real UI. Neither may be deleted here
// without restating it in features/**.
//
// `triage-paired-specs` cut this file from six tests to three. The plain
// pan test and the two zoom-clamp tests went: the feature states all three
// claims, and its generated spec drives them through the same browser. What
// is left is the two promises above -- both pixel-exact, both unstateable in
// the Gherkin layer's vocabulary -- plus the toolbar hit-testing regression
// below, which is about stacking order and so has no domain counterpart at
// all.
//
// THE INSTRUMENT, AND WHY THE COMPARISON CARRIES NO TOLERANCE. Both promises
// are checked by reading where the origin cell RENDERS -- cellScreenPosition,
// the top-left corner of its box -- and comparing that to CENTER. They used
// to ask which element OCCUPIES the CENTER pixel (elementAtPoint), which is a
// different and much weaker question, and one the app itself never asks:
// pointer capture retargets a real click to #grid-content and Grid's onTap
// resolves the cell arithmetically through screenToWorld, so no user
// interaction goes through document.elementFromPoint at all. CENTER is cell
// (0,0)'s top-left CORNER, so a cell-granular answer there passed anywhere
// from ~0.9px BEFORE that corner (the hit-test's own looseness, which favours
// the later-in-DOM sibling) to a full cell -- 20px -- past it. This file
// claimed pixel-exact and checked to -0.9/+20px.
//
// Exact equality is a measured choice rather than an aspiration. Cell (0,0)'s
// box origin read exactly {x: 640, y: 450} in 90 of 90 samples: ten
// consecutive reads in each of the three states asserted here (boot at 100%,
// after one zoom-in to 125%, and after the pan/zoom/reset sequence below),
// repeated over three separate runs. Measured sub-pixel noise is therefore
// 0.000px, and a tolerance would only widen the pass window for drift nobody
// has observed -- so this catches ANY drift, where the form it replaces
// tolerated up to a whole cell of it. The 125% state is the only one where
// the arithmetic is not binary-exact (offsetX becomes -25.6), and it is the
// one measured most sceptically for that reason. The same quantity is already
// compared exactly in features/steps/camera-pan-and-zoom.ts and
// features/steps/grid-scrollbars.ts, so a tolerance here would also be a
// second, weaker phrasing of an assertion this layer already states exactly.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('zooming in via the toolbar keeps the world origin fixed at the viewport center', async ({ page }) => {
  await page.locator('button[aria-label="Zoom in"]').click()

  await expect.poll(() => zoomPercent(page)).toBe(125)
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual(CENTER)
})

test('toolbar buttons never toggle whatever cell happens to be positioned underneath them', async ({ page }) => {
  // Regression test: the toolbar previously only stopped propagation on
  // pointerdown, not pointerup, so releasing a click over the toolbar could
  // bubble through to the grid's own handlePointerUp and toggle the cell
  // rendered underneath the button.
  await page.locator('button[aria-label="Zoom in"]').click()
  await page.locator('button[aria-label="Zoom out"]').click()
  await page.locator('button[aria-label="Reset view"]').click()

  await expect(page.locator(ALIVE_CELL_SELECTOR)).toHaveCount(0)
})

test('resetting the view returns to the default centered zoom regardless of prior pan/zoom', async ({ page }) => {
  await dragPan(page, 300, 300, 500, 500, 20)
  await page.locator('button[aria-label="Zoom in"]').click()
  await page.locator('button[aria-label="Zoom in"]').click()

  await resetView(page)

  await expect.poll(() => zoomPercent(page)).toBe(100)
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual(CENTER)
})
