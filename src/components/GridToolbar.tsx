import { Button } from '../catalyst/button'

interface GridToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onPatterns: () => void
}

export default function GridToolbar({ onZoomIn, onZoomOut, onReset, onPatterns }: GridToolbarProps) {
  return (
    <div className="absolute top-2 right-2 flex gap-1">
      <Button
        plain
        type="button"
        aria-label={'Zoom in'}
        onClick={onZoomIn}
        className="h-8! w-8! justify-center rounded! !bg-gray-900 font-medium! !text-white transition-colors hover:!bg-gray-700"
      >
        +
      </Button>
      <Button
        plain
        type="button"
        aria-label={'Zoom out'}
        onClick={onZoomOut}
        className="h-8! w-8! justify-center rounded! !bg-gray-900 font-medium! !text-white transition-colors hover:!bg-gray-700"
      >
        −
      </Button>
      <Button
        plain
        type="button"
        aria-label={'Reset view'}
        onClick={onReset}
        className="h-8! justify-center rounded! !bg-gray-900 px-2! text-sm! font-medium! !text-white transition-colors hover:!bg-gray-700"
      >
        Reset
      </Button>
      <Button
        plain
        type="button"
        aria-label={'Open pattern library'}
        onClick={onPatterns}
        className="h-8! justify-center rounded! !bg-gray-900 px-2! text-sm! font-medium! !text-white transition-colors hover:!bg-gray-700"
      >
        Patterns
      </Button>
    </div>
  )
}
