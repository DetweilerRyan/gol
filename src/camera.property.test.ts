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

// WHEEL DELTAS ARE DRAWN UNIFORMLY OVER A PLAUSIBLE ROLL, NOT FROM
// pixelArbitrary, AND THE DIFFERENCE IS THE WHOLE STRENGTH OF THE TWO
// ALGEBRAIC PROPERTIES BELOW.
//
// fc.float draws uniformly over the REPRESENTABLE floats in its range, not
// uniformly over the interval, and representable floats crowd towards zero:
// measured over 20,000 draws of pixelArbitrary (+/-2000), 16,682 came out
// under 0.01 in magnitude and 17,482 under 1. That is right for a pixel
// POSITION, where the near-origin cases are the interesting ones, and wrong
// for a wheel DELTA, where a 0.005px roll is a gesture no mapping can be
// told apart on -- every candidate implementation returns the camera
// unchanged there.
//
// Measured consequence, on the fault the properties below exist to exclude
// (quantizing a rolled distance to whole notches, which keeps the notch as
// the unit and so still discards the sub-notch magnitude this module maps):
// under pixelArbitrary the additive-composition property separates it on 7
// of 26,192 kept draws (0.027%, ~2% per 100-run invocation); under this
// arbitrary, on 13.9%, which is every invocation. Same property, same
// implementation, opposite verdicts.
//
// 0.1px granularity so sub-notch fractions are actually drawn, and +/-400px
// (four notches) because the range trades off against the zoom limits: the
// whole MIN_CELL_SIZE..MAX_CELL_SIZE span is only 9.03 notches wide, so a
// wide draw saturates and both sides of a composition land on the same
// clamp, agreeing for a reason that has nothing to do with the mapping.
// Measured, as the share of kept draws with both sides clamped / the share
// on which the quantize fault is separated: +/-200px 10% / 15.8%, +/-400px
// 19% / 14.2%, +/-1000px 50% / 8.2%, +/-2000px 69% / 3.2%.
const wheelDelta = fc.integer({ min: -4000, max: 4000 }).map((tenthsOfAPixel) => tenthsOfAPixel / 10)

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

  // These two replace a prior property that asserted applyWheelInput was
  // equivalent to zoomCameraAtPoint called with a locally-rewritten copy of
  // camera.ts's own wheelZoomFactor expression -- an equivalence check
  // against the implementation, not an independent oracle, since it agrees
  // with the source by construction. Both properties below instead pin the
  // algebraic structure wheelZoomFactor's own header comment claims
  // (factors compose by multiplication) without ever restating the formula.
  //
  // The fc.pre calls SCOPE these properties rather than detecting anything:
  // they say the invariants are claimed only for gestures that did not hit
  // a zoom limit, since composition genuinely does not survive a clamp.
  // clampCellSize can only ever return exactly MIN_CELL_SIZE or exactly
  // MAX_CELL_SIZE, never a value strictly between, so a result in the open
  // interval is one no clamp touched -- which is what makes the open-interval
  // test an exact statement of that scope and not an approximation of it.
  //
  // FAULT BATTERY -- eight faults injected into src/camera.ts by hand, each
  // run against src/camera.test.ts + src/camera.property.test.ts alone (59
  // tests). Read the non-kills as carefully as the kills: they are what
  // these two properties structurally cannot see.
  //
  //   F1  base ZOOM_FACTOR -> 1.5             both GREEN   (9 unit tests red)
  //   F2  WHEEL_ZOOM_NOTCH_PX 100 -> 200      both GREEN   (7 unit tests red)
  //   F3  exponent -notches -> notches        both GREEN   (8 unit tests red)
  //   F4  exponential -> linear 1 - n * 0.25  BOTH RED     3/3 runs
  //   F5  notches -> Math.round(notches)      additive RED 4/4; reciprocal GREEN
  //   F6  deltaMode === 0 -> !== 0            additive RED 4/4; reciprocal GREEN
  //   F7  zoom guard drops || input.ctrlKey   both GREEN   (1 unit test red)
  //   F8  zoom anchor pixelX/pixelY swapped   both GREEN   (1 unit test red)
  //
  // BOTH properties are needed and neither subsumes the other. F4 is the
  // only fault reciprocality catches that additive composition does not
  // need, and F5/F6 are caught by additive composition alone -- a sign-only
  // or round-to-notch mapping is still perfectly reciprocal, because
  // Math.round(-x) === -Math.round(x) away from the .5 ties, so no amount of
  // sampling would make reciprocality see either.
  //
  // F1, F2 and F3 are non-kills BY CONSTRUCTION, and no restatement of these
  // properties would change that: reciprocality and additive composition
  // hold for ANY exponential family b ** (kd), whatever b and k are and
  // whichever sign k carries. So nothing here pins the base to ZOOM_FACTOR
  // or a notch to WHEEL_ZOOM_NOTCH_PX -- that calibration is held entirely
  // by unit tests in camera.test.ts ('lands on exactly one ZOOM_FACTOR
  // step...' for the whole-notch rung, the 112% discriminator for the
  // fraction, and the deltaMode-1 test for line mode), and by the Gherkin
  // layer. That is a division of labour rather than a gap: a property that
  // pinned the base could only do it by restating the formula, which is
  // exactly what these two replaced.
  //
  // F5 is the fault that made this file's wheelDelta arbitrary necessary --
  // see its comment above. It is what this whole slice exists to exclude,
  // and drawn from pixelArbitrary the additive property separated it on
  // 0.027% of kept draws, which is a property nobody would ever see fail.
  //
  // F7 and F8 are non-kills of REACH rather than of structure: every draw
  // here fixes ctrlKey at false, and neither property looks at the resulting
  // offsets at all. F7 is caught by the it.each pinch row in camera.test.ts;
  // F8 by 'zooms (leaves offset behaving like zoomCameraAtPoint)...', which
  // anchors at an asymmetric (100, 50) so a swap cannot hide. The offset
  // half of this path is otherwise covered by composition rather than by
  // restatement -- zoomCameraAtPoint's own fixed-point property above
  // quantifies over factors in (0.1, 10), and an unclamped wheel zoom
  // cannot produce a factor outside [8/60, 60/8].
  it.prop([camera, pixel, pixel, wheelDelta])(
    'is reciprocal: zooming by a delta and then by its exact negation returns to the original cellSize',
    (cam, pixelX, pixelY, deltaY) => {
      fc.pre(deltaY !== 0)
      const forward = applyWheelInput(cam, {
        pixelX,
        pixelY,
        deltaX: 0,
        deltaY,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      fc.pre(forward.cellSize > MIN_CELL_SIZE && forward.cellSize < MAX_CELL_SIZE)
      const back = applyWheelInput(forward, {
        pixelX,
        pixelY,
        deltaX: 0,
        deltaY: -deltaY,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      expect(back.cellSize).toBeCloseTo(cam.cellSize)
    },
  )

  it.prop([camera, pixel, pixel, wheelDelta, wheelDelta])(
    'composes additively: applying two deltas in sequence lands on the same cellSize as applying their sum in one gesture',
    (cam, pixelX, pixelY, deltaY1, deltaY2) => {
      const first = applyWheelInput(cam, {
        pixelX,
        pixelY,
        deltaX: 0,
        deltaY: deltaY1,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      fc.pre(first.cellSize > MIN_CELL_SIZE && first.cellSize < MAX_CELL_SIZE)
      const sequential = applyWheelInput(first, {
        pixelX,
        pixelY,
        deltaX: 0,
        deltaY: deltaY2,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      const combined = applyWheelInput(cam, {
        pixelX,
        pixelY,
        deltaX: 0,
        deltaY: deltaY1 + deltaY2,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      })
      expect(sequential.cellSize).toBeCloseTo(combined.cellSize)
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
