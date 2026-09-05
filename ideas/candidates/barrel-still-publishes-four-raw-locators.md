---
name: barrel-still-publishes-four-raw-locators
title: Decide whether the e2e barrel should publish any raw Locator factory at all
created: 2026-09-05
---

## Context

Raised while explaining `barrel-mandatory-for-step-modules`' ruling. That slice ruled the barrel
**keeps** its mandate, and the reason it found is a good one: the barrel is a **curated surface, not
indirection**. `features/screenplay/elements.ts` exports **13** raw `Locator` factories — the
functions that know CSS selectors and ARIA queries — and the barrel publishes **4**:

```ts
export { cellLocator, patternsButton, patternLibraryModal, previewCells } from './screenplay/elements.ts'
```

The nine it withholds — `aliveCells`, `appearanceControl`, `APPEARANCE_OPTION_LABEL`,
`focusedCellElement`, `hoverIndicator`, `rovingGridCell`, `rulerGroup`, `scrollbarThumb`, `zoomBadge` —
are what make `features/steps/grid-reference-lines.ts`'s claim _"this module names no selector of its
own"_ structurally true rather than a promise in a comment. **A path allowlist cannot express that**,
since it permits a path and says nothing about names, which is precisely why the mandate was kept.

**The wrinkle this candidate is about: the curation is partial, so the discipline is partial.** Four
raw locators remain reachable from any step module. A step can take a `Locator` and query the DOM
itself rather than going through a question — which is the reach-around shape
`rules/no-ruler-axis-by-paint-class.yml` and `no-aliveness-by-paint-class.yml` exist to prevent one
channel over.

## What the four are actually used for

Measured, and it matters — the two consumer groups differ:

| locator               | step module          | hand-written spec                      |
| --------------------- | -------------------- | -------------------------------------- |
| `cellLocator`         | `infinite-grid.ts`   | `modal-inertness.e2e.spec.ts`          |
| `patternsButton`      | `pattern-library.ts` | `hud-layout-and-shortcuts.e2e.spec.ts` |
| `patternLibraryModal` | `pattern-library.ts` | `hud-layout-and-shortcuts.e2e.spec.ts` |
| `previewCells`        | `pattern-library.ts` | `hud-layout-and-shortcuts.e2e.spec.ts` |

Every one has a **hand-written-spec** consumer, and three of the four are consumed by the _same_
spec. That is the sharpest form of the question: the specs legitimately need a `Locator` — they make
rendered-geometry claims (category 3), which is _precisely_ what a raw locator is for and what a
question deliberately abstracts away. The **step modules** are the ones that arguably should not have
them.

Note `hud-layout-and-shortcuts.e2e.spec.ts` just shrank 9 → 5 tests in
`re-audit-hand-written-e2e-residue`, so re-measure before designing: the consumer set may have moved.

## Sketch

The obvious shape, and the reason it is not obviously right:

**Publish zero locators from the barrel**, and give each of the four a question/interaction wrapper
that returns what its callers actually need. Step modules then cannot hold a `Locator` at all.

Against it: the hand-written specs would then need a _second_ route to the same locators, which
either reintroduces a direct `../screenplay/elements` import for that layer — an allowlist change in
`rules/no-domain-imports-in-e2e-specs.yml` — or forces geometry claims through a question layer built
to hide exactly the thing they assert. **That may be worse than the partial curation it fixes.**

So the honest framing is a **two-consumer** question, and it is the same shape
`barrel-mandatory-for-step-modules` measured and rejected in the opposite direction: it found step
modules import from a median of 5 of 7 screenplay roles against the specs' 4, so the specs are the
_narrower_ consumer. Check whether that asymmetry holds for locators specifically before assuming
the split is clean.

## Touches

`features/e2e-helpers.ts`, `features/screenplay/elements.ts` and probably `questions.ts`,
`features/steps/*.ts` (two modules), `features/*.e2e.spec.ts` (two specs), and possibly
`rules/no-domain-imports-in-e2e-specs.yml` — **`architect` only** for that last one.

CLAUDE.md's testing-structure section describes the barrel and the screenplay layering and would go
stale.

## Open questions

- **Is the partial curation actually a problem, or is it the right line?** Four locators with named,
  audited consumers is not the same as an open door. "Keep it, and record why these four are
  sanctioned" is a legitimate outcome — and would put the reasoning beside the export, which is where
  `barrel-mandatory-for-step-modules` just ruled such reasoning belongs.
- Could an `ast-grep` rule express "a step module may not call a `Locator`-returning function" more
  directly than curation does? Probably not — the return type is not visible at the import site, and
  ast-grep has no type information. Worth confirming rather than assuming, since that is the whole
  reason curation is doing this job.
- Does `barrel-mandatory-for-step-modules`' recorded **invalidating conditions** already cover this?
  One of them is "the barrel stops curating". This is the inverse — the barrel curating _incompletely_
  — and whether that is the same condition or a different one is worth deciding rather than assuming.
