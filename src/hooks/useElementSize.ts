import { useLayoutEffect, useState, type RefObject } from 'react'

export interface ElementSize {
  width: number
  height: number
}

// Tracks an element's content-box size via ResizeObserver, isolating that
// browser API (and its observe/disconnect lifecycle) from the components that
// need a measured size. Starts at 0x0: the first observation only arrives
// after layout, so callers must treat zero as "not measured yet" rather than
// as a real size.
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return size
}
