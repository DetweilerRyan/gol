import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import {
  applyWheelInput,
  centeredCamera,
  clampCellSize,
  DEFAULT_CELL_SIZE,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  panCamera,
  rectRelativePixels,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
  zoomPercentage,
  ZOOM_FACTOR,
  type Camera,
} from './camera'
import {
  cameraArbitrary as camera,
  cellSizeArbitrary as cellSize,
  pixelArbitrary as pixel,
} from './test-support/arbitraries'

const worldCoord = fc.integer({ min: -10_000, max: 10_000 })

// Integer-offset camera, reserved for the exact (non-toBeCloseTo)
// screenToWorld/worldToScreen round-trip property below. With an integer
// offset, integer world coordinate, and integer cellSize, every intermediate
// value in (worldX - offsetX) * cellSize / cellSize + offsetX is an exact
// integer, so the round trip can be asserted with strict equality. A
// fractional offset can't make that same exact-equality guarantee -- multiply
// then divide by the same float cellSize isn't always a true no-op in
// IEEE754, and fast-check's shrinking specifically hunts for boundary floats
// most likely to expose that, which would be a false positive (a real but
// harmless floating-point quirk, not a logic bug) rather than a real failure.
const integerOffset = fc.integer({ min: -10_000, max: 10_000 })
const integerOffsetCamera: fc.Arbitrary<Camera> = fc.record({
  offsetX: integerOffset,
  offsetY: integerOffset,
  cellSize,
})

describe('clampCellSize (property)', () => {
  const anySize = fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true })

  it.prop([anySize])('always returns a value within [MIN_CELL_SIZE, MAX_CELL_SIZE]', (size) => {
    const clamped = clampCellSize(size)
    expect(clamped).toBeGreaterThanOrEqual(MIN_CELL_SIZE)
    expect(clamped).toBeLessThanOrEqual(MAX_CELL_SIZE)
  })

  it.prop([anySize])('is idempotent', (size) => {
    const once = clampCellSize(size)
    expect(clampCellSize(once)).toBe(once)
  })
})

describe('worldToScreen / screenToWorld (property)', () => {
  it.prop([integerOffsetCamera, worldCoord, worldCoord])(
    'screenToWorld exactly inverts worldToScreen for integer world coordinates, for any camera',
    (cam, x, y) => {
      const screen = worldToScreen(cam, x, y)
      expect(screenToWorld(cam, screen.x, screen.y)).toEqual({ x, y })
    },
  )

  it.prop([camera, worldCoord, worldCoord, worldCoord, worldCoord])(
    'the screen distance between two world points scales linearly with cellSize, independent of camera offset',
    (cam, x1, y1, x2, y2) => {
      const p1 = worldToScreen(cam, x1, y1)
      const p2 = worldToScreen(cam, x2, y2)
      expect(p2.x - p1.x).toBeCloseTo((x2 - x1) * cam.cellSize)
      expect(p2.y - p1.y).toBeCloseTo((y2 - y1) * cam.cellSize)
    },
  )
})

describe('panCamera (property)', () => {
  it.prop([camera])('panning by (0, 0) is a no-op', (cam) => {
    expect(panCamera(cam, 0, 0)).toEqual(cam)
  })

  it.prop([camera, pixel, pixel])('always preserves cellSize', (cam, dx, dy) => {
    expect(panCamera(cam, dx, dy).cellSize).toBe(cam.cellSize)
  })

  it.prop([camera, pixel, pixel])(
    'panning by (dx, dy) then by (-dx, -dy) restores the original offset',
    (cam, dx, dy) => {
      const back = panCamera(panCamera(cam, dx, dy), -dx, -dy)
      expect(back.offsetX).toBeCloseTo(cam.offsetX)
      expect(back.offsetY).toBeCloseTo(cam.offsetY)
    },
  )

  it.prop([camera, pixel, pixel, pixel, pixel])(
    'pixel deltas are additive across two successive pans',
    (cam, dx1, dy1, dx2, dy2) => {
      const sequential = panCamera(panCamera(cam, dx1, dy1), dx2, dy2)
      const combined = panCamera(cam, dx1 + dx2, dy1 + dy2)
      expect(sequential.offsetX).toBeCloseTo(combined.offsetX)
      expect(sequential.offsetY).toBeCloseTo(combined.offsetY)
    },
  )
})

