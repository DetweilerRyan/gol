---
name: wheel-zoom-discards-its-own-magnitude
title: Make shift+wheel zoom follow the gesture's magnitude instead of its sign
created: 2026-09-02
---

## Context

**This is the half of the user's answer that `smooth-zoom-transitions` did not deliver, and it was
never filed.** Asked how zoom should feel, the user chose _"Both — continuous, and eased where
stepped"_, and then scoped that slice to the **toolbar buttons only**. The toolbar has no gesture
magnitude, so it could only ever be the eased half. The continuous half survived solely as a
sentence in a plan file — which is not the board — and would have been lost.

`applyWheelInput` reads only the **sign** of the wheel delta:

```ts
const zoomDelta = input.deltaY !== 0 ? input.deltaY : input.deltaX
const factor = zoomDelta < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
```

So a hard flick and the smallest nudge the hardware can report produce an identical ×1.25 jump.
The magnitude the user's hand supplied is discarded at the first line that reads it.

**This is not what `smooth-zoom-transitions` ruled against, and the distinction is the whole
candidate.** CLAUDE.md now records that only the toolbar route glides, because "animating a
continuous gesture fights the user's own input" — an argument against putting a **time-based
glide** on the wheel, and a correct one. Following the delta's magnitude is the opposite thing: it
needs **no animation at all**, no rAF, no duration, and nothing from `zoomGlide.ts`. It stays
instantaneous per event, exactly as the ruling requires; the events simply stop being rounded to a
constant. Do not let that ruling be read as having settled this.

**A second, separate gap found while checking the first.** `WheelInput` carries no `ctrlKey`, and
nothing in `src/` mentions it. Browsers deliver a **trackpad pinch** as a `wheel` event with
`ctrlKey: true` — so on this app a pinch currently falls through to the pan branch and scrolls the
board instead of zooming it. That is arguably a plain defect rather than an enhancement, and it is
the other thing the user meant by "continuous". It may deserve splitting out.

## Sketch

Replace the sign test with a magnitude-derived factor — the conventional form is exponential, so
that composition is additive and direction is symmetric:

```ts
const factor = Math.exp(-zoomDelta / WHEEL_ZOOM_DIVISOR)
```

`Math.exp(-d/k)` gives `factor > 1` for `d < 0` (scroll up → zoom in), is exactly `1` at `d = 0`,
and satisfies `f(-d) = 1/f(d)`, so a gesture and its reverse compose back to where they started —
the property the current sign form gets for free and that a naive linear mapping loses.

Pick the divisor so a typical notch still lands near today's 1.25 (`k = deltaY_notch / ln 1.25`);
that keeps the existing feel as the midpoint of the new range rather than changing everyone's
zoom speed as a side effect. Note `deltaMode` exists and is not always pixels — a mouse wheel may
report lines rather than pixels — which is a real normalization question, not a detail.

For the pinch half, add `ctrlKey` to `WheelInput` and treat it as a zoom signal alongside
`shiftKey`. `useWheelInput.ts` is the adapter that would carry it.

## Touches

`src/camera.ts` (`applyWheelInput`, `WheelInput`), `src/hooks/useWheelInput.ts`,
`src/camera.property.test.ts` — the round-trip and symmetry properties above are exactly what a
property test should state, and are stronger than anything the sign form could assert.

`features/mouse-wheel-controls.feature` is **silent on magnitude** — its scenarios say "scroll the
wheel up while holding shift", direction only — so the existing contract does not block this. That
silence is itself the `product` question: does the contract want to say something about magnitude
now, and can it do so at domain altitude without naming `deltaY`? `.gherkin-lintrc`'s
`no-restricted-patterns` will have opinions.

## Open questions

- **Should the pinch fix be its own slice?** It is a defect (a gesture that does the wrong thing)
  rather than a refinement, and it is cheap. Bundling it hides it behind a feature.
- Does a magnitude-following wheel zoom make the **perf** picture worse? It generates more distinct
  `cellSize` values, so fewer frames hit the clamp's reference-identity bail-out that
  `zoomCameraAtPoint` relies on to stop React re-rendering. `zoom-shift-wheel-empty` is the
  scenario that would show it, and CLAUDE.md already records the wheel route as "where the
  expensive zoom numbers are".
- Interaction with `zoom-glide-regressed-the-pan-path`: both touch the camera's hot path. Landing
  order matters if that regression turns out to be real per-render cost.
- Trackpads report far smaller, far more frequent deltas than mouse wheels. One divisor for both
  may feel wrong on one of them, and this repo has no way to tell them apart.
