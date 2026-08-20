import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { applyWheelInput, DEFAULT_CELL_SIZE, worldToScreen, zoomPercentage, type Camera } from '../src/viewport'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './mouse-wheel-controls.feature')

const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

// The wheel-delta *magnitude* is deliberately a constant here rather than an
// Examples column: applyWheelInput resolves zoom direction from the delta's
// sign alone (`zoomDelta < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR`) and never reads
// the magnitude, so a magnitude in the table would be inert specification data
// -- no scenario could legitimately assert anything about it. Only the two
// things the code actually branches on (which axis carries the gesture, and
// which direction it points) belong in the table. The non-outline scenarios
// above bake their magnitudes into the step text for the same reason.
const WHEEL_DELTA_PX = 100

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario('Scrolling without a modifier pans instead of zooming', ({ Given, When, Then, And }) => {
    let before: Camera
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      before = DEFAULT_CAMERA
      camera = before
    })
    When('I scroll the wheel by deltaX 40 and deltaY 100 without holding shift', () => {
      camera = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 40, deltaY: 100, shiftKey: false })
    })
    Then('the cell size should be unchanged', () => {
      expect(camera.cellSize).toBe(before.cellSize)
    })
    And('the camera should have moved down and right into the grid', () => {
      expect(camera.offsetX).toBeGreaterThan(before.offsetX)
      expect(camera.offsetY).toBeGreaterThan(before.offsetY)
    })
  })

  Scenario('Scrolling with shift held zooms instead of panning', ({ Given, When, Then, And }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I scroll the wheel up by 100 pixels at pixel (100, 50) while holding shift', () => {
      camera = applyWheelInput(camera, { pixelX: 100, pixelY: 50, deltaX: 0, deltaY: -100, shiftKey: true })
    })
    Then('the cell size should increase', () => {
      expect(camera.cellSize).toBeGreaterThan(DEFAULT_CELL_SIZE)
    })
    And('the world point that was under the cursor should still be under the cursor', () => {
      // Before zooming, the world point under pixel (100, 50) was (5, 2.5).
      const screen = worldToScreen(camera, 5, 2.5)
      expect(screen.x).toBeCloseTo(100)
      expect(screen.y).toBeCloseTo(50)
    })
  })

  ScenarioOutline(
    'Shift-held zoom resolves the scroll direction from whichever axis carries it',
    ({ Given, When, Then }, variables) => {
      let camera: Camera

      Given('a camera centered on the origin at the default zoom', () => {
        camera = DEFAULT_CAMERA
      })
      When('I scroll the wheel <direction> with shift held, carried on the <carrying axis> axis', () => {
        camera = applyWheelInput(camera, {
          pixelX: 0,
          pixelY: 0,
          ...wheelDeltas(variables['carrying axis'], variables.direction),
          shiftKey: true,
        })
      })
      // Compare the observed outcome to the expected string directly (rather
      // than branching on it) so a mutated <zoom outcome> is always detected.
      // Same discipline as grid-reference-lines' <be_or_not>.
      Then('the cell size should <zoom outcome>', () => {
        expect(describeZoomOutcome(camera.cellSize)).toBe(variables['zoom outcome'])
      })
    },
  )

  ScenarioOutline(
    'The zoom percentage reflects the current cell size relative to the default',
    ({ Given, Then }, variables) => {
      let camera: Camera

      Given('a camera with cell size <cell size>', () => {
        camera = { offsetX: 0, offsetY: 0, cellSize: Number(variables['cell size']) }
      })
      Then('the zoom percentage should be <expected percentage>', () => {
        expect(zoomPercentage(camera)).toBe(Number(variables['expected percentage']))
      })
    },
  )
})

// Both mappings below throw on an unrecognized value rather than falling back
// to a default, so a mutated <direction>/<carrying axis> fails the scenario
// instead of being silently absorbed into the other branch.
function signedWheelDelta(direction: string): number {
  if (direction === 'up') return -WHEEL_DELTA_PX
  if (direction === 'down') return WHEEL_DELTA_PX
  throw new Error(`Unknown scroll direction: ${direction}`)
}

function wheelDeltas(carryingAxis: string, direction: string): { deltaX: number; deltaY: number } {
  const delta = signedWheelDelta(direction)
  // x-carried is the Firefox/Windows case applyWheelInput works around: the
  // browser zeroes deltaY under Shift and puts the gesture on deltaX instead.
  // y-carried deliberately populates deltaX too, with the *opposing* sign, so
  // the outcome can only match if deltaY was the axis actually used.
  if (carryingAxis === 'x') return { deltaX: delta, deltaY: 0 }
  if (carryingAxis === 'y') return { deltaX: -delta / 2, deltaY: delta }
  throw new Error(`Unknown carrying axis: ${carryingAxis}`)
}

function describeZoomOutcome(cellSize: number): string {
  if (cellSize > DEFAULT_CELL_SIZE) return 'increase'
  if (cellSize < DEFAULT_CELL_SIZE) return 'decrease'
  return 'stay the same'
}
