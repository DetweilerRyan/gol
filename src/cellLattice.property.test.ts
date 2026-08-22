import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { DEFAULT_CELL_SIZE, MAX_CELL_SIZE, MIN_CELL_SIZE, worldToScreen, type Camera } from './camera'
import {
  computeLattice,
  LATTICE_SLACK_CELLS,
  latticeCovers,
  latticeOffsetPx,
  nextLattice,
  slotIndex,
  slotPixelPosition,
  slotWorldCoordinate,
} from './cellLattice'

// test-support/arbitraries.ts's cellSizeArbitrary is deliberately NOT reused
// here: it is fc.integer, which is right for the camera modules but blind to
// the input this one is most sensitive to. Zoom multiplies by ZOOM_FACTOR
// (1.25), so every step away from DEFAULT_CELL_SIZE lands on a fraction --
// 20 -> 16 -> 12.8 -> 10.24 -- and a fractional cellSize is what makes
// ceil(viewport / cellSize) disagree with viewport / cellSize, which is the
// whole reason computeLattice ceils at all. The named constants are drawn
// alongside the continuous range rather than left to the generator's luck.
const cellSize = fc.oneof(
  fc.double({ min: MIN_CELL_SIZE, max: MAX_CELL_SIZE, noNaN: true }),
  fc.constantFrom(MIN_CELL_SIZE, MAX_CELL_SIZE, DEFAULT_CELL_SIZE, 16, 12.8, 10.24),
)

// -0 is pinned in because Math.floor(-0) is -0, not 0, and every origin here
// is a floored offset; -32 / -22.5 because that is literally what
// centeredCamera(1280, 900) produces for the Playwright viewport; the whole
// negative integers because Math.floor(-23) === -23 is the case where floor
// looks like a no-op and a dropped floor would still pass.
const offset = fc.oneof(
  fc.double({ min: -4000, max: 4000, noNaN: true }),
  fc.constantFrom(0, -0, -1, -23, -32, -22.5, 0.5, -0.5),
)

// 0 is a real input, not a theoretical one: Grid renders once with a 0x0
// containerSize before useElementSize's first ResizeObserver callback lands.
const viewportPx = fc.oneof(fc.integer({ min: 0, max: 4000 }), fc.constantFrom(0, 1280, 900, 1920, 1080))

const camera: fc.Arbitrary<Camera> = fc.record({ offsetX: offset, offsetY: offset, cellSize })

// The degenerate cameras/viewports every property below is additionally
// asserted against directly, rather than trusting a draw to produce them.
const DEGENERATE: ReadonlyArray<readonly [string, Camera, number, number]> = [
  ['the 0x0 pre-measurement viewport', { offsetX: -32, offsetY: -22.5, cellSize: 20 }, 0, 0],
  ['the default 1280x900 camera', { offsetX: -32, offsetY: -22.5, cellSize: 20 }, 1280, 900],
  ['the default camera at 1920x1080', { offsetX: -32, offsetY: -22.5, cellSize: 20 }, 1920, 1080],
  ['-0 offsets on both axes', { offsetX: -0, offsetY: -0, cellSize: DEFAULT_CELL_SIZE }, 1280, 900],
  ['negative integer offsets', { offsetX: -23, offsetY: -23, cellSize: DEFAULT_CELL_SIZE }, 1280, 900],
  ['MIN_CELL_SIZE', { offsetX: -32, offsetY: -22.5, cellSize: MIN_CELL_SIZE }, 1280, 900],
  ['MAX_CELL_SIZE', { offsetX: -32, offsetY: -22.5, cellSize: MAX_CELL_SIZE }, 1280, 900],
  ['a fractional cellSize two zoom steps out', { offsetX: -32, offsetY: -22.5, cellSize: 12.8 }, 1280, 900],
]

