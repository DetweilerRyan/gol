import fc from 'fast-check'
import { MAX_CELL_SIZE, MIN_CELL_SIZE, type Camera } from '../camera'

// fast-check arbitraries shared by the property tests of the camera-side
// modules (camera, gridGeometry, scrollbars). They all need "some plausible
// camera", and defining that once means a change to the zoom limits or the
// coordinate range flows to every property at the same time instead of
// drifting between three near-identical copies.

export const cellSizeArbitrary = fc.integer({ min: MIN_CELL_SIZE, max: MAX_CELL_SIZE })

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
