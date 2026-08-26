import type { Camera } from './camera'
import type { ContentBounds } from './gameOfLife'

// Scrollbar thumb sizing, positioning, and drag math. This is the one place in
// the camera-side modules that has to know about the game model at all (via
// ContentBounds -- a scrollbar's whole job is to represent where the live
// cells are relative to the viewport), which is exactly why it's separate:
// camera.ts and gridGeometry.ts stay independent of gameOfLife.ts.

export interface ScrollbarMetrics {
  thumbRatio: number
  thumbOffsetRatio: number
}

export interface ScrollbarMetricsByAxis {
  horizontal: ScrollbarMetrics
  vertical: ScrollbarMetrics
}

// The scrollable "extent" is the union of the content bounds and the current
// visible viewport, in pixels -- not the content bounds alone. Content bounds
// alone can't represent the viewport once the camera has panned away from all
// live cells, which would otherwise put the thumb position outside [0, 1].
// Growing the extent to always include the viewport keeps every ratio valid
// with no special-casing: an empty/fully-visible grid falls out of the same
// formula as thumbRatio = 1, offsetRatio = 0, since extent then equals the
// viewport exactly.
// prettier-ignore
function computeAxisScrollbarMetrics(offset: number, cellSize: number, viewportSizePx: number, contentMin: number | undefined, contentMax: number | undefined): ScrollbarMetrics {
  const contentPxLeft = contentMin === undefined ? 0 : (contentMin - offset) * cellSize
  const contentPxRight = contentMax === undefined ? viewportSizePx : (contentMax - offset) * cellSize

  const extentPxLeft = Math.min(contentPxLeft, 0)
  const extentPxRight = Math.max(contentPxRight, viewportSizePx)
  const extentPxWidth = extentPxRight - extentPxLeft

  const thumbRatio = extentPxWidth > 0 ? Math.min(1, viewportSizePx / extentPxWidth) : 1
  const thumbOffsetRatio =
    extentPxWidth > viewportSizePx ? Math.min(1, Math.max(0, -extentPxLeft / (extentPxWidth - viewportSizePx))) : 0

  return { thumbRatio, thumbOffsetRatio }
}

// prettier-ignore
export function computeScrollbarMetrics(camera: Camera, contentBounds: ContentBounds | null, viewportWidthPx: number, viewportHeightPx: number): ScrollbarMetricsByAxis {
  return {
    horizontal: computeAxisScrollbarMetrics(
      camera.offsetX,
      camera.cellSize,
      viewportWidthPx,
      contentBounds?.minX,
      contentBounds?.maxX,
    ),
    vertical: computeAxisScrollbarMetrics(
      camera.offsetY,
      camera.cellSize,
      viewportHeightPx,
      contentBounds?.minY,
      contentBounds?.maxY,
    ),
  }
}

export interface ThumbGeometry {
  lengthPx: number
  offsetPx: number
}

const MIN_THUMB_PX = 24

// The thumb's rendered size/position is a pure rendering concern, separate
// from the drag math in panCameraByScrollbarDrag below. MIN_THUMB_PX keeps
// the thumb grabbable even when the content is enormous relative to the
// viewport, clamped so it never exceeds the track itself.
export function computeThumbGeometry(metrics: ScrollbarMetrics, trackLengthPx: number): ThumbGeometry {
  const lengthPx = Math.min(trackLengthPx, Math.max(MIN_THUMB_PX, metrics.thumbRatio * trackLengthPx))
  const offsetPx = metrics.thumbOffsetRatio * (trackLengthPx - lengthPx)
  return { lengthPx, offsetPx }
}

export type ScrollbarAxis = 'x' | 'y'

// Thumb-drag pixels are treated as 1:1 with on-screen track pixels, and a
// deltaTrackPx thumb movement corresponds to deltaTrackPx / thumbRatio px of
// content motion -- the inverse of thumbRatio being how much the track is
// compressed relative to the content it represents. That 1:1 relation is the
// ACCEPTED CONTRACT ("dragging a thumb covering a quarter of its track pans
// four times as far", asserted exactly with toEqual), not a consequence of
// the track spanning the full viewport edge -- Scrollbar.tsx's track is
// inset by SCROLLBAR_THICKNESS_PX (10px) on each axis, so track pixels and
// viewport pixels now differ slightly. Left uncorrected (as below), dragging
// the thumb all the way to the track's end leaves the camera ~0.78% short of
// the full content extent -- a residual that's self-healing, since thumb
// position is derived from the camera on every render rather than
// accumulated from drag deltas, so it never compounds. Do NOT "fix" this by
// scaling deltaTrackPx by viewport/track (e.g. x1280/1270): that turns the
// pinned 50px drag -> 200px pan scenario into ~201.57px and reddens the
// accepted bdd layer. Follows the "document scroll" sign convention (thumb
// right/down reveals further content, offset increases), matching
// camera.ts's applyWheelInput -- the opposite sign from
// panCamera's drag-to-pan convention. thumbRatio must be the value from when
// the drag started, not recomputed mid-drag, since panning changes the
// content's own pixel position and would otherwise feed back on itself.
// prettier-ignore
export function panCameraByScrollbarDrag(camera: Camera, axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number): Camera {
  if (thumbRatio <= 0) return camera

  const deltaOffset = deltaTrackPx / thumbRatio / camera.cellSize
  return axis === 'x'
    ? { ...camera, offsetX: camera.offsetX + deltaOffset }
    : { ...camera, offsetY: camera.offsetY + deltaOffset }
}
