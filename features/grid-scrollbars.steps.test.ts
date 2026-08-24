import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { cellKey, computeContentBounds, createEmptyLiveCells, type LiveCells } from '../src/gameOfLife'
import { DEFAULT_CELL_SIZE, type Camera } from '../src/camera'
import { computeScrollbarMetrics, panCameraByScrollbarDrag } from '../src/scrollbars'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './grid-scrollbars.feature')

const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

type ScrollbarMetrics = ReturnType<typeof computeScrollbarMetrics>

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

function makeLiveCellsRect(cellsAcross: number, cellsDown: number): LiveCells {
  const coords: [number, number][] = []
  for (let x = 0; x < cellsAcross; x++) {
    for (let y = 0; y < cellsDown; y++) {
      coords.push([x, y])
    }
  }
  return makeLiveCells(coords)
}

function drawScrollbars(cells: LiveCells, camera: Camera): ScrollbarMetrics {
  return computeScrollbarMetrics(camera, computeContentBounds(cells), 800, 600)
}

// The camera's offset is in cells, so a move is stated in pixels by scaling it
// back through the cell size the drag was measured against. That is a unit
// conversion, not a second copy of panCameraByScrollbarDrag's arithmetic --
// the distance itself comes from the camera the drag returned.
function pixelsMoved(before: Camera, after: Camera, axis: 'x' | 'y'): number {
  const cellsMoved = axis === 'x' ? after.offsetX - before.offsetX : after.offsetY - before.offsetY
  return cellsMoved * before.cellSize
}

