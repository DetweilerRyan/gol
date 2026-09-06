import { test, expect, type Page } from '@playwright/test'
import { CENTER, cellScreenPosition, clickGridAt, dragPan, resetView, zoomIn, zoomPercent } from './e2e-helpers'
import { cellSelector } from '../src/test-support/cellQuery.ts'

interface GlideFrame {
  atMs: number
  sizePx: number
  leftPx: number
  topPx: number
}

// Samples the ORIGIN CELL'S OWN RENDERED BOX once per animation frame, in the
// browser, across whatever act the caller performs. A cell's width is its
// cellSize in px (Cell.tsx sets it as an inline style), so this reads the
// zoom the GRID is actually painted at -- which is a different quantity from
// the percentage the badge announces, and the whole reason these three tests
// exist.
//
// Re-queried every frame rather than closed over once: a zoom re-lays-out the
// grid and can remount the node, and a stale element handle would freeze the
// sample at the size it had when it was captured -- silently turning a
// snapping grid into a passing test.
async function sampleFramesDuring(page: Page, act: () => Promise<void>): Promise<GlideFrame[]> {
  await page.evaluate(
    ([selector, windowMs]) => {
      const frames: GlideFrame[] = []
      const store = window as unknown as { __glideFrames: GlideFrame[]; __glideDone: boolean }
      store.__glideFrames = frames
      store.__glideDone = false
      const startedAt = performance.now()
      const tick = () => {
        const box = document.querySelector(selector)?.getBoundingClientRect()
        if (box)
          frames.push({ atMs: performance.now() - startedAt, sizePx: box.width, leftPx: box.left, topPx: box.top })
        if (performance.now() - startedAt < (windowMs as number)) requestAnimationFrame(tick)
        else store.__glideDone = true
      }
      requestAnimationFrame(tick)
    },
    [cellSelector(0, 0), SAMPLE_WINDOW_MS] as [string, number],
  )
  await act()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __glideDone: boolean }).__glideDone)).toBe(true)
  return page.evaluate(() => (window as unknown as { __glideFrames: GlideFrame[] }).__glideFrames)
}

// Comfortably longer than GLIDE_DURATION_MS (200ms), so every sample set runs
// past the end of the glide and the resting frames are in it too. Not
// imported from src/zoomGlide.ts -- the import allowlist forbids it, and a
// black-box spec that read the duration from the module would stop being able
// to notice the duration changing.
const SAMPLE_WINDOW_MS = 700

