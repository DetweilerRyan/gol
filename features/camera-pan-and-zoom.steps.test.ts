import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import {
  centeredCamera,
  DEFAULT_CELL_SIZE,
  panCamera,
  worldToScreen,
  zoomCameraAtPoint,
  zoomPercentage,
  type Camera,
} from '../src/camera'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './camera-pan-and-zoom.feature')

const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

// Zooms by `factor` until the clamp saturates. The factor is a plain doubling
// or halving rather than something extreme: the scenario is about *where* zoom
// stops, and any factor past the clamp reaches the same place -- so a big one
// would only hide how many steps it took.
function zoomUntilSettled(camera: Camera, factor: number): Camera {
  let previousCellSize: number
  do {
    previousCellSize = camera.cellSize
    camera = zoomCameraAtPoint(camera, 0, 0, factor)
  } while (camera.cellSize !== previousCellSize)
  return camera
}

describeFeature(feature, ({ Scenario }) => {
  Scenario('Panning moves the viewport without changing the zoom level', ({ Given, When, Then, And }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I pan the camera by 40 pixels right and 20 pixels down', () => {
      camera = panCamera(camera, 40, 20)
    })
    Then('the camera should have moved left and up over the grid', () => {
      expect(camera.offsetX).toBeLessThan(0)
      expect(camera.offsetY).toBeLessThan(0)
    })
    And('the zoom level should be unchanged', () => {
      expect(camera.cellSize).toBe(DEFAULT_CELL_SIZE)
    })
  })

  Scenario('Zooming in centers on the cursor position', ({ Given, When, Then, And }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I zoom in at pixel (100, 50) by a factor of 2', () => {
      camera = zoomCameraAtPoint(camera, 100, 50, 2)
    })
    Then('the zoom percentage should be 200', () => {
      expect(zoomPercentage(camera)).toBe(200)
    })
    And('the point under the cursor should not move', () => {
      // Before zooming, the grid point under pixel (100, 50) was (5, 2.5).
      const screen = worldToScreen(camera, 5, 2.5)
      expect(screen.x).toBeCloseTo(100)
      expect(screen.y).toBeCloseTo(50)
    })
  })

  Scenario('Zooming out one step halves the zoom percentage', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I zoom out at pixel (100, 50) by a factor of 0.5', () => {
      camera = zoomCameraAtPoint(camera, 100, 50, 0.5)
    })
    Then('the zoom percentage should be 50', () => {
      expect(zoomPercentage(camera)).toBe(50)
    })
  })

  Scenario('Zooming in stops at the maximum zoom', ({ Given, When, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I zoom in repeatedly until the zoom stops changing', () => {
      camera = zoomUntilSettled(camera, 2)
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
      camera = zoomUntilSettled(camera, 0.5)
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
      camera = zoomCameraAtPoint(panCamera(camera, 500, 500), 0, 0, 3)
    })
    When('I reset the view for an 800 by 600 pixel viewport', () => {
      camera = centeredCamera(800, 600)
    })
    // Asserted through worldToScreen rather than against centeredCamera's own
    // return value: comparing the reset camera to a second call of the very
    // function the When just called would restate the implementation instead
    // of the behavior a player sees.
    Then('the origin should sit at the center of the viewport', () => {
      const screen = worldToScreen(camera, 0, 0)
      expect(screen.x).toBeCloseTo(400)
      expect(screen.y).toBeCloseTo(300)
    })
    And('the zoom percentage should be 100', () => {
      expect(zoomPercentage(camera)).toBe(100)
    })
  })
})
