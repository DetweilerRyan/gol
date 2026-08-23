---
name: design-token-layer
title: Give the UI a token layer instead of repeated !important overrides
created: 2026-08-23
---

## Context

The app's styling has drifted into copy-paste, and the numbers say so:

- **35 `!important` escapes** across `src/components/`. `GridToolbar` imports
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

- Does the HUD's sizing change? `e2e/hud-layout-and-shortcuts.e2e.spec.ts`
  asserts layout. Grid and camera pixel math is unaffected either way — that
  geometry never touches these tokens.
- Nothing in the pipeline owns visual design. Gherkin specifies behaviour and
  cannot express "the button looks wrong", so the token set has no acceptance
  contract. Worth deciding whether that stays informal.
- Prerequisite if the Claude Design sync (claude.ai/design) is ever wanted:
  that would consume this token layer, not replace it.
