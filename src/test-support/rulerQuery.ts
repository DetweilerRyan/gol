// The one place that says how the ruler's two axis groups are named for
// accessibility, for every layer that needs to query it: RTL component
// tests (src/components/) today, and any black-box layer that adopts the
// same affordance later. Deliberately imports NOTHING -- plain string
// constants and pure functions only -- see cellQuery.ts's header for why
// that matters across module graphs.
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

// Scoped to one axis's group -- a bare `[role="group"]` would also match
// unrelated groups elsewhere in the app (e.g. Catalyst fieldsets in the
// pattern-library modal), the same reason cellQuery.ts's cellSelector(x, y)
// is parameterized rather than a single CELL_SELECTOR-shaped constant.
export function rulerGroupSelector(axis: 'x' | 'y'): string {
  return `[role="group"][aria-label="${rulerGroupLabel(axis)}"]`
}
