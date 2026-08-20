import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import {
  advanceDrag,
  applyWheelInput,
  beginDrag,
  centeredCamera,
  clampCellSize,
  computeMajorGridlines,
  computeThumbGeometry,
  computeVisibleRange,
  DEFAULT_CELL_SIZE,
  DRAG_THRESHOLD_PX,
  isMajorGridline,
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
  type DragGesture,
  type VisibleRange,
} from './viewport'

const cellSize = fc.integer({ min: MIN_CELL_SIZE, max: MAX_CELL_SIZE })
const pixel = fc.float({ min: Math.fround(-2000), max: Math.fround(2000), noNaN: true })
const worldCoord = fc.integer({ min: -10_000, max: 10_000 })

// General-purpose camera with a fractional offset, for properties that
// already tolerate floating-point rounding (toBeCloseTo).
const offset = fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true })
const camera: fc.Arbitrary<Camera> = fc.record({ offsetX: offset, offsetY: offset, cellSize })

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

describe('computeVisibleRange (property)', () => {
  const viewportDimension = fc.integer({ min: 0, max: 4000 })

  it.prop([camera, viewportDimension, viewportDimension])(
    'always produces a well-formed, non-inverted range',
    (cam, width, height) => {
      const range = computeVisibleRange(cam, width, height)
      expect(range.minX).toBeLessThanOrEqual(range.maxX)
      expect(range.minY).toBeLessThanOrEqual(range.maxY)
    },
  )

  it.prop([camera, viewportDimension, viewportDimension])(
    'is always wide/tall enough to cover the requested viewport size in cells',
    (cam, width, height) => {
      const range = computeVisibleRange(cam, width, height)
      expect(range.maxX - range.minX).toBeGreaterThanOrEqual(width / cam.cellSize)
      expect(range.maxY - range.minY).toBeGreaterThanOrEqual(height / cam.cellSize)
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

describe('isMajorGridline (property)', () => {
  it.prop([worldCoord])('is periodic with period 10', (n) => {
    expect(isMajorGridline(n + 10)).toBe(isMajorGridline(n))
    expect(isMajorGridline(n - 10)).toBe(isMajorGridline(n))
  })

  it.prop([fc.integer({ min: -10_000, max: 10_000 })])('is true for every exact multiple of 10', (n) => {
    expect(isMajorGridline(n * 10)).toBe(true)
  })
})

describe('computeMajorGridlines (property)', () => {
  const rangeEndpoint = fc.integer({ min: -500, max: 500 })

  function bruteForceGridlines(min: number, max: number): number[] {
    const lines: number[] = []
    for (let i = min; i <= max; i++) {
      if (isMajorGridline(i)) lines.push(i)
    }
    return lines
  }

  it.prop([rangeEndpoint, rangeEndpoint, rangeEndpoint, rangeEndpoint])(
    'matches a brute-force scan of every coordinate in range, on both axes',
    (a, b, c, d) => {
      const range: VisibleRange = {
        minX: Math.min(a, b),
        maxX: Math.max(a, b),
        minY: Math.min(c, d),
        maxY: Math.max(c, d),
      }
      const gridlines = computeMajorGridlines(range)
      expect(gridlines.x).toEqual(bruteForceGridlines(range.minX, range.maxX))
      expect(gridlines.y).toEqual(bruteForceGridlines(range.minY, range.maxY))
    },
  )

  it.prop([rangeEndpoint, rangeEndpoint])('every returned gridline is within range and a multiple of 10', (a, b) => {
    const range: VisibleRange = { minX: Math.min(a, b), maxX: Math.max(a, b), minY: 0, maxY: 0 }
    for (const x of computeMajorGridlines(range).x) {
      expect(x).toBeGreaterThanOrEqual(range.minX)
      expect(x).toBeLessThanOrEqual(range.maxX)
      expect(isMajorGridline(x)).toBe(true)
    }
  })
})

describe('applyWheelInput (property)', () => {
  it.prop([camera, pixel, pixel, pixel, pixel])(
    'never changes cellSize when shiftKey is false',
    (cam, pixelX, pixelY, deltaX, deltaY) => {
      const next = applyWheelInput(cam, { pixelX, pixelY, deltaX, deltaY, shiftKey: false })
      expect(next.cellSize).toBe(cam.cellSize)
    },
  )

  it.prop([camera, pixel, pixel, pixel, pixel])(
    'when shiftKey is true and deltaY is nonzero, deltaX is completely ignored',
    (cam, pixelX, pixelY, deltaY, deltaX) => {
      fc.pre(deltaY !== 0)
      const withDeltaX = applyWheelInput(cam, { pixelX, pixelY, deltaX, deltaY, shiftKey: true })
      const withoutDeltaX = applyWheelInput(cam, { pixelX, pixelY, deltaX: 0, deltaY, shiftKey: true })
      expect(withDeltaX).toEqual(withoutDeltaX)
    },
  )

  it.prop([camera, pixel, pixel, pixel])(
    'when shiftKey is true, is equivalent to calling zoomCameraAtPoint directly with the resolved factor',
    (cam, pixelX, pixelY, deltaY) => {
      fc.pre(deltaY !== 0)
      const factor = deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
      const viaWheel = applyWheelInput(cam, { pixelX, pixelY, deltaX: 0, deltaY, shiftKey: true })
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

describe('beginDrag / advanceDrag (property)', () => {
  const clientCoord = fc.integer({ min: -4000, max: 4000 })
  const point = fc.tuple(clientCoord, clientCoord)
  // A gesture already past the drag threshold, i.e. mid-pan.
  const panningGesture: fc.Arbitrary<DragGesture> = fc.record({
    startX: clientCoord,
    startY: clientCoord,
    lastX: clientCoord,
    lastY: clientCoord,
    isPanning: fc.constant(true),
  })
  // Any offset that stays within the drag threshold, expressed in polar form
  // so the whole disc (not just the axis-aligned points) gets explored. The
  // radius stops just short of the threshold: at exactly DRAG_THRESHOLD_PX,
  // hypot(r*cos, r*sin) can land a float ULP above r and flip the
  // strictly-greater-than comparison, which is a rounding artifact of the test's
  // own polar construction rather than a property violation. The exact-boundary
  // case is pinned down by a unit test in viewport.test.ts instead.
  const withinThreshold = fc
    .tuple(
      fc.float({ min: 0, max: Math.fround(DRAG_THRESHOLD_PX * 0.999), noNaN: true }),
      fc.float({ min: 0, max: Math.fround(2 * Math.PI), noNaN: true }),
    )
    .map(([radius, angle]) => [radius * Math.cos(angle), radius * Math.sin(angle)] as const)

  it.prop([clientCoord, clientCoord, withinThreshold])(
    'never pans while the pointer stays within the drag threshold of where it went down',
    (startX, startY, [dx, dy]) => {
      const advance = advanceDrag(beginDrag(startX, startY), startX + dx, startY + dy)
      expect(advance.gesture.isPanning).toBe(false)
      expect(advance.panDxPixels).toBe(0)
      expect(advance.panDyPixels).toBe(0)
    },
  )

  it.prop([panningGesture, clientCoord, clientCoord])(
    'once panning, every subsequent move keeps panning -- isPanning never un-latches',
    (gesture, x, y) => {
      expect(advanceDrag(gesture, x, y).gesture.isPanning).toBe(true)
    },
  )

  it.prop([panningGesture, fc.array(point, { minLength: 1, maxLength: 20 })])(
    'once panning, the incremental pan deltas sum to the total displacement of the gesture',
    (gesture, points) => {
      let current = gesture
      let totalDx = 0
      let totalDy = 0
      for (const [x, y] of points) {
        const advance = advanceDrag(current, x, y)
        totalDx += advance.panDxPixels
        totalDy += advance.panDyPixels
        current = advance.gesture
      }
      const [finalX, finalY] = points.at(-1) as [number, number]
      expect(totalDx).toBe(finalX - gesture.lastX)
      expect(totalDy).toBe(finalY - gesture.lastY)
    },
  )

  it.prop([clientCoord, clientCoord, fc.array(point, { minLength: 1, maxLength: 20 })])(
    'the start point stays anchored at pointer-down, and the last point always tracks the newest position',
    (startX, startY, points) => {
      let current = beginDrag(startX, startY)
      for (const [x, y] of points) {
        current = advanceDrag(current, x, y).gesture
        expect(current.startX).toBe(startX)
        expect(current.startY).toBe(startY)
        expect(current.lastX).toBe(x)
        expect(current.lastY).toBe(y)
      }
    },
  )
})

describe('computeThumbGeometry (property)', () => {
  const ratio = fc.float({ min: 0, max: 1, noNaN: true })
  const trackLengthPx = fc.integer({ min: 0, max: 4000 })

  it.prop([ratio, ratio, trackLengthPx])(
    'the thumb never extends past the track, in either length or offset',
    (thumbRatio, thumbOffsetRatio, track) => {
      const { lengthPx, offsetPx } = computeThumbGeometry({ thumbRatio, thumbOffsetRatio }, track)
      expect(lengthPx).toBeLessThanOrEqual(track)
      expect(offsetPx).toBeGreaterThanOrEqual(0)
      // +epsilon guards against float rounding in offsetRatio * (track - lengthPx), not a real slack in the invariant.
      expect(offsetPx + lengthPx).toBeLessThanOrEqual(track + 1e-9)
    },
  )
})
