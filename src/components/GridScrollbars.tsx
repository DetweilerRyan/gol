import type { Camera } from '../camera'
import { useContentBounds } from '../hooks/useContentBounds'
import type { ElementSize } from '../hooks/useElementSize'
import type { LiveCellStore } from '../liveCellStore'
import { computeScrollbarMetrics, type ScrollbarAxis } from '../scrollbars'
import Scrollbar from './Scrollbar'

interface GridScrollbarsProps {
  camera: Camera
  store: LiveCellStore
  size: ElementSize
  contentId: string
  onDrag: (axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number) => void
}

// Renders both scrollbars, computing their metrics itself from camera +
// contentBounds + size. Subscribes to the store's content bounds directly
// (rather than taking contentBounds as a prop) so this is the one overlay
// that re-renders on a generation tick that moves the bounding box --
// LifeBoard itself stays wiring-only and never touches live-cell data. Owns
// the measured gate below: size starts at 0x0 (useElementSize hasn't
// observed yet), and rendering a scrollbar against that would show a
// nonsense thumb for one paint before the first real measurement arrives.
export default function GridScrollbars({ camera, store, size, contentId, onDrag }: GridScrollbarsProps) {
  const contentBounds = useContentBounds(store)

  if (!(size.width > 0 && size.height > 0)) return null

  const metrics = computeScrollbarMetrics(camera, contentBounds, size.width, size.height)

  return (
    <>
      <Scrollbar
        axis="x"
        metrics={metrics.horizontal}
        viewportLengthPx={size.width}
        onDrag={onDrag}
        contentId={contentId}
      />
      <Scrollbar
        axis="y"
        metrics={metrics.vertical}
        viewportLengthPx={size.height}
        onDrag={onDrag}
        contentId={contentId}
      />
    </>
  )
}