// Re-homed from camera-pan-and-zoom.feature by the feature-prose-honesty slice,
// under the acceptance-contract-rulings ruling that a geometric promise moved to
// the paired spec survives in features/** only if this header records it. Two
// promises live here and nowhere else in the contract:
//
//   1. Zooming in keeps the point it is anchored on fixed. The toolbar's own
//      anchor is the viewport center, so the first test below asserts the
//      world origin still renders at CENTER after a zoom-in click.
//      (b) THE CHANNEL THAT DOES NOT CARRY IT: camera-pan-and-zoom.feature
//      observes a zoom only through the badge, and src/camera.ts's
//      zoomPercentage is Math.round(cellSize / 20 * 100) -- a readout of how
//      big a cell is, with no notion of WHERE the grid sits. A zoom that slid
//      its anchor clear across the viewport still reads 125, so every scenario
//      in that feature is green on exactly the defect this test exists for.
//      (c) WHAT WOULD MAKE (b) FALSE: the badge, or any other channel the app
//      announces, reporting where the view is anchored and not only its scale.
//   2. Resetting the view puts the origin back at the exact center of the
//      viewport. The feature states reset through the ruler instead -- the
//      coordinate labels come back balanced around the origin -- and the
//      pixel-exact form is the third test in this file.
//      (b) THE CHANNEL THAT DOES NOT CARRY IT: the ruler announces a label
//      every 10 cells, so "balanced around the origin" resolves only to that
//      granularity; a reset landing a cell or two off center still balances
//      them and still reads 100%. Only the origin cell's own measured box sees
//      the remainder.
//      (c) WHAT WOULD MAKE (b) FALSE: the ruler announcing labels at a finer
//      interval, or any control announcing the camera's resting position.
//
// NEITHER REASON IS A VOCABULARY ONE, and this header said it was until
// `correct-hand-written-spec-headers` checked. `.gherkin-lintrc`'s
// no-restricted-patterns bans ALTITUDE vocabulary -- offsetX, cell size,
// delta, world coordinate -- and not the word "pixel", which this very feature
// and grid-scrollbars.feature both use in step text. The jsdom half of that
// old sentence outlived its subject too: `delete-step-test-layer` removed the
// last jsdom execution of anything under features/, so no claim here is
// licensed by what jsdom cannot see.
//
// Both are asserted below through the real UI. Neither may be deleted here
// without restating it in features/**.
//
// A THIRD GROUP JOINED THEM IN smooth-zoom-transitions -- the glide's own
// rendered geometry, three claims, in the describe block at the foot of this
// file. Same rule: none may be deleted without being restated in features/**.
// Not "none CAN be", which this paragraph said until
// `correct-hand-written-spec-headers` checked it against that block's own
// (b)/(c) -- two of the three become statable the day the app announces a
// precise resting zoom or where the view is anchored. Read the conditions
// there rather than treating the group as permanently unreachable.
//
// `triage-paired-specs` cut this file from six tests to three. The plain
// pan test and the two zoom-clamp tests went: the feature states all three
// claims, and its generated spec drives them through the same browser. What
// is left is the two promises above -- both pixel-exact, and both invisible to
// the badge and the ruler for the reasons each records.
//
// A FOURTH TEST LEFT LATER, BY CONVERSION AND NOT BY SUBSUMPTION. "toolbar
// buttons never toggle whatever cell happens to be positioned underneath
// them" asserted that no cell was alive after three toolbar presses, and its
// own note had already reported the claim as sayable at domain altitude and
// as `architect`'s to rule on. It ruled, in `rule-on-chrome-propagation-
// guards`: the claim is contract-eligible, so camera-pan-and-zoom.feature's
// "Pressing a zoom control brings no cell to life underneath it" states it
// now, and the layout fact it leans on is prose beside that scenario rather
// than a precondition step. Read the scenario for what the promise is; this
// paragraph only records where it went.
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
  // The origin needs an element for its position to be readable, and once only
  // live cells render, bringing it to life is the only way it gets one. Clicked
  // at CENTER, the pixel the default camera puts the origin at, before anything
  // moves the camera -- so the seeding itself asserts nothing and the claim
  // below is unchanged.
  await clickGridAt(page, CENTER)

  await page.locator('button[aria-label="Zoom in"]').click()

  await expect.poll(() => zoomPercent(page)).toBe(125)
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual(CENTER)
})

test('resetting the view returns to the default centered zoom regardless of prior pan/zoom', async ({ page }) => {
  // The origin needs an element for its position to be readable, and once only
  // live cells render, bringing it to life is the only way it gets one. Clicked
  // at CENTER, the pixel the default camera puts the origin at, before anything
  // moves the camera -- so the seeding itself asserts nothing and the claim
  // below is unchanged.
  await clickGridAt(page, CENTER)

  await dragPan(page, 300, 300, 500, 500, 20)
  await page.locator('button[aria-label="Zoom in"]').click()
  await page.locator('button[aria-label="Zoom in"]').click()

  await resetView(page)

  await expect.poll(() => zoomPercent(page)).toBe(100)
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual(CENTER)
})

