import { worldToScreen, type Camera } from '../viewport'

interface RulerLabelProps {
  axis: 'x' | 'y'
  coordinate: number
  camera: Camera
}

// pointer-events-none keeps these from interfering with cell clicks/dragging
// underneath. axis picks which worldToScreen component positions the label
// and which edge it's pinned to -- otherwise the x and y rulers are identical.
export default function RulerLabel({ axis, coordinate, camera }: RulerLabelProps) {
  const screen = axis === 'x' ? worldToScreen(camera, coordinate, 0) : worldToScreen(camera, 0, coordinate)
  const edgeClass = axis === 'x' ? 'top-0.5' : 'left-0.5'
  const transform = axis === 'x' ? `translateX(${screen.x + 2}px)` : `translateY(${screen.y + 2}px)`

  return (
    <span
      className={`absolute ${edgeClass} pointer-events-none rounded bg-gray-50/80 px-0.5 text-[10px] leading-none text-gray-500`}
      style={{ transform }}
    >
      {coordinate}
    </span>
  )
}
