import type { Camera } from '../camera'
import type { MajorGridlines } from '../gridGeometry'
import RulerLabel from './RulerLabel'

interface GridRulerProps {
  gridlines: MajorGridlines
  camera: Camera
}

// Coordinate ruler: one RulerLabel per axis per major gridline.
// pointer-events-none (on RulerLabel itself) keeps these from interfering
// with cell clicks/dragging underneath.
export default function GridRuler({ gridlines, camera }: GridRulerProps) {
  return (
    <>
      {gridlines.x.map((x) => (
        <RulerLabel key={`x-${x}`} axis="x" coordinate={x} camera={camera} />
      ))}
      {gridlines.y.map((y) => (
        <RulerLabel key={`y-${y}`} axis="y" coordinate={y} camera={camera} />
      ))}
    </>
  )
}
