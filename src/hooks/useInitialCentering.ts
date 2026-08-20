import { useLayoutEffect, useRef } from 'react'
import type { ElementSize } from './useElementSize'

// Centers on the first measured size only. A layout effect (rather than a
// plain effect) so the re-centered camera is committed before paint, leaving
// no frame in which the grid is rendered at full size but still uncentered.
export function useInitialCentering(
  size: ElementSize,
  onFirstMeasure: (widthPx: number, heightPx: number) => void,
): void {
  const hasCenteredRef = useRef(false)

  useLayoutEffect(() => {
    const { width, height } = size
    if (!hasCenteredRef.current && width > 0 && height > 0) {
      hasCenteredRef.current = true
      onFirstMeasure(width, height)
    }
  }, [size, onFirstMeasure])
}
