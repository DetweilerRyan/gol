import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { applyWheelInput, DEFAULT_CELL_SIZE, worldToScreen, zoomPercentage, type Camera } from '../src/camera'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './mouse-wheel-controls.feature')

const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

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

  Scenario('Scrolling with shift held zooms instead of panning', ({ Given, When, Then, And }) => {
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I scroll the wheel up by 100 pixels at pixel (100, 50) while holding shift', () => {
      camera = applyWheelInput(camera, { pixelX: 100, pixelY: 50, deltaX: 0, deltaY: -100, shiftKey: true })
    })
    Then('the zoom percentage should be above 100', () => {
      expect(zoomPercentage(camera)).toBeGreaterThan(100)
    })
    And('the point under the cursor should not move', () => {
      // Before zooming, the grid point under pixel (100, 50) was (5, 2.5).
      const screen = worldToScreen(camera, 5, 2.5)
      expect(screen.x).toBeCloseTo(100)
      expect(screen.y).toBeCloseTo(50)
    })
  })
})
