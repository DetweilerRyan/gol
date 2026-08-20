import { describe, expect, it } from 'vitest'
import { advanceDrag, beginDrag, DRAG_THRESHOLD_PX } from './dragGesture'

describe('beginDrag', () => {
  it('anchors both the start and the last position at the pointer-down point, not yet panning', () => {
    expect(beginDrag(120, -40)).toEqual({ startX: 120, startY: -40, lastX: 120, lastY: -40, isPanning: false })
  })
})

describe('advanceDrag', () => {
  it('does not pan while the movement stays within the drag threshold', () => {
    const advance = advanceDrag(beginDrag(100, 100), 102, 101)
    expect(advance.gesture.isPanning).toBe(false)
    expect(advance.panDxPixels).toBe(0)
    expect(advance.panDyPixels).toBe(0)
  })

  it('treats a movement of exactly DRAG_THRESHOLD_PX as still within the threshold', () => {
    const advance = advanceDrag(beginDrag(0, 0), DRAG_THRESHOLD_PX, 0)
    expect(advance.gesture.isPanning).toBe(false)
  })

  it('starts panning just past the threshold, panning by that first move’s full delta', () => {
    const advance = advanceDrag(beginDrag(0, 0), DRAG_THRESHOLD_PX + 1, 0)
    expect(advance.gesture.isPanning).toBe(true)
    expect(advance.panDxPixels).toBe(DRAG_THRESHOLD_PX + 1)
    expect(advance.panDyPixels).toBe(0)
  })

  it('measures the threshold as a radius, not per axis', () => {
    // hypot(3, 3) ~= 4.24 > 4, though neither axis alone exceeds the threshold.
    expect(advanceDrag(beginDrag(0, 0), 3, 3).gesture.isPanning).toBe(true)
    // hypot(-3, -3) is the same distance in the opposite direction.
    expect(advanceDrag(beginDrag(0, 0), -3, -3).gesture.isPanning).toBe(true)
  })

  it('pans by the delta since the previous position, not since the start of the gesture', () => {
    const first = advanceDrag(beginDrag(100, 100), 120, 100)
    const second = advanceDrag(first.gesture, 130, 90)
    expect(second.panDxPixels).toBe(10)
    expect(second.panDyPixels).toBe(-10)
  })

  it('keeps panning after the pointer returns inside the threshold, since isPanning latches', () => {
    const crossed = advanceDrag(beginDrag(0, 0), 50, 0)
    const returned = advanceDrag(crossed.gesture, 1, 0)
    expect(returned.gesture.isPanning).toBe(true)
    expect(returned.panDxPixels).toBe(-49)
  })

  it('leaves the original gesture untouched', () => {
    const gesture = beginDrag(10, 10)
    advanceDrag(gesture, 500, 500)
    expect(gesture).toEqual({ startX: 10, startY: 10, lastX: 10, lastY: 10, isPanning: false })
  })

  it('keeps the start point fixed across the whole gesture', () => {
    const first = advanceDrag(beginDrag(10, 20), 100, 200)
    const second = advanceDrag(first.gesture, 300, 400)
    expect(second.gesture.startX).toBe(10)
    expect(second.gesture.startY).toBe(20)
    expect(second.gesture.lastX).toBe(300)
    expect(second.gesture.lastY).toBe(400)
  })
})
