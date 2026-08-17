import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { centeredCamera, DEFAULT_CELL_SIZE, panCamera, worldToScreen, zoomCameraAtPoint, type Camera } from '../src/viewport'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './camera-pan-and-zoom.feature')

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario('Panning moves the viewport without changing the zoom level', ({ Given, When, Then, And }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
    })
    When('I pan the camera by 40 pixels right and 20 pixels down', () => {
      camera = panCamera(camera, 40, 20)
    })
    Then('the camera should have moved left and up in world coordinates', () => {
      expect(camera.offsetX).toBeLessThan(0)
      expect(camera.offsetY).toBeLessThan(0)
    })
    And('the cell size should be unchanged', () => {
      expect(camera.cellSize).toBe(DEFAULT_CELL_SIZE)
    })
  })

  Scenario('Zooming in centers on the cursor position', ({ Given, When, Then, And }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
    })
    When('I zoom in at pixel (100, 50) by a factor of 2', () => {
      camera = zoomCameraAtPoint(camera, 100, 50, 2)
    })
    Then('the cell size should double', () => {
      expect(camera.cellSize).toBe(DEFAULT_CELL_SIZE * 2)
    })
    And('the world point that was under the cursor should still be under the cursor', () => {
      // Before zooming, the world point under pixel (100, 50) was (5, 2.5).
      const screen = worldToScreen(camera, 5, 2.5)
      expect(screen.x).toBeCloseTo(100)
      expect(screen.y).toBeCloseTo(50)
    })
  })

  ScenarioOutline('Zoom is clamped to a sane range', ({ Given, When, Then }, variables) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
    })
    When('I zoom repeatedly by a factor of <factor> until the cell size stops changing', () => {
      const factor = Number(variables.factor)
      let previousCellSize: number
      do {
        previousCellSize = camera.cellSize
        camera = zoomCameraAtPoint(camera, 0, 0, factor)
      } while (camera.cellSize !== previousCellSize)
    })
    Then('the cell size should be <expected size>', () => {
      expect(camera.cellSize).toBe(Number(variables['expected size']))
    })
  })

  Scenario('Resetting the view returns to the default centered zoom', ({ Given, When, And, Then }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
    })
    When('I pan the camera by 500 pixels right and 500 pixels down', () => {
      camera = panCamera(camera, 500, 500)
    })
    And('I zoom in at pixel (0, 0) by a factor of 3', () => {
      camera = zoomCameraAtPoint(camera, 0, 0, 3)
    })
    And('I reset the view for an 800 by 600 pixel viewport', () => {
      camera = centeredCamera(800, 600)
    })
    Then('the camera should be centered on the origin at the default zoom', () => {
      expect(camera).toEqual(centeredCamera(800, 600))
    })
  })
})
