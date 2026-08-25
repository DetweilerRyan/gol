import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { centeredCamera, panCamera, zoomCameraAtPoint, ZOOM_FACTOR, zoomPercentage, type Camera } from '../src/camera'
import { computeMajorGridlines, computeVisibleRange, type MajorGridlines } from '../src/gridGeometry'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './camera-pan-and-zoom.feature')

// The viewport these scenarios are told about. Only the reset scenario's prose
// names it, but every scenario depends on it: "centered on the origin" is
// centering *for* a viewport, and reset returns the view to the one it started
// in, so the two must be the same viewport rather than coincidentally equal
// literals.
const VIEWPORT_WIDTH_PX = 800
const VIEWPORT_HEIGHT_PX = 600

// "A camera centered on the origin at the default zoom" is the application's
// own boot state: useInitialCentering hands centeredCamera the first non-zero
// viewport measurement it sees. A camera whose offset is merely zero is a
// different thing -- worldToScreen puts the origin in the top-left CORNER, not
// the middle of the view -- and the only vocabulary that could honestly
// describe that state is the offset wording .gherkin-lintrc bans from the
// contract outright. So the contract cannot mean it, and this is what it means.
const DEFAULT_CAMERA: Camera = centeredCamera(VIEWPORT_WIDTH_PX, VIEWPORT_HEIGHT_PX)

// One zoom step, in both directions, is ZOOM_FACTOR -- the only step size the
// application has. The zoom-in and zoom-out toolbar buttons hardcode it and no
// affordance takes a factor at all, so a step passing some other number here
// would be specifying a function signature rather than anything a player can
// do. The percentages the scenarios assert are the independent half: they come
// from zoomPercentage, not from this constant.
function zoomOneStep(camera: Camera, direction: 'in' | 'out'): Camera {
  return zoomCameraAtPoint(camera, 0, 0, direction === 'in' ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)
}

// Zooms one step at a time until the clamp saturates -- the same ladder a
// player climbs by clicking the toolbar button repeatedly, which is what makes
// "until the zoom stops changing" a statement about the application rather
// than about an arbitrary factor.
function zoomUntilSettled(camera: Camera, direction: 'in' | 'out'): Camera {
  let previousCellSize: number
  do {
    previousCellSize = camera.cellSize
    camera = zoomOneStep(camera, direction)
  } while (camera.cellSize !== previousCellSize)
  return camera
}

// The ruler's labels for a viewport, per axis: what a player reads off the top
// and left edges of the screen. The origin sitting at the middle of the view is
// then stateable without a single pixel -- on each axis, every label on show has
// its own negation on show too.
function coordinateLabelsInView(camera: Camera, viewportWidthPx: number, viewportHeightPx: number): MajorGridlines {
  return computeMajorGridlines(computeVisibleRange(camera, viewportWidthPx, viewportHeightPx))
}

function ascending(labels: readonly number[]): number[] {
  return [...labels].sort((a, b) => a - b)
}

// Asserted per axis, and that is the load-bearing part. This instrument first
// merged both axes into one multiset -- deliberately, on the reasoning that the
// prose needs no axis attribution -- but the prose not naming an axis does not
// license the assertion to discard it, and the merged form is far weaker than
// the sentence it claims to check. Measured by sweeping the offsets an 800x600
// viewport can hold at the default zoom: merged passes for a camera up to 57
// cells (1140px) off-centre, wider than the viewport itself and with the origin
// nowhere on screen (x labels all negative, y labels all positive, and each the
// other's negation), and merged passes a centeredCamera that transposes its two
// viewport arguments. Per axis, both of those go red, and a passing camera is
// pinned to within 2.95 cells (59px) on x and 2 cells (40px) on y.
//
// That residual band is the honest limit of any label-based instrument, and it
// is the trade being accepted here rather than one being overlooked: gridlines
// fall every MAJOR_GRIDLINE_INTERVAL cells, widened by VISIBLE_BUFFER_CELLS, so
// nothing finer than a gridline is observable from the ruler at all. The
// pixel-exact form of this promise is re-homed to camera-pan-and-zoom.e2e.spec.ts,
// where a real browser can measure it -- see that file's header.
function expectBalancedAroundOrigin(labels: readonly number[]): void {
  // Non-empty first: an empty label set is trivially balanced, so without this
  // the clause would also pass for an axis showing no coordinates at all.
  expect(labels.length).toBeGreaterThan(0)
  // `|| 0` normalizes the -0 that negating the origin's own label produces,
  // which toEqual otherwise reports as a mismatch against a plain 0 -- the same
  // normalization gridlinesInRange applies for the same reason.
  expect(ascending(labels)).toEqual(ascending(labels.map((label) => -label || 0)))
}

