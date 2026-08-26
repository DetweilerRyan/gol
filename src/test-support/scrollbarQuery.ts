// The one place that says how a scrollbar's visible-proportion affordance is
// worded, for every layer that needs to build or parse it: Scrollbar.test.tsx
// in the RTL component layer and features/screenplay/questions.ts in the
// black-box layer. Deliberately imports NOTHING -- plain string constants and
// pure functions only -- see rulerQuery.ts's header for why that matters
// across module graphs.
//
// This is announced as an accessible DESCRIPTION (aria-describedby -> a
// visually-hidden span), not aria-valuetext -- aria-valuetext supersedes
// aria-valuenow per spec, and CDP reports it empty for scrollbar, slider,
// spinbutton and progressbar alike, so a valuetext design would be
// verifiable only by reading the attribute back. aria-describedby is
// additive: aria-valuenow keeps carrying position, and the two coexist.
//
// Scrollbar.tsx keeps a deliberate duplicate of this template -- see its own
// comment -- because rules/no-test-support-in-product-tsx.yml forbids the
// component importing this directory, the same reason GridRuler.tsx
// duplicates rulerGroupLabel() and Cell.tsx duplicates cellLabel().
// Scrollbar.test.tsx pins both copies via visibleProportionText() so they
// can't drift.
export function visibleProportionText(percent: number): string {
  return `${percent} percent of the grid is in view`
}

// Right-anchored on the literal following the digits, not on string start:
// this text is exposed via aria-describedby, and a screen reader typically
// speaks a control's aria-valuenow-derived announcement immediately before
// its description, so the digits are not reliably the first characters of
// what a caller actually receives.
const VISIBLE_PROPORTION_PATTERN = /(\d+) percent of the grid is in view/

export function parseVisibleProportionText(text: string): number | null {
  const match = VISIBLE_PROPORTION_PATTERN.exec(text)
  return match ? Number(match[1]) : null
}
