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

| locator               | step module          | hand-written spec |
| --------------------- | -------------------- | ----------------- |
| `cellLocator`         | `infinite-grid.ts`   | — none            |
| `patternsButton`      | `pattern-library.ts` | — none            |
| `patternLibraryModal` | `pattern-library.ts` | — none            |
| `previewCells`        | `pattern-library.ts` | — none            |

**The right-hand column emptied while this candidate sat on the board, and that inverts the
argument it was filed with.** As written, this table gave every locator a hand-written-spec consumer,
three of them the same spec, and drew the conclusion that _the specs legitimately need a `Locator`_
— they make rendered-geometry claims, which is precisely what a raw locator is for — so that **the
step modules are the ones that arguably should not have them**. The file then warned, correctly,
that `hud-layout-and-shortcuts.e2e.spec.ts` had just shrunk 9 → 5 tests in
`re-audit-hand-written-e2e-residue` and that the consumer set might have moved.

It moved further than that note anticipated. `re-audit-hand-written-e2e-residue` took
`patternsButton`, `patternLibraryModal` and `previewCells` with it — `hud-layout-and-shortcuts.e2e.spec.ts`
now imports `clickGridAt` and `expectCellState` and nothing else — and
`convert-modal-inertness-to-scenarios` deleted `modal-inertness.e2e.spec.ts` outright, taking
`cellLocator`'s. **All four are now published solely for step modules**, which is exactly the
consumer group the original conclusion said should not have them.

Re-measure again before designing rather than trusting this table in its turn; the command is a
grep for each name across `features/steps/*.ts` and `features/*.e2e.spec.ts`, counting no comment
mention as a use.

## Sketch

The obvious shape, and the reason it is not obviously right:

**Publish zero locators from the barrel**, and give each of the four a question/interaction wrapper
that returns what its callers actually need. Step modules then cannot hold a `Locator` at all.

**The argument that stood against it no longer has a referent.** It ran: the hand-written specs
would then need a _second_ route to the same locators, which either reintroduces a direct
`../screenplay/elements` import for that layer — an allowlist change in
`rules/no-domain-imports-in-e2e-specs.yml` — or forces geometry claims through a question layer built
to hide exactly the thing they assert, and that may be worse than the partial curation it fixes.
**No hand-written spec imports any of the four**, so there is no second route to provide and no
allowlist change implied.

That also collapses the **two-consumer** framing this file reached for. The comparison it wanted —
`barrel-mandatory-for-step-modules` found step modules importing from a median of 5 of 7 screenplay
roles against the specs' 4 — does not arise for locators specifically, because for locators there is
only one consumer group left. What remains is a one-consumer question, and a much simpler one:
should the layer that is _mandated_ to name no selector of its own be able to hold a `Locator` at
all?

**This makes the candidate stronger, not weaker, and it is worth being suspicious of that.** An idea
whose only counterargument evaporates deserves a check that the counterargument was not merely
relocated: the geometry claims those specs made did not vanish, they were either restated as
scenarios or deleted as unstatable, and either way the step modules now reach the locators the specs
used to. Confirm that before treating the objection as answered.

## Touches

`features/e2e-helpers.ts`, `features/screenplay/elements.ts` and probably `questions.ts`, and
`features/steps/*.ts` (two modules: `infinite-grid.ts` and `pattern-library.ts`). **No
`features/*.e2e.spec.ts` is touched and `rules/no-domain-imports-in-e2e-specs.yml` needs no
change** — both were consequences of the spec-consumer column that has since emptied.

`.claude/agents/articles/testing-layers.md` describes the barrel and the screenplay layering,
including the 92-exports/80-published curation figures and the withheld-locator list, and would go
stale. (CLAUDE.md itself no longer carries that account — `split-claude-md` moved it to the
article.)

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
