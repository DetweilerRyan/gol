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
          in a div rather than a w-* override on the Select's own className:
          that className lands on the same element as the component's own
          `block w-full`, and which of the two wins is a
          stylesheet-generation-order question this app has no control over
          -- a wrapper carrying the width avoids relying on it.

          THE WRAPPER'S WIDTH IS max-content, NOT A FIXED w-*, and that is a
          correctness requirement rather than a preference. A <select> clips
          its selected option's text with `overflow: clip` and NO ellipsis,
          so a box too narrow by a few pixels renders a word cut mid-letter
          with nothing to signal it -- which is exactly what the fixed `w-32`
          here shipped: 128px box, 11px + 35px of padding (the second for the
          chevron), 80px of content box against a `Follow system` that
          measures 88.68px at this font. It rendered `Follow syste`.
          A wider fixed width only moves the cliff: measured in Chromium at
          14px, the same string is 99.11px in a Verdana-class fallback, which
          needs 145.1px and so re-clips at w-36 (144px). max-content is the
          one width that cannot clip by construction -- the browser derives it
          from the widest OPTION's own text metrics, so it tracks the font and
          the option names together. Don't put a fixed width back. */}
      <div className="w-max">
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
