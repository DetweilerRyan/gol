import { parseAppearancePreference, type AppearancePreference } from '../appearance'
import { Button } from '../catalyst/button'
import { Select } from '../catalyst/select'

interface GridToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onPatterns: () => void
  appearancePreference: AppearancePreference
  onAppearanceChange: (preference: AppearancePreference) => void
}

// The three options in the order they read most naturally -- what's on
// screen right now (Light/Dark), then the way to hand the decision back.
// Sentence case, no role word, matching every accessible name this app
// ships (see CLAUDE.md's Conventions section) -- and matching
// features/screenplay/elements.ts's APPEARANCE_OPTION_LABEL exactly, since
// that map is what the acceptance layer reads these against.
const APPEARANCE_OPTIONS: { value: AppearancePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow system' },
]

export default function GridToolbar({
  onZoomIn,
  onZoomOut,
  onReset,
  onPatterns,
  appearancePreference,
  onAppearanceChange,
}: GridToolbarProps) {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-1">
      {/* A native <select> (Headless.Select, via src/catalyst/select.tsx) --
          getByRole('combobox') resolves it directly, and it already carries
          the dark: variants this slice's @custom-variant makes work. Wrapped
          in a fixed-width div rather than a w-* override on the Select's own
          className: that className lands on the same element as the
          component's own `block w-full`, and which of the two wins is a
          stylesheet-generation-order question this app has no control over
          -- a wrapper with an ordinary width avoids relying on it. */}
      <div className="w-32">
        <Select
          aria-label={'Appearance'}
          value={appearancePreference}
          onChange={(e) => onAppearanceChange(parseAppearancePreference(e.target.value))}
          className="h-8! py-0! text-sm!"
        >
          {APPEARANCE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <Button
        type="button"
        aria-label={'Zoom in'}
        onClick={onZoomIn}
        className="h-8! w-8! justify-center rounded! font-medium!"
      >
        +
      </Button>
      <Button
        type="button"
        aria-label={'Zoom out'}
        onClick={onZoomOut}
        className="h-8! w-8! justify-center rounded! font-medium!"
      >
        −
      </Button>
      <Button
        type="button"
        aria-label={'Reset view'}
        onClick={onReset}
        className="h-8! justify-center rounded! px-2! text-sm! font-medium!"
      >
        Reset
      </Button>
      <Button
        type="button"
        aria-label={'Open pattern library'}
        onClick={onPatterns}
        className="h-8! justify-center rounded! px-2! text-sm! font-medium!"
      >
        Patterns
      </Button>
    </div>
  )
}