// THE GRID'S OWN GEOMETRY DURING A GLIDE -- product's VERIFY-mode outline for
// smooth-zoom-transitions, recorded here because it is the accepted behaviour
// and this file is where it is written down.
//
// (b) THE CHANNEL THAT DOES NOT CARRY THESE THREE. camera-pan-and-zoom.feature
// states the glide through the ZOOM READOUT -- the percentages the badge
// passes through -- and a readout is not the grid. An implementation that
// animated the badge over a grid that snapped would satisfy every scenario in
// that feature and be exactly the defect this slice was opened to remove.
// Nothing in features/**, and no unit test, looks at the painted result.
//
// The badge is blind in a second, narrower way that matters to the last two:
// src/camera.ts's zoomPercentage is Math.round(cellSize / 20 * 100), so one
// announced percent is a fifth of a pixel of cellSize. A glide finishing a
// tenth of a pixel short of 25px, or sliding its anchor while it ran, reads
// 125 either way. Only the sampled box sees it.
//
// (c) WHAT WOULD MAKE (b) FALSE: the app announcing its RESTING zoom precisely
// rather than rounded (which would reach the second test), or announcing where
// the view is anchored (the third). Note the first test would survive both --
// its subject is that intermediate states exist at all, and no announced
// channel offers a frame-by-frame history. Re-check the other two if a precise
// readout ever lands; do not read this as a licence to delete any of them now.
//
// SHOWN TO FAIL ON THE BEHAVIOUR IT REPLACED, which is the bar this slice set
// for its own tests. The instantaneous zoom is not gone -- it is what the app
// still does under prefers-reduced-motion, on the same code path, so it can be
// run against without touching src/. Measured that way (a temporary
// emulateMedia beforeEach, since a describe-level test.use silently did not
// apply): the FIRST test below fails, 0 intermediate sizes against the 3 it
// requires, while the other two pass. Read that split honestly -- only the
// first one drives the behaviour. Landing exactly on 25px and holding the
// anchor were both already true of an instantaneous zoom, so those two are
// regression guards on a glide that could break them, not evidence of one.
test.describe('the rendered grid, not the readout', () => {
  test('a zoom in glides the grid through intermediate sizes, not only the badge', async ({ page }) => {
    await clickGridAt(page, CENTER)

    const frames = await sampleFramesDuring(page, () => zoomIn(page))

    const sizes = [...new Set(frames.map((frame) => frame.sizePx))]
    const intermediate = sizes.filter((size) => size > DEFAULT_CELL_PX && size < ZOOMED_IN_CELL_PX)
    expect(intermediate.length).toBeGreaterThanOrEqual(3)
    expect(Math.max(...sizes)).toBe(ZOOMED_IN_CELL_PX)
  })

  test('a zoom in lands the grid exactly on the pinned size, not a fraction short', async ({ page }) => {
    await clickGridAt(page, CENTER)

    const frames = await sampleFramesDuring(page, () => zoomIn(page))

    await expect.poll(() => zoomPercent(page)).toBe(125)
    expect(frames[frames.length - 1].sizePx).toBe(ZOOMED_IN_CELL_PX)
  })

  // EXACT, WITH NO TOLERANCE, ON THE SAME MEASURED BASIS AS THE TWO PROMISES
  // AT THE TOP OF THIS FILE. The origin cell's corner read exactly
  // {640, 450} on every one of the ~70 frames sampled per run, across three
  // consecutive runs -- 0.000px of drift, mid-glide included, even though
  // cellSize is a fraction on every frame between the endpoints. So a
  // tolerance would only widen the window for drift nobody has observed. What
  // it would hide is the failure this test exists for: a glide that
  // interpolated the OFFSETS as well as the size would slide the grid under
  // the cursor while it zoomed, by pixels rather than by fractions.
  test('the anchor holds on every frame of a glide, not only at its ends', async ({ page }) => {
    await clickGridAt(page, CENTER)

    const frames = await sampleFramesDuring(page, () => zoomIn(page))

    const corners = [...new Set(frames.map((frame) => `${frame.leftPx},${frame.topPx}`))]
    expect(corners).toEqual([`${CENTER.x},${CENTER.y}`])
  })
})

const DEFAULT_CELL_PX = 20
const ZOOMED_IN_CELL_PX = 25
