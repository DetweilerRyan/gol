import { describe, expect, it } from 'vitest'
import { centeredCamera, MAX_CELL_SIZE, MIN_CELL_SIZE, worldToScreen, type Camera } from './camera'
import {
  computeLattice,
  LATTICE_SLACK_CELLS,
  latticeCovers,
  latticeOffsetPx,
  slotPixelPosition,
  slotWorldCoordinate,
} from './cellLattice'

describe('computeLattice', () => {
  it('subtracts LATTICE_SLACK_CELLS from the floored offset, including a negative offset (Math.floor(-23) === -23)', () => {
    const camera: Camera = { offsetX: -23, offsetY: -23, cellSize: 20 }
    const lattice = computeLattice(camera, 400, 300)

    expect(lattice.originX).toBe(-23 - LATTICE_SLACK_CELLS)
    expect(lattice.originY).toBe(-23 - LATTICE_SLACK_CELLS)
    expect(lattice.cols).toBe(Math.ceil(400 / 20) + 1 + 2 * LATTICE_SLACK_CELLS)
    expect(lattice.rows).toBe(Math.ceil(300 / 20) + 1 + 2 * LATTICE_SLACK_CELLS)
    expect(lattice.cellSize).toBe(20)
  })

  it('matches the default camera produced by centeredCamera(1280, 900) (the Playwright viewport default)', () => {
    const camera = centeredCamera(1280, 900)
    expect(camera).toEqual({ offsetX: -32, offsetY: -22.5, cellSize: 20 })

    const lattice = computeLattice(camera, 1280, 900)

    expect(lattice).toEqual({
      originX: -36,
      originY: -27,
      cols: 73,
      rows: 54,
      cellSize: 20,
    })
  })

  it.each([
    [16, 89],
    [12.8, 109],
    [10.24, 134],
  ])(
    'handles a fractional cellSize real zoom can produce: cellSize %d -> cols %d for a 1280px viewport',
    (cellSize, expectedCols) => {
      const camera: Camera = { offsetX: 0, offsetY: 0, cellSize }
      const lattice = computeLattice(camera, 1280, 900)
      expect(lattice.cols).toBe(expectedCols)
    },
  )

  it('handles MIN_CELL_SIZE', () => {
    const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: MIN_CELL_SIZE }
    const lattice = computeLattice(camera, 1280, 900)
    expect(lattice.cellSize).toBe(MIN_CELL_SIZE)
    expect(lattice.cols).toBe(Math.ceil(1280 / MIN_CELL_SIZE) + 1 + 2 * LATTICE_SLACK_CELLS)
    expect(lattice.rows).toBe(Math.ceil(900 / MIN_CELL_SIZE) + 1 + 2 * LATTICE_SLACK_CELLS)
  })

  it('handles MAX_CELL_SIZE', () => {
    const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: MAX_CELL_SIZE }
    const lattice = computeLattice(camera, 1280, 900)
    expect(lattice.cellSize).toBe(MAX_CELL_SIZE)
    expect(lattice.cols).toBe(Math.ceil(1280 / MAX_CELL_SIZE) + 1 + 2 * LATTICE_SLACK_CELLS)
    expect(lattice.rows).toBe(Math.ceil(900 / MAX_CELL_SIZE) + 1 + 2 * LATTICE_SLACK_CELLS)
  })

  it('stays finite and >= 1 for a 0x0 viewport (useElementSize before its first measurement)', () => {
    const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }
    const lattice = computeLattice(camera, 0, 0)

    expect(Number.isFinite(lattice.cols)).toBe(true)
    expect(Number.isFinite(lattice.rows)).toBe(true)
    expect(lattice.cols).toBeGreaterThanOrEqual(1)
    expect(lattice.rows).toBeGreaterThanOrEqual(1)
    // A 0-width/height viewport still gets the full slack on each side.
    expect(lattice.cols).toBe(1 + 2 * LATTICE_SLACK_CELLS)
    expect(lattice.rows).toBe(1 + 2 * LATTICE_SLACK_CELLS)
  })

  it('does not leak -0 into originX/originY when camera.offsetX/offsetY is -0 -- Math.floor(-0) is itself -0, but subtracting the (nonzero) slack normalizes the result', () => {
    const camera: Camera = { offsetX: -0, offsetY: -0, cellSize: 20 }
    const lattice = computeLattice(camera, 400, 300)

    expect(lattice.originX).toBe(-LATTICE_SLACK_CELLS)
    expect(lattice.originY).toBe(-LATTICE_SLACK_CELLS)
    expect(Object.is(lattice.originX, -0)).toBe(false)
    expect(Object.is(lattice.originY, -0)).toBe(false)
  })

  it('produces a lattice that immediately covers the camera/viewport it was computed from (default camera)', () => {
    const camera = centeredCamera(1280, 900)
    const lattice = computeLattice(camera, 1280, 900)
    expect(latticeCovers(lattice, camera, 1280, 900)).toBe(true)
  })
})

