---
name: hud-panel-occludes-the-row-ruler
title: Stop the generation HUD covering the row ruler's top labels
created: 2026-09-05
---

## Context

Reported by `product` at `dark-mode-following-system-appearance`'s VERIFY pass and confirmed by
`architect` as **pre-existing on `main`**, not a regression of that slice.

`GenerationHud`'s panel sits at the top-left and overlaps the left ruler strip, clipping the row
label `-20` to `-2(`. Present identically in light and dark.

**`architect` verified the pre-existence rather than accepting it**: `git diff main...HEAD` on
`GenerationHud.tsx` and `RulerLabel.tsx` across that slice is **colour-only** — `dark:bg-zinc-800`
and `dark:bg-zinc-800/80 dark:text-zinc-400`, with no positional class moved — and the panel is
opaque in both schemes, so the occlusion is byte-identical to `main`'s.

## Why it survived this long

Nothing can see it. The rulers are asserted through `rulerQuery.ts`'s named `role="group"` and their
label _values_, never their rendered position, so a covered label still reports correctly. The HUD's
own geometry is asserted in `features/hud-layout-and-shortcuts.e2e.spec.ts`, but for the HUD's box,
not for what sits under it. Two correct tests, one uncovered gap between them.

## Sketch

Deliberately thin — the fix is a layout decision and there are at least three, none obviously right:

- **Move the HUD** off the ruler strip entirely (down, or to the right).
- **Inset the ruler's label range** so the first few row labels start below the HUD — but that means
  the ruler lies about which coordinates it covers, which is worse than the occlusion.
- **Make the HUD translucent**, which trades a hidden label for an unreadable one.

Worth checking first whether the same thing happens at the **column** ruler under the toolbar, on the
opposite corner — `architect` noted in passing that in dark mode the appearance select is Catalyst's
translucent `dark:bg-white/5`, so a column-ruler label _ghosts through_ it. Under the default camera
those labels sit at screen x = 640 + 200k (840, 1040, 1240), so the 1040 label was already inside the
control's box before this slice widened it. **That is the same family of defect at the other corner**,
and a fix that addresses only one corner will look arbitrary.

## Touches

`src/components/GenerationHud.tsx` and/or `src/components/GridRuler.tsx` / `RulerLabel.tsx`.
`features/hud-layout-and-shortcuts.e2e.spec.ts` asserts HUD geometry and would need re-checking
against any move.

Likely wants a **hand-written spec** claim rather than a scenario: "no ruler label is covered" is
rendered pixel geometry, which _is_ one of the four residue categories (category 3), unlike colour.
That makes it the rare case where the e2e layer is the honest home.

## Open questions

- **Is it worth fixing at all?** It costs two or three labels at one corner on a ruler whose other
  labels are all legible, and the app is usable. A candidate that closes as "recorded, not worth the
  layout churn" is a legitimate outcome.
- Does the column-ruler ghosting under the toolbar make this a **two-corner** problem that needs one
  coherent answer, or are they independent?
- If the HUD moves, does anything else depend on its position? It is the first thing in the tab order
  after the grid.
