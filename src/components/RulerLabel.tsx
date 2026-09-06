import { worldToScreen, type Camera } from '../camera'

interface RulerLabelProps {
  axis: 'x' | 'y'
  coordinate: number
  camera: Camera
}

/**
 * One coordinate label, pinned to the top edge for `axis: 'x'` (GridRuler's
 * "Column ruler" group) or the left edge for `axis: 'y'` (its "Row ruler"
 * group) -- otherwise the x and y rulers are identical.
 */
// pointer-events-none keeps these from interfering with cell clicks/dragging
// underneath.
export default function RulerLabel({ axis, coordinate, camera }: RulerLabelProps) {
  const screen = axis === 'x' ? worldToScreen(camera, coordinate, 0) : worldToScreen(camera, 0, coordinate)
  const edgeClass = axis === 'x' ? 'top-0.5' : 'left-0.5'
  const transform = axis === 'x' ? `translateX(${screen.x + 2}px)` : `translateY(${screen.y + 2}px)`

  return (
    <span
      className={`absolute ${edgeClass} pointer-events-none rounded bg-gray-50/80 px-0.5 text-[10px] leading-none text-gray-500 dark:bg-zinc-800/80 dark:text-zinc-400`}
      style={{ transform }}
    >
      {coordinate}
    </span>
  )
}
