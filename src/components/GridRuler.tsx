import type { Camera } from '../camera'
import type { MajorGridlines } from '../gridGeometry'
import RulerLabel from './RulerLabel'

interface GridRulerProps {
  gridlines: MajorGridlines
  camera: Camera
}

// Coordinate ruler: one RulerLabel per axis per major gridline, each axis's
// labels wrapped in a role="group" so the accessible tree can tell a column
// number apart from a row number -- both axes otherwise render the same bare
// digit. Not aria-label on RulerLabel itself: its <span> has the implicit
// role "generic", which prohibits naming per the ARIA spec (aria-query's
// prohibitedProps), so per-label naming would rest on a name no conformant
// AT can compute. Group membership by ancestry instead.
//
// 'Column ruler' / 'Row ruler' are a deliberate duplicate of
// src/test-support/rulerQuery.ts's rulerGroupLabel() -- see that file's
// header. rules/no-test-support-in-product-tsx.yml forbids importing it
// here, the same reason Cell.tsx duplicates cellQuery.ts's cellLabel()
// format instead of importing it. GridRuler.test.tsx pins both strings and
// per-axis group membership so the two copies can't drift or get swapped.
//
// The wrapper divs carry no layout-affecting styling: they are position:
// static (the default), so they introduce no new positioning context for
// the absolutely-positioned RulerLabel spans inside them, which continue to
// position relative to the overlay container exactly as before.
//
// Hence the two eslint-disable lines below. oxlint's
// jsx-a11y(prefer-tag-over-role) wants one of address/details/fieldset/
// hgroup/optgroup instead of role="group", and all five are wrong here:
// fieldset groups FORM CONTROLS and ships UA border, padding and
// min-inline-size: min-content, which is exactly the layout impact the
// paragraph above says these wrappers must not have; the other four mean
// contact details, a disclosure widget, a heading cluster and a <select>
// group respectively. Disabled per line rather than per file in
// .oxlintrc.json, so a future third role= in here still gets checked.
//
// The names are 'Column ruler'/'Row ruler' and NOT 'Horizontal ruler'/
// 'Vertical ruler', which would match Scrollbar.tsx's 'Horizontal scroll'/
// 'Vertical scroll'. That mismatch is deliberate -- see CLAUDE.md's
// Conventions section -- and is not a consistency defect to fix.
export default function GridRuler({ gridlines, camera }: GridRulerProps) {
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div role={'group'} aria-label={'Column ruler'}>
        {gridlines.x.map((x) => (
          <RulerLabel key={`x-${x}`} axis="x" coordinate={x} camera={camera} />
        ))}
      </div>
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div role={'group'} aria-label={'Row ruler'}>
        {gridlines.y.map((y) => (
          <RulerLabel key={`y-${y}`} axis="y" coordinate={y} camera={camera} />
        ))}
      </div>
    </>
  )
}