describe('latticeCovers', () => {
  const camera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
  const lattice = computeLattice(camera, 1280, 900)

  it('is false when cellSize differs, even if the window would otherwise fit (a zoom must always rebase)', () => {
    const zoomed: Camera = { ...camera, cellSize: 16 }
    expect(latticeCovers(lattice, zoomed, 1280, 900)).toBe(false)
  })

  it('is true for the exact camera/viewport the lattice was computed for', () => {
    expect(latticeCovers(lattice, camera, 1280, 900)).toBe(true)
  })

  it('is true for a small pan that stays within the slack', () => {
    const panned: Camera = { ...camera, offsetX: camera.offsetX + 1, offsetY: camera.offsetY + 1 }
    expect(latticeCovers(lattice, panned, 1280, 900)).toBe(true)
  })

  it('is false once a pan on the x axis moves the required window outside the lattice', () => {
    const pannedFar: Camera = { ...camera, offsetX: camera.offsetX + 100 }
    expect(latticeCovers(lattice, pannedFar, 1280, 900)).toBe(false)
  })

  it('is false once a pan on the y axis moves the required window outside the lattice, even though x is unchanged', () => {
    const pannedFar: Camera = { ...camera, offsetY: camera.offsetY - 100 }
    expect(latticeCovers(lattice, pannedFar, 1280, 900)).toBe(false)
  })

  it('accepts a required window that lands exactly on the lattice boundary (inclusive)', () => {
    // originX is camera.offsetX's floor minus the slack: panning by exactly
    // -LATTICE_SLACK_CELLS cells puts the new minX exactly at originX.
    const atEdge: Camera = { ...camera, offsetX: camera.offsetX - LATTICE_SLACK_CELLS }
    expect(latticeCovers(lattice, atEdge, 1280, 900)).toBe(true)
  })
})

describe('latticeOffsetPx', () => {
  it('equals worldToScreen(camera, lattice.originX, lattice.originY) exactly', () => {
    const camera = centeredCamera(1280, 900)
    const lattice = computeLattice(camera, 1280, 900)

    const expected = worldToScreen(camera, lattice.originX, lattice.originY)
    expect(latticeOffsetPx(lattice, camera)).toEqual({ xPx: expected.x, yPx: expected.y })
  })

  it('reflects a pan without needing the lattice to rebase', () => {
    const camera: Camera = { offsetX: -10, offsetY: -10, cellSize: 20 }
    const lattice = computeLattice(camera, 400, 300)

    const pannedCamera: Camera = { ...camera, offsetX: -9, offsetY: -10.5 }
    const expected = worldToScreen(pannedCamera, lattice.originX, lattice.originY)
    expect(latticeOffsetPx(lattice, pannedCamera)).toEqual({ xPx: expected.x, yPx: expected.y })
  })
})

describe('slotWorldCoordinate', () => {
  it('adds the index to the origin', () => {
    expect(slotWorldCoordinate(5, 3)).toBe(8)
  })

  it('handles a negative origin', () => {
    expect(slotWorldCoordinate(-36, 0)).toBe(-36)
    expect(slotWorldCoordinate(-36, 10)).toBe(-26)
  })
})

describe('slotPixelPosition', () => {
  it('multiplies the index by cellSize', () => {
    expect(slotPixelPosition(3, 20)).toBe(60)
  })

  it('is 0 for index 0 regardless of cellSize', () => {
    expect(slotPixelPosition(0, 20)).toBe(0)
    expect(slotPixelPosition(0, MAX_CELL_SIZE)).toBe(0)
  })

  it('handles a fractional cellSize', () => {
    expect(slotPixelPosition(5, 12.8)).toBeCloseTo(64)
  })
})
