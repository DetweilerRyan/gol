import { useEffect, type RefObject } from 'react'
import { rectRelativePixels, type WheelInput } from '../viewport'

// Bridges native wheel events on an element to viewport.ts's WheelInput,
// converting the event's client coordinates into element-relative pixels so
// callers never see a DOM event at all.
//
// Registered imperatively with { passive: false } rather than as a React
// onWheel prop: React attaches its own wheel listener passively, which makes
// preventDefault a no-op, and without preventDefault the browser's own
// page-level scroll/zoom fires alongside ours.
export function useWheelInput(ref: RefObject<HTMLElement | null>, onWheelInput: (input: WheelInput) => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const { pixelX, pixelY } = rectRelativePixels(el!.getBoundingClientRect(), e.clientX, e.clientY)
      onWheelInput({ pixelX, pixelY, deltaX: e.deltaX, deltaY: e.deltaY, shiftKey: e.shiftKey })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [ref, onWheelInput])
}
