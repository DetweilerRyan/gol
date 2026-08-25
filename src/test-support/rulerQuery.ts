// The one place that says how the ruler's two axis groups are named for
// accessibility, for every layer that needs to query it: GridRuler.test.tsx
// in the RTL component layer and features/e2e-helpers.ts in the Playwright
// one. Deliberately imports NOTHING -- plain string constants and pure
// functions only -- see cellQuery.ts's header for why that matters across
// module graphs.
//
// ONE EXPORT ON PURPOSE, and no CSS-selector sibling. cellQuery.ts exports a
// cellSelector(x, y) because aria-pressed is an ATTRIBUTE a CSS selector can
// address exactly; an accessible NAME is computed, not stored, so the only
// faithful query for it is the role engine's -- getByRole('group', { name:
// rulerGroupLabel(axis) }). A `[role="group"][aria-label="..."]` string would
// pattern-match one attribute that happens to feed the computation today, and
// would go quietly wrong the moment the name came from aria-labelledby or a
// <legend>. A rulerGroupSelector() shipped in this slice's first draft with no
// caller and was removed in review rather than given a contrived one: this
// directory sits outside crap4ts and Stryker, so a dead export here is
// invisible to every gate.
//
// GridRuler.tsx wraps each axis's RulerLabels in a `role="group"` container
// named by rulerGroupLabel(axis) rather than putting `aria-label` on each
// label: `role="generic"` (the span's implicit role) prohibits naming, so a
// per-label aria-label would rest on a name the ARIA spec forbids computing
// at all. Axis membership is expressed by ancestry into the named group
// instead. GridRuler.tsx keeps a deliberate duplicate of these two strings
// -- see its own comment -- because rules/no-test-support-in-product-tsx.yml
// forbids a component importing this directory.
export function rulerGroupLabel(axis: 'x' | 'y'): string {
  return axis === 'x' ? 'Column ruler' : 'Row ruler'
}