describeFeature(feature, ({ Scenario }) => {
  Scenario('An empty grid has no live pattern to scroll to', ({ Given, Then }) => {
    let cells: LiveCells

    Given('a grid with no live cells', () => {
      cells = createEmptyLiveCells()
    })
    Then('there should be no live pattern to scroll to', () => {
      expect(computeContentBounds(cells)).toBeNull()
    })
  })

  Scenario('A live cell covers its own full square of the grid', ({ Given, Then }) => {
    let cells: LiveCells

    Given('a grid with a single live cell at (5, 5)', () => {
      cells = makeLiveCells([[5, 5]])
    })
    Then('the live pattern should extend from (5, 5) to (6, 6)', () => {
      expect(computeContentBounds(cells)).toEqual({ minX: 5, maxX: 6, minY: 5, maxY: 6 })
    })
  })

  Scenario("An empty grid's scrollbar thumbs fill the entire track", ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let scrollbars: ScrollbarMetrics

    Given('a grid with no live cells', () => {
      cells = createEmptyLiveCells()
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('the scrollbars are drawn for an 800 by 600 pixel viewport', () => {
      scrollbars = drawScrollbars(cells, camera)
    })
    Then('the horizontal thumb should fill its track', () => {
      expect(scrollbars.horizontal.thumbRatio).toBe(1)
    })
    And('the horizontal thumb should sit at the start of its track', () => {
      expect(scrollbars.horizontal.thumbOffsetRatio).toBe(0)
    })
    And('the vertical thumb should fill its track', () => {
      expect(scrollbars.vertical.thumbRatio).toBe(1)
    })
    And('the vertical thumb should sit at the start of its track', () => {
      expect(scrollbars.vertical.thumbOffsetRatio).toBe(0)
    })
  })

  Scenario('Content smaller than the viewport still fills the scrollbar track', ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let scrollbars: ScrollbarMetrics

    Given('a grid with a single live cell at (5, 5)', () => {
      cells = makeLiveCells([[5, 5]])
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('the scrollbars are drawn for an 800 by 600 pixel viewport', () => {
      scrollbars = drawScrollbars(cells, camera)
    })
    Then('the horizontal thumb should fill its track', () => {
      expect(scrollbars.horizontal.thumbRatio).toBe(1)
    })
    And('the vertical thumb should fill its track', () => {
      expect(scrollbars.vertical.thumbRatio).toBe(1)
    })
  })

  Scenario('Content wider than the viewport shrinks only the horizontal thumb', ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let scrollbars: ScrollbarMetrics

    Given('a grid with live cells spanning 200 cells across and 2 cells down', () => {
      cells = makeLiveCellsRect(200, 2)
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('the scrollbars are drawn for an 800 by 600 pixel viewport', () => {
      scrollbars = drawScrollbars(cells, camera)
    })
    Then('the horizontal thumb should be shorter than its track', () => {
      expect(scrollbars.horizontal.thumbRatio).toBeLessThan(1)
    })
    And('the vertical thumb should fill its track', () => {
      expect(scrollbars.vertical.thumbRatio).toBe(1)
    })
  })

  Scenario('Content taller than the viewport shrinks only the vertical thumb', ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let scrollbars: ScrollbarMetrics

    Given('a grid with live cells spanning 2 cells across and 200 cells down', () => {
      cells = makeLiveCellsRect(2, 200)
    })
    And('a camera centered on the origin at the default zoom', () => {
      camera = DEFAULT_CAMERA
    })
    When('the scrollbars are drawn for an 800 by 600 pixel viewport', () => {
      scrollbars = drawScrollbars(cells, camera)
    })
    Then('the vertical thumb should be shorter than its track', () => {
      expect(scrollbars.vertical.thumbRatio).toBeLessThan(1)
    })
    And('the horizontal thumb should fill its track', () => {
      expect(scrollbars.horizontal.thumbRatio).toBe(1)
    })
  })

  Scenario('Panning far past all content still leaves the thumb inside its track', ({ Given, And, When, Then }) => {
    let cells: LiveCells
    let camera: Camera
    let scrollbars: ScrollbarMetrics

    Given('a grid with a single live cell at (0, 0)', () => {
      cells = makeLiveCells([[0, 0]])
    })
    And('a camera panned 500 cells right of the origin at the default zoom', () => {
      camera = { offsetX: 500, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
    })
    When('the scrollbars are drawn for an 800 by 600 pixel viewport', () => {
      scrollbars = drawScrollbars(cells, camera)
    })
    Then('the horizontal thumb should sit at the end of its track', () => {
      expect(scrollbars.horizontal.thumbOffsetRatio).toBe(1)
    })
    And('the horizontal thumb should be shorter than its track', () => {
      expect(scrollbars.horizontal.thumbRatio).toBeLessThan(1)
    })
  })

  Scenario('Dragging the vertical scrollbar thumb down reveals content further down', ({ Given, When, Then, And }) => {
    let before: Camera
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      before = DEFAULT_CAMERA
      camera = before
    })
    When('I drag the vertical scrollbar thumb down by 50 pixels while it fills its track', () => {
      camera = panCameraByScrollbarDrag(camera, 'y', 50, 1)
    })
    Then('the camera should have moved 50 pixels down the grid', () => {
      expect(pixelsMoved(before, camera, 'y')).toBeCloseTo(50)
    })
    And('the zoom level should be unchanged', () => {
      expect(camera.cellSize).toBe(before.cellSize)
    })
  })

  // A thumb filling a quarter of its track means a quarter of the pattern is
  // in view, so the same drag has to cover four times the ground -- which is
  // what makes the thumb's position mean what a player expects it to mean.
  Scenario('Dragging a thumb covering a quarter of its track pans four times as far', ({ Given, When, Then }) => {
    let before: Camera
    let camera: Camera

    Given('a camera centered on the origin at the default zoom', () => {
      before = DEFAULT_CAMERA
      camera = before
    })
    When('I drag the horizontal scrollbar thumb right by 50 pixels while it covers a quarter of its track', () => {
      camera = panCameraByScrollbarDrag(camera, 'x', 50, 0.25)
    })
    Then('the camera should have moved 200 pixels right across the grid', () => {
      expect(pixelsMoved(before, camera, 'x')).toBeCloseTo(200)
    })
  })
})
