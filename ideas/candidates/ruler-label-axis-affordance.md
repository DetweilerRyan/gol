---
name: ruler-label-axis-affordance
title: Give ruler labels an accessible name that says which axis they belong to
created: 2026-08-24
---

## Context

`src/components/RulerLabel.tsx` renders a bare `<span>` — no role, no `aria-*`,
containing the coordinate digit alone. Which axis a label belongs to lives
**only** in a Tailwind class: `edgeClass = axis === 'x' ? 'top-0.5' : 'left-0.5'`.
At any pan there are two spans reading `0`, and nothing distinguishes the column
from the row.

`architect` ruled this a **genuine accessibility gap** (ruling B of
`slice/acceptance-contract-rulings`), and distinguished it from the precedent
that could have swallowed it. The major-gridline border class was ruled a
legitimate visual contract because every cell's `aria-label` already carries
exact coordinates — an AT user has _more_ information, not less. **Axis fails
that test**: nothing else in the accessible tree carries it.

**The clinching evidence is a test that already exists.**
`features/grid-reference-lines.e2e.spec.ts` buckets labels by
`span[class*="top-0.5"]` — a live class reach-around, with a spec written
_around_ the workaround rather than against an affordance. That is the same shape
as `e2e-helpers.ts`'s old className-grepping `isAlive()`, which
`aria-pressed-cell-state` removed.

The feature's own narrative is "so that I can tell where I am on the infinite
grid at a glance." For a non-sighted user the bare number conveys nothing.

## Sketch

An accessible name carrying the axis — `aria-label={axis === 'x' ? \`Column ${coordinate}\` : \`Row ${coordinate}\`}`or equivalent. The exact wording is a`product` question; the shape is not.

**An `aria-hidden` alternative was considered and rejected in writing** during
the ruling: hiding the labels entrenches the class read and forecloses the two
downstream uses below.

**What it unblocks**, per the same ruling — this is worth more than the one
feature it obviously touches:

- `grid-reference-lines`' surviving scenarios, which is the obvious one.
- **Per-axis pan-direction claims** in `camera-pan-and-zoom` and
  `mouse-wheel-controls`. The ruler label set is the only camera-exact observable
  in the accessibility tree, so a claim like "the camera moved right" routes
  through it.
- Note the refinement: a **symmetric diagonal** pan needs no axis affordance at
  all, because the label _value_ carries the direction. Only per-axis claims need
  this.

## Touches

`src/components/RulerLabel.tsx`, `src/components/RulerLabel.test.tsx`,
`src/components/GridRuler.test.tsx`, and
`features/grid-reference-lines.e2e.spec.ts` — which should stop reaching for the
edge class once the affordance exists, the same way the e2e layer stopped
grepping `bg-gray-900`.

A `coder` slice with `product` SPECIFY for the wording. Sibling to
`scrollbar-thumb-length-affordance.md`.

## Open questions

- **Wording is a product decision.** "Column 10" / "Row 10" reads naturally;
  "x = 10" is more literal and worse aloud. Whatever lands should be checked
  against how the coordinates are spoken elsewhere.
- **A11y-tree cost.** Naming 20+ absolutely-positioned spans adds them all to the
  accessibility tree. The acceptance harness queries cells with
  `getByLabelText`, a deliberate 24×-performance choice over `getByRole` + name,
  so there is no collision today — but a future `getByRole` sweep would see
  them, and a screen-reader user tabbing the page would too.
- Whether the labels want a `role` at all, or whether a name on a `<span>` is the
  right weight. They are decoration that carries information, which is an
  awkward category.
