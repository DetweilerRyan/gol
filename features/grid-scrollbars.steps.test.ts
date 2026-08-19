import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import {
  cellKey,
  computeContentBounds,
  createEmptyLiveCells,
  type ContentBounds,
  type LiveCells,
} from '../src/gameOfLife'
import { computeScrollbarMetrics, panCameraByScrollbarDrag, DEFAULT_CELL_SIZE, type Camera } from '../src/viewport'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './grid-scrollbars.feature')

const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

function makeLiveCellsRect(xMin: number, xMax: number, yMin: number, yMax: number): LiveCells {
  const coords: [number, number][] = []
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      coords.push([x, y])
    }
  }
  return makeLiveCells(coords)
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario('An empty grid has no content bounds', ({ Given, Then }) => {
    let cells: LiveCells

    Given('a grid with no live cells', () => {
      cells = createEmptyLiveCells()
    })
    Then('the content bounds should be absent', () => {
      expect(computeContentBounds(cells)).toBeNull()
    })
  })

  Scenario("A live cell's content bounds span its full cell footprint", ({ Given, Then }) => {
    let cells: LiveCells

    Given('a grid with a single live cell at (5, 5)', () => {
      cells = makeLiveCells([[5, 5]])
    })
    Then('the content bounds should span from (5, 5) to (6, 6)', () => {
      expect(computeContentBounds(cells)).toEqual({ minX: 5, maxX: 6, minY: 5, maxY: 6 })
    })
  })

  Scenario("An empty grid's scrollbar thumbs fill the entire track", ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let contentBounds: ContentBounds | null
    let metrics: ReturnType<typeof computeScrollbarMetrics>

    Given('a grid with no live cells', () => {
      cells = createEmptyLiveCells()
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I compute the scrollbar metrics for an 800 by 600 pixel viewport', () => {
      contentBounds = computeContentBounds(cells)
      metrics = computeScrollbarMetrics(camera, contentBounds, 800, 600)
    })
    Then('the horizontal thumb ratio should be 1', () => {
      expect(metrics.horizontal.thumbRatio).toBe(1)
    })
    And('the horizontal thumb offset ratio should be 0', () => {
      expect(metrics.horizontal.thumbOffsetRatio).toBe(0)
    })
    And('the vertical thumb ratio should be 1', () => {
      expect(metrics.vertical.thumbRatio).toBe(1)
    })
    And('the vertical thumb offset ratio should be 0', () => {
      expect(metrics.vertical.thumbOffsetRatio).toBe(0)
    })
  })

  Scenario('Content smaller than the viewport still fills the scrollbar track', ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let metrics: ReturnType<typeof computeScrollbarMetrics>

    Given('a grid with a single live cell at (5, 5)', () => {
      cells = makeLiveCells([[5, 5]])
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I compute the scrollbar metrics for an 800 by 600 pixel viewport', () => {
      metrics = computeScrollbarMetrics(camera, computeContentBounds(cells), 800, 600)
    })
    Then('the horizontal thumb ratio should be 1', () => {
      expect(metrics.horizontal.thumbRatio).toBe(1)
    })
    And('the vertical thumb ratio should be 1', () => {
      expect(metrics.vertical.thumbRatio).toBe(1)
    })
  })

  Scenario('Content wider than the viewport shrinks only the horizontal thumb', ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let metrics: ReturnType<typeof computeScrollbarMetrics>

    Given('a grid with live cells spanning x from 0 to 199 and y from 0 to 1', () => {
      cells = makeLiveCellsRect(0, 199, 0, 1)
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I compute the scrollbar metrics for an 800 by 600 pixel viewport', () => {
      metrics = computeScrollbarMetrics(camera, computeContentBounds(cells), 800, 600)
    })
    Then('the horizontal thumb ratio should be less than 1', () => {
      expect(metrics.horizontal.thumbRatio).toBeLessThan(1)
    })
    And('the vertical thumb ratio should be 1', () => {
      expect(metrics.vertical.thumbRatio).toBe(1)
    })
  })

  Scenario('Content taller than the viewport shrinks only the vertical thumb', ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let metrics: ReturnType<typeof computeScrollbarMetrics>

    Given('a grid with live cells spanning x from 0 to 1 and y from 0 to 199', () => {
      cells = makeLiveCellsRect(0, 1, 0, 199)
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('I compute the scrollbar metrics for an 800 by 600 pixel viewport', () => {
      metrics = computeScrollbarMetrics(camera, computeContentBounds(cells), 800, 600)
    })
    Then('the vertical thumb ratio should be less than 1', () => {
      expect(metrics.vertical.thumbRatio).toBeLessThan(1)
    })
    And('the horizontal thumb ratio should be 1', () => {
      expect(metrics.horizontal.thumbRatio).toBe(1)
    })
  })

  Scenario(
    'Panning far away from all content still produces a valid, maxed-out scrollbar offset',
    ({ Given, And, When, Then }) => {
      let cells: LiveCells
      let camera: Camera
      let metrics: ReturnType<typeof computeScrollbarMetrics>

      Given('a grid with a single live cell at (0, 0)', () => {
        cells = makeLiveCells([[0, 0]])
      })
      And('a camera at world position (500, 0) at the default zoom', () => {
        camera = { offsetX: 500, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
      })
      When('I compute the scrollbar metrics for an 800 by 600 pixel viewport', () => {
        metrics = computeScrollbarMetrics(camera, computeContentBounds(cells), 800, 600)
      })
      Then('the horizontal thumb offset ratio should be 1', () => {
        expect(metrics.horizontal.thumbOffsetRatio).toBe(1)
      })
      And('the horizontal thumb ratio should be less than 1', () => {
        expect(metrics.horizontal.thumbRatio).toBeLessThan(1)
      })
    },
  )

  Scenario(
    'Dragging the vertical scrollbar thumb down pans the camera to reveal further content',
    ({ Given, When, Then, And }) => {
      let before: Camera
      let camera: Camera

      Given('a camera centered on the origin at the default zoom', () => {
        before = DEFAULT_CAMERA
        camera = before
      })
      When('I drag the vertical scrollbar thumb by 50 pixels with a thumb ratio of 1', () => {
        camera = panCameraByScrollbarDrag(camera, 'y', 50, 1)
      })
      Then("the camera's offsetY should increase", () => {
        expect(camera.offsetY).toBeGreaterThan(before.offsetY)
      })
      And('the cell size should be unchanged', () => {
        expect(camera.cellSize).toBe(before.cellSize)
      })
    },
  )

  ScenarioOutline(
    'The drag distance scales inversely with thumb ratio, down to a zero-ratio no-op',
    ({ Given, When, Then }, variables) => {
      let camera: Camera

      Given('a camera centered on the origin at the default zoom', () => {
        camera = DEFAULT_CAMERA
      })
      When('I drag the horizontal scrollbar thumb by 50 pixels with a thumb ratio of <thumb ratio>', () => {
        const thumbRatio = Number(variables['thumb ratio'])
        // Guard against a mutated <thumb ratio> landing below 0:
        // panCameraByScrollbarDrag's `thumbRatio <= 0` early-return treats 0 and
        // any negative ratio identically, so a mutation of 0 to e.g. -2 would
        // otherwise produce the same (no-op) result.
        if (thumbRatio < 0 || thumbRatio > 1) {
          throw new Error(`Unexpected thumb ratio: ${variables['thumb ratio']}`)
        }
        camera = panCameraByScrollbarDrag(camera, 'x', 50, thumbRatio)
      })
      Then("the camera's offsetX should be <expected offset>", () => {
        expect(camera.offsetX).toBeCloseTo(Number(variables['expected offset']))
      })
    },
  )
})
