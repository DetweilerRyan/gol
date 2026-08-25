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
`scrollbar-visible-proportion-affordance.md`.

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

## Wording decision

Decided by `product` in SPECIFY on the `ruler-label-axis-affordance` slice. `architect` ruled the **shape** in CONTRACT
mode — one `role="group"` container per axis carrying an accessible name, with the labels inside left exactly as they
are (bare `<span>`s whose `textContent` is `String(coordinate)`), so axis membership is expressed by **ancestry**. The
per-label `aria-label` sketched above under "Sketch" is **refuted**: `role="generic"` prohibits naming
(aria-query 5.3.0 `nameFrom: ['prohibited']`), Chromium computes such a name anyway, and both of this repo's test layers
would find it while Playwright's spec-conformant `getByRole(name)` returns 0 — a contract that goes green everywhere and
rests on a prohibited name. The **column/row vocabulary** from that sketch survives; the per-label shape does not.

This section is the words only. `coder` implements from it and does not re-litigate it.

### The two names, verbatim

- Top strip → **`Column ruler`**
- Left strip → **`Row ruler`**

Sentence case, capital on the first word only. That is this app's house style for every accessible name it already
ships: `Cell 3, 5`, `Zoom in`, `Zoom out`, `Reset view`, `Open pattern library`, `Pattern library`,
`Pattern preview cell 3, 5`, `Horizontal scroll`, `Vertical scroll`. Not `Column Ruler`.

### The mapping, read from the code and not from the letters `x` and `y`

This is the one failure mode that leaves every test green while being confidently wrong, so it is pinned here in prose:

- `cellLabel(x, y)` in `src/test-support/cellQuery.ts` returns `` `Cell ${x}, ${y}` `` — the **first** coordinate is
  `x`.
- `worldToScreen(camera, worldX, worldY)` in `src/camera.ts` takes `worldX` as its **second** parameter.
- `RulerLabel.tsx` with `axis === 'x'` calls `worldToScreen(camera, coordinate, 0)` — so `coordinate` is the **world x**
  — positions with `screen.x` via `translateX`, and pins to `top-0.5`. That is the **horizontal strip along the top**,
  and a world x identifies a **vertical slice of the grid**, i.e. a **column**.
- `axis === 'y'` calls `worldToScreen(camera, 0, coordinate)` — `coordinate` is the **world y** — positions with
  `screen.y` via `translateY`, and pins to `left-0.5`. That is the **vertical strip down the left**, and a world y
  identifies a **horizontal slice**, i.e. a **row**.

So: **top strip = `Column ruler` = the first coordinate of `Cell x, y`. Left strip = `Row ruler` = the second.**

Note the trap the name must not fall into: the top strip is itself a _horizontal_ run of labels, but the numbers in it
are _column_ numbers. **The name describes what the numbers mean, never the shape of the strip.** Naming the top strip
for its own geometry is precisely the inversion that would pass every test.

### Why these words satisfy each constraint

1. **One fixed string per axis, no coordinate and no camera state.** Both strings are literals. The digits stay in the
   `<span>`s, which is where they were already. Nothing is re-announced on pan and no locator becomes camera-dependent.
2. **Domain language, not module vocabulary.** `column`/`row` rather than `x`/`y`. "Ruler" is stakeholder language — a
   strip of measurement marks along an edge, as in any design tool — that `GridRuler.tsx`/`RulerLabel.tsx` are _named
   after_, not the reverse. It is the `live cells` case that `.gherkin-lintrc` already declines to restrict: a word that
   is simultaneously a module's name and the ubiquitous language. Nothing here matches that config's
   `no-restricted-patterns` list (verified against all ten entries).
3. **Preserves the `Cell x, y` mapping**, per the code trace above. Column is the first coordinate, matching the
   `Cell 3, 5` an AT user meets everywhere else.
4. **Does not name the role.** No occurrence of "group" or "grouping"; AT appends that itself. There is no ARIA role
   named "ruler", so the word cannot be double-announced the way `Column ruler group` would be.
