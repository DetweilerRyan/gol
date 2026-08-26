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
//
// "percent" IS SPELLED OUT DELIBERATELY, and the reason lives nowhere else in
// the tree. Playwright's getByText(string) is substring and case-insensitive
// by default, and three perf/ specs match the zoom badge by bare percent
// string -- zoom.perf.spec.ts's '100%', pan.perf.spec.ts's '40%', and
// tile-boundary.perf.spec.ts's expectedZoomReadout(), which builds `${n}%`.
// A description carrying a literal NN% token resolves each of those to three
// elements (the badge plus both sr-only spans) and throws a strict-mode
// violation in perf/, which sits outside every quality gate and outside
// product's write boundary -- so nothing here would report it. The glyph buys
// nothing anyway: this span is visually hidden, its only consumer is speech,
// and a screen reader utters "percent" either way.
export function visibleProportionText(percent: number): string {
  return `${percent} percent of the grid is in view`
}

// Right-anchored on the literal following the digits, not on string start:
// this text is exposed via aria-describedby, and a screen reader typically
// speaks a control's aria-valuenow-derived announcement immediately before
// its description, so the digits are not reliably the first characters of
// what a caller actually receives.
//
// This regex is a SECOND encoding of the wording above rather than a
// derivation of it (escaping a built string into a pattern would be clever and
// worse to read), so the two can in principle drift. What catches that was
// measured rather than assumed, at the scope of the command: replacing this
// literal's "in view" with "in sight" and leaving everything else alone fails
// 7 of the 105 tests in npm run test:e2e -- the whole grid-scrollbars bdd
// feature -- each reporting visibleProportionPercent's own named parse throw
// rather than a poll timeout. The builder's other end is pinned one layer in,
// by Scrollbar.test.tsx asserting the component's rendered description equals
// visibleProportionText(). No round-trip test is added here: src/test-support/
// is deliberately ungated test infrastructure and no module in it carries one.
const VISIBLE_PROPORTION_PATTERN = /(\d+) percent of the grid is in view/

export function parseVisibleProportionText(text: string): number | null {
  const match = VISIBLE_PROPORTION_PATTERN.exec(text)
  return match ? Number(match[1]) : null
}
