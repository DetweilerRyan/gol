---
name: unstyled-flash-before-react-mounts
title: Apply the appearance before React mounts, so the page never paints unstyled
created: 2026-09-05
---

## Context

Found by `architect` at `dark-mode-following-system-appearance`'s REVIEW pass, which separated two
windows where the wrong appearance can paint and **deliberately fixed only one**:

- **(b) post-mount, pre-effect** — introduced by that slice, since `useAppearance` applied `.dark` in a
  `useEffect` which runs after first paint. Fixed there with `useLayoutEffect`, on
  `useInitialCentering.ts`'s own _"so no frame paints uncentered"_ precedent.
- **(a) pre-mount** — **this candidate.** `index.html` carries no appearance class and no background
  colour, so the page is unstyled from first byte until React mounts at all. No `useLayoutEffect` can
  close it: React is not running yet.

**Pre-existing rather than a regression.** The window existed before dark mode; dark mode only made it
_visible_, because before there was one appearance and the unstyled default happened to resemble it.

## Why it is a real slice rather than a one-liner

The conventional fix is a small **inline script in `index.html`** that reads the stored preference and
the system query and sets the class on `documentElement` before the first paint. That is genuinely the
standard solution, and it is also the reason this needs its own slice rather than riding along:

- **It duplicates logic `src/appearance.ts` owns.** `parseAppearancePreference`, `resolveAppearance` and
  `APPEARANCE_STORAGE_KEY` would all be restated in an inline script that cannot import them — a second
  implementation of a rule this repo just spent a slice giving one home. Whether that duplication is
  acceptable, and how the two are kept in step, **is the design question**.
- **`index.html` is outside every gate.** No vitest project loads it, `crap4ts` and Stryker never see it,
  and `dry4ts` compares TypeScript. So a copy of the resolution rule placed there is invisible to the
  tooling that would otherwise catch it drifting from `appearance.ts`.
- **`main.tsx`'s `import.meta.env.MODE` precedent cuts the other way but is worth reading**: CLAUDE.md
  records that check living at the entry module _specifically_ so Rolldown can constant-fold it. The
  reasoning there is about build-time folding, not about pre-mount timing, so it is a precedent for
  "some things legitimately live at the boundary" and not a template for this.

## Sketch

Deliberately thin — the duplication question above is the slice, not the script.

Options worth pricing against each other: an inline script duplicating the resolution; an inline script
that only sets a **background colour** (no class), leaving resolution to React and merely making the gap
invisible rather than correct; or a build step that generates the script from `appearance.ts` so there is
one source. The middle one is the cheapest and may be sufficient — the window is a few hundred
milliseconds and nobody has established that a _wrong_ colour is worse than an unstyled one.

**Measure the window before designing for it.** Nobody has: `architect` read the effect timing off the
code and explicitly did **not** observe a flash in a browser. It may be imperceptible on a warm load and
obvious on a cold one, which changes the answer.

## Touches

`index.html` (outside every gate), possibly `src/appearance.ts` if a shared constant is extracted,
possibly `vite.config.ts` if a build step generates the script.

**No contract change is obvious** — "the page never flashes the wrong appearance" is arguably
user-observable but is a _timing_ claim about paint, which is the shape this repo's residue categories
handle poorly. Worth an `architect` CONTRACT ruling before `product` writes anything.

## Open questions

- **Is it perceptible at all?** Measure first. If it is not, this closes with the measurement recorded and
  that is a good outcome.
- Does the middle option (background colour only, no class) leave a worse artifact than it fixes — a
  correct-coloured background followed by a correctly-themed app is fine, but a _wrong_-coloured one
  followed by a correction is a flash with extra steps.
- Does this generalise beyond appearance? Any preference read from `localStorage` and applied by React has
  the same pre-mount window; today appearance is the only one.
