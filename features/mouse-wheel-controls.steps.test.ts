import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { applyWheelInput, centeredCamera, zoomPercentage, type Camera } from '../src/camera'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './mouse-wheel-controls.feature')

// "A camera centered on the origin at the default zoom" is the application's
// own boot state: useInitialCentering hands centeredCamera the first non-zero
// viewport measurement it sees. A camera whose offset is merely zero is a
// different thing -- it puts the origin in the top-left CORNER of the view --
// and the only vocabulary that could honestly describe that state is the
// offset wording .gherkin-lintrc bans from the contract outright. The viewport
// size below is immaterial to every clause in this feature, which reads zoom
// percentages and before/after pan deltas; only the centering is meant.
const DEFAULT_CAMERA: Camera = centeredCamera(800, 600)

// A shift-held wheel gesture, reduced to the one thing the two zoom scenarios
// are about: which way it was rolled. The magnitude never reaches the camera --
// applyWheelInput reads only the sign of the delta and steps by the
// application's own zoom factor -- and the pixel the cursor sits over decides
// only where the zoom is anchored, which no clause here observes.
const WHEEL_UP = -100
const WHEEL_DOWN = 100

function shiftWheel(camera: Camera, deltaY: number): Camera {
  return applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 0, deltaY, shiftKey: true })
}

describeFeature(feature, ({ Scenario }) => {
  Scenario('Scrolling without a modifier pans instead of zooming', ({ Given, When, Then, And }) => {
    let before: Camera
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      before = DEFAULT_CAMERA
      camera = before
    })
    When('I scroll the wheel 40 pixels sideways and 100 pixels down without holding shift', () => {
      camera = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 40, deltaY: 100, shiftKey: false })
    })
    Then('the zoom level should be unchanged', () => {
      expect(camera.cellSize).toBe(before.cellSize)
    })
    And('the camera should have moved down and right into the grid', () => {
      expect(camera.offsetX).toBeGreaterThan(before.offsetX)
      expect(camera.offsetY).toBeGreaterThan(before.offsetY)
    })
  })

  Scenario('Scrolling up with shift held zooms in', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I scroll the wheel up while holding shift', () => {
      camera = shiftWheel(camera, WHEEL_UP)
    })
    Then('the zoom percentage should be above 100', () => {
      expect(zoomPercentage(camera)).toBeGreaterThan(100)
    })
  })

  Scenario('Scrolling down with shift held zooms out', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I scroll the wheel down while holding shift', () => {
      camera = shiftWheel(camera, WHEEL_DOWN)
    })
    Then('the zoom percentage should be below 100', () => {
      expect(zoomPercentage(camera)).toBeLessThan(100)
    })
  })
})
