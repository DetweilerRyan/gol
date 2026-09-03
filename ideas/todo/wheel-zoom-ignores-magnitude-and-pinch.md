---
name: wheel-zoom-ignores-magnitude-and-pinch
title: Make wheel zoom follow its gesture magnitude, and stop hijacking trackpad pinch
created: 2026-09-02
---

## Context

**This is the half of the user's zoom answer that `smooth-zoom-transitions` did not deliver.**
Asked how zoom should feel, the user chose _"Both — continuous, and eased where stepped"_, and
then scoped that slice to the **toolbar buttons only**. The toolbar has no gesture magnitude, so
it could only ever be the eased half. The continuous half survived as one sentence in a plan file
until this candidate; the slice itself filed no idea files at all.

Two gaps, both in the wheel path, both found by reading `applyWheelInput` and `useWheelInput.ts`.
They are stated as peers because they are independent — either could land without the other — and
**whether they are one slice or two is left to `product` and `architect`** (see Slicing below).

### Gap 1 — the wheel's magnitude is discarded at the first line that reads it

```ts
const zoomDelta = input.deltaY !== 0 ? input.deltaY : input.deltaX
const factor = zoomDelta < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
```

Only the **sign** survives. A hard flick and the smallest nudge the hardware can report produce an
identical ×1.25 step. `WheelInput` also drops `deltaMode`, so there is currently no way to tell a
pixel-reporting trackpad from a line-reporting mouse wheel even if a caller wanted to.

**CLAUDE.md's "only the toolbar route glides" ruling does not settle this, and the distinction is
load-bearing.** That ruling argues against putting a **time-based glide** on a continuous gesture,
because an animation fights the user's own input — and it is correct. Following the delta's
magnitude is the opposite kind of change: **no animation, no rAF, no duration, nothing from
`zoomGlide.ts`.** It stays instantaneous per event exactly as that ruling requires; the events
simply stop being rounded to a constant factor. Do not let the ruling be read as having decided
this.

### Gap 2 — a trackpad pinch is intercepted and used to pan

Browsers deliver a trackpad pinch as a `wheel` event with `ctrlKey: true`. `WheelInput` has no
`ctrlKey` field and nothing in `src/` mentions it, so the pinch fails the `shiftKey` test and
**falls through to the pan branch** — a pinch pans the board.

`useWheelInput.ts` calls `e.preventDefault()` **unconditionally** under `{ passive: false }`, so
this is worse than the browser merely doing its own thing: the app actively suppresses the
platform's page-zoom and then does something unrelated with the gesture. The user gets neither
behaviour. That reads as a **defect** rather than an enhancement, and it is cheap.

## Sketch

Deliberately thin — `architect`'s DESIGN pass owns the shape, and the perf question below may
change it.

**Gap 1.** Derive the factor from the magnitude. The conventional form is exponential, because it
makes composition additive and direction symmetric: `Math.exp(-d/k)` is `> 1` for `d < 0`
(scroll up → zoom in), exactly `1` at `d = 0`, and satisfies `f(-d) = 1/f(d)` — so a gesture and
its reverse compose back to where they started, a property the sign form gets for free and a
naive linear mapping loses. Choosing `k = notchDelta / ln 1.25` keeps today's feel as the
midpoint of the new range rather than silently changing everyone's zoom speed. `deltaMode`
normalization is a real question, not a detail.

**Gap 2.** Add `ctrlKey` to `WheelInput` and treat it as a zoom signal alongside `shiftKey`;
`useWheelInput.ts` is the adapter that forwards it. Note the two gaps meet here: a pinch is
inherently a magnitude gesture, so Gap 2 landing **without** Gap 1 means pinch zooms in fixed
×1.25 steps, which will feel worse than the bug on a trackpad. That interaction is an argument
about ordering, not about scope — see below.

## Slicing

**Explicitly `product`'s and `architect`'s call, not pre-decided here.** The inputs:

- They are independently landable and touch the same two files.
- Gap 2 is a defect and Gap 1 is a refinement; bundling a defect behind a feature hides it, which
  is the usual argument for splitting.
- But Gap 2 alone produces a stepped pinch, which the Sketch notes may feel worse than the current
  bug — an argument for either bundling them or landing Gap 1 first.
- `features/mouse-wheel-controls.feature` is **silent on magnitude** (its scenarios say "scroll the
  wheel up while holding shift" — direction only), so the existing contract blocks neither and
  does not force them into one slice.

## Touches

`src/camera.ts` (`applyWheelInput`, `WheelInput`), `src/hooks/useWheelInput.ts`,
`src/camera.property.test.ts`, `features/mouse-wheel-controls.feature`.

The round-trip and symmetry properties above are exactly what a property test should state, and
are stronger than anything the sign form could assert — worth flagging to `architect`, which owns
property-test coverage.

## Open questions

- Does a magnitude-following wheel zoom make **perf** worse? It generates many more distinct
  `cellSize` values, so fewer events hit the reference-identity bail-out `zoomCameraAtPoint`
  relies on to stop React re-rendering at the clamp. `zoom-shift-wheel-empty` is the scenario that
  would show it, and CLAUDE.md already records the wheel route as "where the expensive zoom
  numbers are". **Perf is orchestrator-owned** — no role runs `npm run test:perf`.
- Can the contract say anything about magnitude at domain altitude, or does it inevitably reach
  for `deltaY`? `.gherkin-lintrc`'s `no-restricted-patterns` will have opinions, and that list
  belongs to `architect`.
- Trackpads report far smaller and far more frequent deltas than mouse wheels. One divisor may
  feel wrong on one of them, and `deltaMode` is the only signal available to tell them apart.
- Interaction with `zoom-glide-regressed-the-pan-path`: both touch the camera's hot path, so
  landing order matters if that regression turns out to be real per-render cost.