describe('zoomCameraAtPoint (property)', () => {
  const zoomFactor = fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true })

  it.prop([camera, pixel, pixel, zoomFactor])(
    'keeps the world point under the cursor fixed on screen, whenever the zoom is not clamped to a no-op',
    (cam, pixelX, pixelY, factor) => {
      const next = zoomCameraAtPoint(cam, pixelX, pixelY, factor)
      fc.pre(next.cellSize !== cam.cellSize)

      const worldX = cam.offsetX + pixelX / cam.cellSize
      const worldY = cam.offsetY + pixelY / cam.cellSize
      const screenAfter = worldToScreen(next, worldX, worldY)
      expect(screenAfter.x).toBeCloseTo(pixelX)
      expect(screenAfter.y).toBeCloseTo(pixelY)
    },
  )

  it.prop([camera, pixel, pixel])(
    'a factor of 1 is always a no-op (returns the same camera reference)',
    (cam, pixelX, pixelY) => {
      expect(zoomCameraAtPoint(cam, pixelX, pixelY, 1)).toBe(cam)
    },
  )

  it.prop([camera, pixel, pixel, fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true })])(
    'always clamps cellSize within [MIN_CELL_SIZE, MAX_CELL_SIZE]',
    (cam, pixelX, pixelY, factor) => {
      const next = zoomCameraAtPoint(cam, pixelX, pixelY, factor)
      expect(next.cellSize).toBeGreaterThanOrEqual(MIN_CELL_SIZE)
      expect(next.cellSize).toBeLessThanOrEqual(MAX_CELL_SIZE)
    },
  )
})

describe('centeredCamera (property)', () => {
  const viewportDimension = fc.integer({ min: 0, max: 4000 })

  it.prop([viewportDimension, viewportDimension])('always uses the default cell size', (width, height) => {
    expect(centeredCamera(width, height).cellSize).toBe(DEFAULT_CELL_SIZE)
  })

  it.prop([viewportDimension, viewportDimension])(
    'places the world origin at the exact center of the viewport',
    (width, height) => {
      const screen = worldToScreen(centeredCamera(width, height), 0, 0)
      expect(screen.x).toBeCloseTo(width / 2)
      expect(screen.y).toBeCloseTo(height / 2)
    },
  )
})

describe('applyWheelInput (property)', () => {
  it.prop([camera, pixel, pixel, pixel, pixel])(
    'never changes cellSize when neither shiftKey nor ctrlKey is held',
    (cam, pixelX, pixelY, deltaX, deltaY) => {
      const next = applyWheelInput(cam, {
        pixelX,
        pixelY,
        deltaX,
        deltaY,
        deltaMode: 0,
        shiftKey: false,
        ctrlKey: false,
      })
      expect(next.cellSize).toBe(cam.cellSize)
    },
  )

  it.prop([camera, pixel, pixel, pixel, pixel])(
    'when shiftKey is true and deltaY is nonzero, deltaX is completely ignored',
    (cam, pixelX, pixelY, deltaY, deltaX) => {
      fc.pre(deltaY !== 0)
      const withDeltaX = applyWheelInput(cam, {
        pixelX,
        pixelY,
        deltaX,
        deltaY,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      const withoutDeltaX = applyWheelInput(cam, {
        pixelX,
        pixelY,
        deltaX: 0,
        deltaY,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      expect(withDeltaX).toEqual(withoutDeltaX)
    },
  )

  // The resolved factor here has to stay a byte-identical restatement of
  // camera.ts's own wheelZoomFactor expression at deltaMode 0 -- this is an
  // equivalence property, not an independent oracle, and a mathematically
  // equal but differently-associated expression can differ by the same float
  // rounding that made the reciprocal-exactness unit test in camera.test.ts
  // worth pinning with toBe in the first place.
  it.prop([camera, pixel, pixel, pixel])(
    'when shiftKey is true, is equivalent to calling zoomCameraAtPoint directly with the resolved factor',
    (cam, pixelX, pixelY, deltaY) => {
      fc.pre(deltaY !== 0)
      const factor = ZOOM_FACTOR ** -(deltaY / 100)
      const viaWheel = applyWheelInput(cam, {
        pixelX,
        pixelY,
        deltaX: 0,
        deltaY,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      const viaDirect = zoomCameraAtPoint(cam, pixelX, pixelY, factor)
      expect(viaWheel).toEqual(viaDirect)
    },
  )
})

describe('zoomPercentage (property)', () => {
  it.prop([camera, camera])('is monotonic: a larger cell size never yields a smaller percentage', (camA, camB) => {
    fc.pre(camA.cellSize <= camB.cellSize)
    expect(zoomPercentage(camA)).toBeLessThanOrEqual(zoomPercentage(camB))
  })
})

describe('rectRelativePixels (property)', () => {
  const coord = fc.float({ min: Math.fround(-4000), max: Math.fround(4000), noNaN: true })

  it.prop([coord, coord, coord, coord])(
    'translating the rect and the point together leaves the relative pixels unchanged',
    (left, top, clientX, clientY) => {
      const base = rectRelativePixels({ left, top }, clientX, clientY)
      const shifted = rectRelativePixels({ left: left + 100, top: top + 100 }, clientX + 100, clientY + 100)
      expect(shifted.pixelX).toBeCloseTo(base.pixelX)
      expect(shifted.pixelY).toBeCloseTo(base.pixelY)
    },
  )

  it.prop([coord, coord])('a point at the rect origin is always (0, 0)', (left, top) => {
    expect(rectRelativePixels({ left, top }, left, top)).toEqual({ pixelX: 0, pixelY: 0 })
  })
})
