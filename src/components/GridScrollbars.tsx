import type { Camera } from '../camera'
import type { ContentBounds } from '../gameOfLife'
import type { ElementSize } from '../hooks/useElementSize'
import { computeScrollbarMetrics, type ScrollbarAxis } from '../scrollbars'
import Scrollbar from './Scrollbar'

interface GridScrollbarsProps {
  camera: Camera
  contentBounds: ContentBounds | null
  size: ElementSize
  contentId: string
  onDrag: (axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number) => void
}

// Renders both scrollbars, computing their metrics itself from camera +
// contentBounds + size. Owns the measured gate below: size starts at 0x0
// (useElementSize hasn't observed yet), and rendering a scrollbar against
// that would show a nonsense thumb for one paint before the first real
// measurement arrives.
export default function GridScrollbars({ camera, contentBounds, size, contentId, onDrag }: GridScrollbarsProps) {
  if (!(size.width > 0 && size.height > 0)) return null

  const metrics = computeScrollbarMetrics(camera, contentBounds, size.width, size.height)

  return (
    <>
      <Scrollbar
        axis="x"
        metrics={metrics.horizontal}
        trackLengthPx={size.width}
        onDrag={onDrag}
        contentId={contentId}
      />
      <Scrollbar
        axis="y"
        metrics={metrics.vertical}
        trackLengthPx={size.height}
        onDrag={onDrag}
        contentId={contentId}
      />
    </>
  )
}
