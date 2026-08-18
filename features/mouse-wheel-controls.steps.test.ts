import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { applyWheelInput, DEFAULT_CELL_SIZE, worldToScreen, zoomPercentage, type Camera } from '../src/viewport'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './mouse-wheel-controls.feature')

const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

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
      When('I scroll the wheel with deltaY <deltaY> and deltaX <deltaX> while holding shift', () => {
        camera = applyWheelInput(camera, {
          pixelX: 0,
          pixelY: 0,
          deltaX: Number(variables.deltaX),
          deltaY: Number(variables.deltaY),
          shiftKey: true,
        })
      })
      // deltaY < 0 always means "zoom in" here; a wrongly-preferred deltaX
      // (50, positive) would zoom OUT instead, so this simple ">" check
      // still proves deltaY was the axis actually used, without needing a
      // separate exact-value assertion for the two-axis row.
      Then('the cell size should increase', () => {
        expect(camera.cellSize).toBeGreaterThan(DEFAULT_CELL_SIZE)
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
