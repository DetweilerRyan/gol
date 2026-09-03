import fc from 'fast-check'
import { MAX_CELL_SIZE, MIN_CELL_SIZE, type Camera } from '../camera'

// fast-check arbitraries shared by the property tests of the camera-side
// modules (camera, gridGeometry, scrollbars). They all need "some plausible
// camera", and defining that once means a change to the zoom limits or the
// coordinate range flows to every property at the same time instead of
// drifting between three near-identical copies.

export const cellSizeArbitrary = fc.integer({ min: MIN_CELL_SIZE, max: MAX_CELL_SIZE })

// A pixel POSITION. Do not reach for this as a magnitude -- a delta, a
// distance, a length. fc.float draws uniformly over the REPRESENTABLE floats
// in its range rather than uniformly over the interval, and representable
// floats crowd towards zero: measured over 20,000 draws, 16,682 come out
// under 0.01 in magnitude and 17,482 under 1. That bias is exactly right for
// a position, where the near-origin cases are the interesting ones, and it
// silently guts a property about how FAR something moved, since almost every
// draw is a no-op. See camera.property.test.ts's wheelDelta for the worked
// case, where it hid the one implementation those properties exist to reject.
export const pixelArbitrary = fc.float({ min: Math.fround(-2000), max: Math.fround(2000), noNaN: true })

// General-purpose camera with a fractional offset, for properties that
// already tolerate floating-point rounding (toBeCloseTo). Properties needing
// exact equality build their own integer-offset camera -- see the comment in
// camera.property.test.ts.
const offsetArbitrary = fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true })

export const cameraArbitrary: fc.Arbitrary<Camera> = fc.record({
  offsetX: offsetArbitrary,
  offsetY: offsetArbitrary,
  cellSize: cellSizeArbitrary,
})
