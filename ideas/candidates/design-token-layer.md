---
name: design-token-layer
title: Give the UI a token layer instead of repeated !important overrides
created: 2026-08-23
---

## Context

The app's styling has drifted into copy-paste, and the numbers say so:

- **36 `!important` escapes** across `src/components/` (35 when this was filed on 2026-08-23; re-measured 2026-09-03). `GridToolbar` imports
  catalyst's `Button` with `plain`, then overrides it nine ways
  (`h-8!`, `rounded!`, `!bg-gray-900`, `!text-white`, …). Fighting a component
  library that hard usually means its tokens don't match what the app wants.
- **Two exact-duplicate class strings**, each used twice — the icon-button and
  text-button variants, copied rather than shared.
- **Two competing button idioms.** `GridToolbar` uses catalyst's `Button`;
  `GenerationHud` hand-rolls a bare `<button>` with
  `rounded bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-200`.
  Same visual intent, unrelated implementations.
- **`src/index.css`'s `@theme` block defines no tokens** beyond `--font-sans`.
  Every colour is a raw utility: `bg-gray-900` ×7, `bg-gray-700` ×4, plus a
  single green accent pair.

`dry4ts` cannot see any of this — it compares TypeScript structure, not
Tailwind class strings, so the duplication is invisible to every current gate.

## Sketch

1. Name the palette in `@theme` (`--color-surface`, `--color-surface-hover`,
   `--color-on-surface`, and the accent pair).
2. Collapse the four button class strings into one component with variants,
   and point `GenerationHud` at it so there is one button idiom.
3. The `!important` escapes should mostly disappear once the tokens exist —
   whether they do is the honest test of whether the token set is right.

## Touches

`src/index.css`, `src/components/GridToolbar.tsx`,
`src/components/GenerationHud.tsx`, `src/components/PatternLibraryModal.tsx`,
and a new button component under `src/components/`.

Crosses the component layer and creates a module, so this is an `architect`
design pass before `coder`, per CLAUDE.md's trigger list.

`src/catalyst/**` is out of scope in both directions: it is vendored Tailwind
Plus code, deliberately outside every gate, and read rather than refactored.

## Open questions

- Does the HUD's sizing change? `features/hud-layout-and-shortcuts.e2e.spec.ts`
  asserts layout. Grid and camera pixel math is unaffected either way — that
  geometry never touches these tokens.
- ~~Nothing in the pipeline owns visual design.~~ **Decided 2026-09-03: it stays
  informal, and the user is the "does this look right" gate.** Gherkin specifies
  behaviour and cannot express "the button looks wrong", so the token set has no
  acceptance contract and **none should be built for it**. Two consequences worth
  stating, because they change how a slice here is run rather than merely noting a
  gap. Do not reach for a screenshot-diff or visual-regression layer to fill it —
  that is the move this ruling forecloses. And a visual slice is **not finished when
  the gates are green**: it needs the user to look at the result, so plan for a
  sign-off step that no role can discharge, the same way `product` SPECIFY stops for
  approval. The behavioural half is unaffected — layout assertions in
  `features/hud-layout-and-shortcuts.e2e.spec.ts` are rendered pixel geometry and
  stay exactly as gated as they are now.
- Prerequisite if the Claude Design sync (claude.ai/design) is ever wanted:
  that would consume this token layer, not replace it.
- **Ordering against [[dark-mode-following-system-appearance]], which is the live
  question.** That candidate needs semantic colour tokens to be sane — without
  them, dark mode means `dark:` variants scattered across components, including
  on `Cell.tsx`, the per-cell hot path `collapse-dead-cell-layer` spent a whole
  slice thinning. So this slice is plausibly a **prerequisite** rather than a
  sibling. The counter-argument is that a token set designed without a second
  theme in view tends to name the wrong things — a token layer's whole value is
  that it has more than one value to hold — which argues for designing the
  tokens _with_ dark mode as the second consumer even if light-only lands first.
  Whichever order, they should not be designed independently.