describe('computeLattice (property)', () => {
  // The promise LATTICE_SLACK_CELLS makes, and the one the whole rebase-
  // frequency argument in cellLattice.ts's header rests on: a fresh lattice
  // tolerates a whole-cell pan of this size in any direction before it stops
  // covering. LATTICE_SLACK_CELLS - 1, not LATTICE_SLACK_CELLS, because the
  // positive direction spends one cell of the slack absorbing the fractional
  // part of the offset that computeLattice's own `+ 1` exists to cover -- the
  // negative direction tolerates the full LATTICE_SLACK_CELLS (asserted
  // separately below, so the asymmetry is written down rather than inferred).
  const GUARANTEED_PAN_CELLS = LATTICE_SLACK_CELLS - 1
  const panCells = fc.integer({ min: -GUARANTEED_PAN_CELLS, max: GUARANTEED_PAN_CELLS })

  function covers(cam: Camera, width: number, height: number, panX = 0, panY = 0): boolean {
    const lattice = computeLattice(cam, width, height)
    return latticeCovers(lattice, { ...cam, offsetX: cam.offsetX + panX, offsetY: cam.offsetY + panY }, width, height)
  }

  it.prop([camera, viewportPx, viewportPx])(
    'always covers the camera and viewport it was computed for -- the postcondition useCellLattice cannot loop without',
    (cam, width, height) => {
      expect(covers(cam, width, height)).toBe(true)
    },
  )

  it.each(DEGENERATE)('covers %s', (_name, cam, width, height) => {
    expect(covers(cam, width, height)).toBe(true)
  })

  it.prop([camera, viewportPx, viewportPx, panCells, panCells])(
    'still covers after a whole-cell pan of up to LATTICE_SLACK_CELLS - 1 in either direction',
    (cam, width, height, panX, panY) => {
      expect(covers(cam, width, height, panX, panY)).toBe(true)
    },
  )

  it.prop([camera, viewportPx, viewportPx])(
    'tolerates the full LATTICE_SLACK_CELLS in the negative direction, one cell more than the positive one',
    (cam, width, height) => {
      expect(covers(cam, width, height, -LATTICE_SLACK_CELLS, -LATTICE_SLACK_CELLS)).toBe(true)
    },
  )

  const wholeOffset = fc.integer({ min: -2000, max: 2000 })
  const fraction = fc.double({ min: 0, max: 0.999_999, noNaN: true })

  // An offset of ordinary magnitude, built as whole + fraction so that
  // subtracting a small whole number from it is exact in floating point.
  // That matters for the boundary property below, and the reason is a real
  // counterexample fast-check produced against a first draft of it: at
  // offsetX = -5e-324 (the smallest negative denormal) Math.floor is -1, yet
  // -5e-324 - 5 rounds to exactly -5, so the FLOORED offset moves by 4 rather
  // than 5 and the lattice legitimately still covers. Nothing is wrong with
  // the module there -- the property was over-claiming -- but the boundary it
  // states only holds where the pan arithmetic is exact, so it is stated over
  // cameras where that is true rather than silently filtered afterwards.
  const steadyCamera: fc.Arbitrary<Camera> = fc.record({
    offsetX: fc.tuple(wholeOffset, fraction).map(([whole, frac]) => whole + frac),
    offsetY: fc.tuple(wholeOffset, fraction).map(([whole, frac]) => whole + frac),
    cellSize,
  })

  it.prop([steadyCamera, viewportPx, viewportPx])(
    'stops covering as soon as a pan moves the floored offset past the origin slack, on either axis',
    (cam, width, height) => {
      expect(covers(cam, width, height, -(LATTICE_SLACK_CELLS + 1), 0)).toBe(false)
      expect(covers(cam, width, height, 0, -(LATTICE_SLACK_CELLS + 1))).toBe(false)
    },
  )

  it.prop([wholeOffset, wholeOffset, fraction, fraction, fraction, fraction, cellSize, viewportPx, viewportPx])(
    'depends on the offsets only through their floors: two sub-cell-apart cameras give a deep-equal lattice',
    (wholeX, wholeY, fracA, fracB, fracC, fracD, size, width, height) => {
      const one = computeLattice({ offsetX: wholeX + fracA, offsetY: wholeY + fracB, cellSize: size }, width, height)
      const other = computeLattice({ offsetX: wholeX + fracC, offsetY: wholeY + fracD, cellSize: size }, width, height)
      expect(one).toEqual(other)
    },
  )
})

