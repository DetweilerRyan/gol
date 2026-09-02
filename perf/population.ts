// Population assertions shared by every seeded scenario. A silently-failed
// seed (a typo'd query string, liveCellSeed.ts's parseSeedRequest returning
// undefined for an input that looked valid, App.tsx's initialLiveCells prop
// wiring regressing) produces a perfectly plausible-looking measurement of
// an *empty* grid -- nothing else in this harness would notice, since an
// empty-grid pan is a legitimate scenario in its own right (see
// pan-default-empty). Calling one of these before a scenario's rep loop
// starts is also the only thing in this repo that exercises App.tsx's
// initialLiveCells prop end to end -- that prop has no unit test, since
// App.tsx is composition-root code outside the unit-test gates (see
// CLAUDE.md's Architecture section).
import { expect, type Page } from '@playwright/test'
import { centeredCamera } from '../src/camera.ts'
import { computeVisibleRange } from '../src/gridGeometry.ts'
import { ALIVE_CELL_SELECTOR } from '../src/test-support/cellQuery.ts'

// In-view scenarios (spread small enough that the default camera's viewport
// sees most or all of the seeded square) can check directly in the DOM:
// Cell.tsx marks a live cell's button aria-pressed="true" (see its own
// comment), so counting those buttons is a direct census of what's currently
// rendered alive. Reuses the app's own centeredCamera/
// computeVisibleRange (src/ root, same TS program as perf/ -- see
// tsconfig.app.json's `include`) to compute the expected visible fraction,
// rather than re-deriving the viewport-vs-seed-square intersection by hand,
// so this can't drift from what LifeBoard itself computes.
//
// The `spread` square is centered on world (0,0), same as the default
// camera -- see liveCellSeed.ts's placement and camera.ts's centeredCamera.
// Bounded by a generous +-30% band around the analytically-expected count:
// loose enough to absorb the seed LCG's sampling variance, tight enough that
// an unseeded/silently-empty grid (aliveCount near 0) always fails it.
export async function assertInViewAlivePopulation(
  page: Page,
  viewport: { width: number; height: number },
  requestedCount: number,
  spread: number,
): Promise<void> {
  const camera = centeredCamera(viewport.width, viewport.height)
  const range = computeVisibleRange(camera, viewport.width, viewport.height)
  const visibleXSpan = Math.max(0, Math.min(range.maxX, spread) - Math.max(range.minX, -spread) + 1)
  const visibleYSpan = Math.max(0, Math.min(range.maxY, spread) - Math.max(range.minY, -spread) + 1)
  const seededArea = (2 * spread + 1) ** 2
  const expectedFraction = (visibleXSpan * visibleYSpan) / seededArea
  const expectedCount = requestedCount * expectedFraction

  // expect.poll rather than a bare .count(): a single snapshot has no
  // auto-wait, so a larger viewport -- which mounts more cells and takes longer
  // to settle -- loses the race first. Measured: generation-advance-1k-inview
  // failed at 1920x1080 with 6 alive against ~967 expected, passed at 1280x900
  // in the SAME run, and passed 3/3 re-run alone. The bounds are a range rather
  // than an equality, which is why this is expect.poll over a predicate rather
  // than toHaveCount.
  //
  // Two consequences of a flaky guard here, both of which cost a real run
  // before this was fixed: a nonzero test:perf exit short-circuits a chained
  // `&& npm run perf-report`, leaving the PREVIOUS latest.md in place reading
  // as a fresh run; and the failed scenario's stale raw sample survives in
  // reports/perf/raw/, so a later report silently blends two trees.
  let aliveCount = 0
  await expect
    .poll(
      async () => {
        aliveCount = await page.locator(`#grid-content ${ALIVE_CELL_SELECTOR}`).count()
        return aliveCount
      },
      { message: `expected ~${expectedCount} alive cells in view, requestedCount=${requestedCount}` },
    )
    .toBeGreaterThan(expectedCount * 0.7)
  expect(aliveCount).toBeLessThan(expectedCount * 1.3)
}

// Off-screen scenarios seed far enough outside the default viewport (spread
// well beyond what any viewport in this suite renders) that the DOM can't
// see them at all -- the only way to check the seed took is scrollbar
// geometry, which derives from computeContentBounds over the *whole*
// live-cell set (see scrollbars.ts's computeAxisScrollbarMetrics), not
// whatever's currently rendered. A populated grid whose content span
// (spread=200 at the default cellSize is ~8000px wide) dwarfs any viewport
// in this suite shrinks the thumb to well under half the track; an empty or
// silently-unseeded grid leaves the thumb spanning the full track
// (thumbRatio == 1, computeAxisScrollbarMetrics's "nothing to scroll" case).
// This holds regardless of camera pan position -- see the derivation in this
// slice's handoff notes -- so it's safe to call before or after panning.
export async function assertOffscreenSeedTookEffect(
  page: Page,
  viewport: { width: number; height: number },
): Promise<void> {
  const box = await page.locator('[role="scrollbar"][aria-orientation="horizontal"]').boundingBox()
  if (!box) {
    throw new Error('assertOffscreenSeedTookEffect: horizontal scrollbar thumb not found')
  }
  expect(box.width, 'expected a visibly shrunk scrollbar thumb for an off-screen-seeded grid').toBeLessThan(
    viewport.width * 0.5,
  )
}
