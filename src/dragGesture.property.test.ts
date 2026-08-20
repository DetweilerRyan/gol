import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { advanceDrag, beginDrag, DRAG_THRESHOLD_PX, type DragGesture } from './dragGesture'

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
  // case is pinned down by a unit test in dragGesture.test.ts instead.
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