5. **Disjoint from the `Cell ` namespace.** Neither begins with `Cell ` (so `CELL_SELECTOR`'s `^=` prefix match cannot
   reach them), and neither can equal a `cellLabel()` output. The harness queries cells with exact-match
   `queryAllByLabelText(cellLabel(x, y))` (`features/harness/board.tsx:218`), which these cannot satisfy. Verified: the
   live app contains **zero** `role="group"` nodes (only `role="presentation"` in vendored catalyst and
   `role="scrollbar"` in `Scrollbar.tsx`), no accessible name starting `Column`/`Row` exists, and `getByLabel(` — whose
   Playwright default is case-insensitive **substring** match, the one query type a new name could make ambiguous —
   appears **nowhere** in `features/` or `src/`.
6. **Speakable, read as a heading.** Two words, announced once on entering the strip: "Column ruler, group — 0, 10,
   20." A heading for a run of digits, not a caption describing them.
7. **Encoded once**, as a new `src/test-support/rulerQuery.ts` — a sibling of `cellQuery.ts`, not an addition to it,
   since that module's header scopes it to cell aliveness. `GridRuler.tsx` keeps a deliberate duplicate of each string,
   pinned by a test, exactly as `Cell.tsx` duplicates `cellLabel()`'s format. That duplication is forced, not sloppy:
   `rules/no-test-support-in-product-tsx.yml` forbids a component importing test-support.

### Rejected, and on what ground

- **`Horizontal ruler` / `Vertical ruler`** — the closest call, and the rejection most at risk of being "fixed"
  backwards later, so it is recorded explicitly. `src/components/Scrollbar.tsx:63` already names its axes
  `axis === 'x' ? 'Horizontal scroll' : 'Vertical scroll'`, so a future consistency pass will notice the mismatch.
  **The mismatch is correct and deliberate.** Scrolling is a _geometric action_ — you genuinely scroll horizontally —
  so geometry is the right vocabulary there and there is no coordinate meaning to preserve. Ruler digits are
  _coordinates_, so their name must say what the numbers mean. `Horizontal ruler` is mapping-neutral: a user hearing
  "Horizontal ruler: 0, 10, 20" learns nothing about whether `10` is the first or second coordinate of `Cell 10, 5`,
  which is exactly what constraint 3 exists to carry. Do not align these two.
- **`Columns` / `Rows`** — reads as _the things themselves_ rather than as labels for them, and is actively misleading
  in a grid context. Fails in scenario prose, which is the tiebreaker the next Gherkin prune will feel: "the column
  ruler shows 10" reads correctly; "the columns show 10" sounds like an assertion about the grid.
- **`Column coordinates` / `Row coordinates`** — defensible, and uses the feature's own unrestricted word. Rejected as
  redundant aloud ("the column coordinates should show the coordinate 10") and as a caption rather than a heading
  (constraint 6). It also loses the strip metaphor, which is the part that tells a non-sighted user _what kind of thing_
  they have entered.
- **`Column labels` / `Row labels`** — "label" is the component's name (`RulerLabel`) and generic UI vocabulary; it
  describes the markup rather than the meaning.
- **`Column ruler, first coordinate`** — would encode the ordinal explicitly. Rejected: constraint 3 demands
  non-inversion, not a tutorial, and the mapping is preserved without it. Fails constraint 6 (caption, not heading) and
  taxes every entry into the group in browse mode. Teaching an AT user that `Cell 3, 5` is column-then-row is a real
  question, but it belongs to the `Cell ` namespace, not to this affordance.
- **`x axis` / `y axis`** — constraint 2. Not literally caught by `no-restricted-patterns` today, but at the same
  altitude as `\b(min|max) ?[xy]\b` and `\boffset ?[xy]\b`, and would drag this into the next prune's scope.
- **`Column ruler group`** — constraint 4; AT announces "group" itself.
- **`x = 10` per label** — already noted above as more literal and worse aloud; also refuted by the per-label shape
  ruling and by constraint 1.

### Vocabulary this establishes

`prune-gherkin-implementation-altitude` (a **separate** slice — see
`ideas/candidates/prune-gherkin-implementation-altitude.md`) should reuse these words when it rewrites
`grid-reference-lines.feature` away from `Given a coordinate of 5`. The intended reading is
`Then the column ruler shows 10` / `Then the row ruler shows -10` — domain altitude, and observable through the
affordance this slice adds. **That rewrite is not this slice**, and `grid-reference-lines.feature` is unchanged here.