describe('latticeCovers (property)', () => {
  it.prop([camera, cellSize, viewportPx, viewportPx])(
    'a cellSize change always forces a rebase, however small -- slot pixel positions are cellSize-scaled',
    (cam, otherCellSize, width, height) => {
      fc.pre(otherCellSize !== cam.cellSize)
      expect(
        latticeCovers(computeLattice(cam, width, height), { ...cam, cellSize: otherCellSize }, width, height),
      ).toBe(false)
    },
  )
})

describe('nextLattice (property)', () => {
  it.prop([camera, camera, viewportPx, viewportPx])(
    'returns a lattice covering the current camera whatever the previous one was',
    (previousCam, cam, width, height) => {
      const previous = computeLattice(previousCam, width, height)
      expect(latticeCovers(nextLattice(previous, cam, width, height), cam, width, height)).toBe(true)
    },
  )

  it.prop([camera, camera, viewportPx, viewportPx])(
    'is idempotent BY REFERENCE -- applying it to its own result cannot rebase again, so useCellLattice cannot loop',
    (previousCam, cam, width, height) => {
      const first = nextLattice(computeLattice(previousCam, width, height), cam, width, height)
      expect(nextLattice(first, cam, width, height)).toBe(first)
    },
  )

  it.each(DEGENERATE)('is idempotent by reference for %s', (_name, cam, width, height) => {
    const first = nextLattice(computeLattice(cam, width, height), cam, width, height)
    expect(nextLattice(first, cam, width, height)).toBe(first)
  })

  it.prop([camera, camera, viewportPx, viewportPx])(
    'keeps the previous lattice by reference exactly when it still covers, and never otherwise',
    (previousCam, cam, width, height) => {
      const previous = computeLattice(previousCam, width, height)
      expect(nextLattice(previous, cam, width, height) === previous).toBe(latticeCovers(previous, cam, width, height))
    },
  )
})

describe('slot placement (property)', () => {
  // THE invariant the whole lattice design rests on. Cells are painted at
  // slotPixelPosition inside a layer translated by latticeOffsetPx, while
  // taps and hover are resolved with screenToWorld -- worldToScreen's
  // inverse. If this identity fails, a click lands on a different cell than
  // the one under the cursor.
  it.prop([camera, viewportPx, viewportPx, fc.nat(), fc.nat()])(
    'a slot painted at latticeOffsetPx + slotPixelPosition lands exactly where worldToScreen puts its world coordinate',
    (cam, width, height, colSeed, rowSeed) => {
      const lattice = computeLattice(cam, width, height)
      const col = colSeed % lattice.cols
      const row = rowSeed % lattice.rows

      const offsetPx = latticeOffsetPx(lattice, cam)
      const painted = {
        x: offsetPx.xPx + slotPixelPosition(col, lattice.cellSize),
        y: offsetPx.yPx + slotPixelPosition(row, lattice.cellSize),
      }
      const expected = worldToScreen(
        cam,
        slotWorldCoordinate(lattice.originX, col),
        slotWorldCoordinate(lattice.originY, row),
      )

      expect(painted.x).toBeCloseTo(expected.x, 6)
      expect(painted.y).toBeCloseTo(expected.y, 6)
    },
  )

  it.each(DEGENERATE)('places the origin slot at latticeOffsetPx for %s', (_name, cam, width, height) => {
    const lattice = computeLattice(cam, width, height)
    const offsetPx = latticeOffsetPx(lattice, cam)
    expect(offsetPx.xPx + slotPixelPosition(0, lattice.cellSize)).toBe(offsetPx.xPx)
    expect(offsetPx.yPx + slotPixelPosition(0, lattice.cellSize)).toBe(offsetPx.yPx)
  })
})

describe('slotIndex (property)', () => {
  const dimension = fc.integer({ min: 1, max: 40 })

  it.prop([dimension, dimension])(
    'row-major enumeration of every slot yields exactly 0..cols*rows-1, in order -- a bijection onto the keyspace',
    (cols, rows) => {
      const indices: number[] = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          indices.push(slotIndex(col, row, cols))
        }
      }
      expect(indices).toEqual([...Array(cols * rows).keys()])
    },
  )

  it.prop([dimension, dimension])('assigns distinct keys to every slot, whatever the lattice shape', (cols, rows) => {
    const seen = new Set<number>()
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        seen.add(slotIndex(col, row, cols))
      }
    }
    expect(seen.size).toBe(cols * rows)
  })
})