describeFeature(feature, ({ Scenario }) => {
  Scenario('Panning moves the viewport without changing the zoom level', ({ Given, When, Then, And }) => {
    let before: Camera
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      before = DEFAULT_CAMERA
      camera = before
    })
    When('I pan the camera by 40 pixels right and 20 pixels down', () => {
      camera = panCamera(camera, 40, 20)
    })
    // Stated against where the camera started rather than against zero. The
    // absolute form these two assertions used to take was only ever meaningful
    // while the Given sat at offset zero: from a genuinely centered camera it
    // passes for a pan that never happened.
    Then('the camera should have moved left and up over the grid', () => {
      expect(camera.offsetX).toBeLessThan(before.offsetX)
      expect(camera.offsetY).toBeLessThan(before.offsetY)
    })
    And('the zoom level should be unchanged', () => {
      expect(camera.cellSize).toBe(before.cellSize)
    })
  })

  Scenario('Zooming in once raises the zoom percentage one step', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I zoom in once', () => {
      camera = zoomOneStep(camera, 'in')
    })
    Then('the zoom percentage should be 125', () => {
      expect(zoomPercentage(camera)).toBe(125)
    })
  })

  Scenario('Zooming out once lowers the zoom percentage one step', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I zoom out once', () => {
      camera = zoomOneStep(camera, 'out')
    })
    Then('the zoom percentage should be 80', () => {
      expect(zoomPercentage(camera)).toBe(80)
    })
  })

  Scenario('Zooming in stops at the maximum zoom', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I zoom in repeatedly until the zoom stops changing', () => {
      camera = zoomUntilSettled(camera, 'in')
    })
    Then('the zoom percentage should be 300', () => {
      expect(zoomPercentage(camera)).toBe(300)
    })
  })

  Scenario('Zooming out stops at the minimum zoom', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I zoom out repeatedly until the zoom stops changing', () => {
      camera = zoomUntilSettled(camera, 'out')
    })
    Then('the zoom percentage should be 40', () => {
      expect(zoomPercentage(camera)).toBe(40)
    })
  })

  Scenario('Resetting the view returns to the default centered zoom', ({ Given, And, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    And('I have panned and zoomed away from that view', () => {
      camera = zoomUntilSettled(panCamera(camera, 500, 500), 'in')
    })
    When('I reset the view for an 800 by 600 pixel viewport', () => {
      camera = centeredCamera(VIEWPORT_WIDTH_PX, VIEWPORT_HEIGHT_PX)
    })
    // Read off the ruler rather than compared against a second call of
    // centeredCamera, which would restate the implementation the When just
    // invoked instead of the behavior a player sees. The pixel-exact form of
    // this promise lives in camera-pan-and-zoom.e2e.spec.ts, where a real
    // browser can measure it.
    Then('the coordinate labels in view should be balanced around the origin', () => {
      const labels = coordinateLabelsInView(camera, VIEWPORT_WIDTH_PX, VIEWPORT_HEIGHT_PX)
      expectBalancedAroundOrigin(labels.x)
      expectBalancedAroundOrigin(labels.y)
    })
    And('the zoom percentage should be 100', () => {
      expect(zoomPercentage(camera)).toBe(100)
    })
  })
})
