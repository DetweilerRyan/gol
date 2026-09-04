---
name: camera-as-a-store-instead-of-a-prop
title: Consider moving the camera into a store so pan/zoom stops re-rendering every consumer
created: 2026-09-03
---

## Context

Raised as: the camera changes on essentially every frame of the commonest interaction there is —
scrolling and panning — and it reaches its consumers by prop, threaded down from `LifeBoard`. A store
with narrow subscriptions would replace that, the way `liveCellStore.ts` already replaced
prop-drilled live-cell state.

**Measured before filing.** Seven components declare a `camera: Camera` prop: `Grid`, `GridLines`,
`GridScrollbars`, `HoverIndicator`, `GridRuler`, `RulerLabel`, `PatternPreview`. Two paths, both 2–3
levels deep — `LifeBoard` → `Grid` → {`GridLines`, `HoverIndicator`, `PatternPreview`}, and
`LifeBoard` → `renderOverlays` → {`GridRuler` → `RulerLabel`, `GridScrollbars`}.

**The precedent is exact and already in the repo.** `liveCellStore.ts` is a factory (not module state)
exposing `useSyncExternalStore` pairs, with `getBoundsSnapshot()` keeping object identity whenever the
box has not moved — which is precisely what stops the scrollbars re-rendering every tick. `App.tsx`
holds the store as a stable handle and passes it down as an opaque thing rather than as a value.

## Identity stability is NOT a motivation for this — ruled, with numbers

Added by `stable-hook-identities`' DESIGN pass, because this is the wrong file to reach for after
reading about hook-returned functions capturing `camera` in their closures. The proposal that arrives
here naturally — _move the camera into a store so `getCameraState()` can be called inside an action
instead of closed over, which makes the action identity-stable_ — was evaluated and **declined as the
vehicle for that**, on measurement rather than taste:

- A camera store fixes **2 of the 5** hook-returned functions that actually churn
  (`useCamera`'s `zoomInCentered`/`zoomOutCentered`).
- It partially addresses **2 more** (`useGridFocus`'s `moveFocus`/`jumpToEdge` also churn on `focus`,
  which no camera store touches) — and those two were ruled exempt anyway, their churn reaching only a
  DOM `onKeyDown` prop with no memoized subtree behind it.
- It does **nothing** for `usePatternPlacement`'s `stampArmedPattern`, which churns on `placement` —
  and that is the **only** churn site with measured component-level propagation (it re-rendered every
  mounted cell on every pointer move while a pattern was armed).

A synced ref, with two existing precedents in `src/hooks/`, delivers the whole of the identity win for
about six lines. So identity stability is **not** a reason to do this slice, and this slice's case
rests entirely on the re-render-narrowing argument below — which its own analysis scores at one clear
winner out of seven consumers. Read that honestly rather than topping it up with a benefit that
belongs elsewhere.

## Three things that make this narrower than it first looks

Recorded up front because each one shrinks the expected win, and a slice run on the unqualified
premise would be disappointed.

**1 — The genuinely hot leaf is already excluded, deliberately and mechanically.** `Cell.tsx` does not
take a `Camera` at all; it takes a finished CSS `transform` string. `rules/no-camera-in-cell-leaf.yml`
enforces that by concrete path, and its own note says why: _"a `Camera` prop down there re-renders
every mounted cell on every pan tick and defeats the world-anchored tile range."_ So the worst case
this candidate would fix has already been fixed, by a rule rather than by a store.

**2 — React Compiler is enabled, so prop-drilling is not itself the cost.** A camera that changes every
frame invalidates every consumer downstream **whether it arrives as a prop or through a subscription**.
A store wins only where a subscriber can take a _narrower projection that changes less often_ — the
`getBoundsSnapshot` identity trick, not the subscription itself. Moving the camera to a store without
narrowing anything would re-render exactly the same components exactly as often.

**3 — Finer granularity is not automatically better, and this repo has the scar.**
`collapse-dead-cell-layer` **retired** `liveCellStore`'s per-cell subscription channel
(`subscribeCell`/`getCellSnapshot`), because once only live cells mount, the component deciding _which_
cells exist needs the whole set and per-cell precision buys nothing. It accepted a named regression to
do it. Any per-consumer camera channel proposed here should answer that precedent directly.

## Where the win actually is, per consumer

This is the analysis the slice should start from, and it should be **measured rather than reasoned**:

- **`GridRuler` / `RulerLabel` — the real prize.** During a pan, `offsetX`/`offsetY` change every frame
  but the ruler's labels change only every **10 cells** (major gridlines). A projection with identity
  stability would collapse ~200 re-renders into one. This is the same shape as `getBoundsSnapshot`.
- **`GridLines`** — no win. The gridline phase changes every frame by construction.
- **`HoverIndicator`** — no win. It follows the cursor.
- **`PatternPreview`** — no win, and deliberately so: CLAUDE.md records it as "the one place that stays
  camera-exact", recomputing `worldToScreen` per position, affordable because it is bounded by the
  armed pattern's size rather than the viewport.
- **`GridScrollbars`** — no win from the camera side; the thumb moves continuously. It already
  subscribes to bounds separately.
- **`Grid`** — needs the camera regardless, for hit-testing through `getBoundingClientRect()`.

**So the honest expectation is one clear winner out of seven**, plus a maintainability argument about
threading a prop through two paths, which is real but is a different argument and should be made
separately rather than smuggled in behind a performance claim.

## Sketch

**Measure first.** `pan-min-zoom-50k` sits at **50.00ms / 66.70ms** frame p95 (1280 / 1920) against a
16.7ms budget — well outside it, and CLAUDE.md records that as _missed rather than waived_. But
**nothing has established that these seven components are where that time goes**, and the empty-board
pan scenarios sit at ~9ms, which argues the cost scales with mounted cells rather than with camera
consumers. Profile a pan before designing anything; the answer may be that this buys almost nothing.

If it does proceed, the shape is `liveCellStore.ts`'s: a factory returning `useSyncExternalStore`
pairs, published state frozen through a single private `publish()`, and — the load-bearing part —
**snapshot identity preserved whenever the projection has not actually changed**.

## Touches

`src/hooks/useCamera.ts`, a new `src/cameraStore.ts` (framework-free, factory-based — note
`rules/no-module-state-in-domain.yml` permits state a factory hands back per instance, and only sees
the `let`/`var` form, so a `const` registry would slip past it), the seven components above, and
`src/components/LifeBoard.tsx`.

**Interacts with the glide.** `useCamera`'s `commit()` funnel cancels an in-flight zoom glide before
every external write, and `useZoomGlide`'s frames deliberately bypass it by calling `setCamera`
directly. That asymmetry is load-bearing and any store must preserve it — five external writers go
through the funnel, and one cancel site is what stops the sixth being forgotten.

This crosses the framework-free → hook → component layering, adds a module, and touches seven
components, so it trips several design-pass triggers. **Expect `architect` DESIGN before `coder`.**

## Open questions

- ~~**Does this subsume, conflict with, or depend on `zoom-glide-regressed-the-pan-path`?**~~
  **Resolved.** That slice has landed: the cause was `useZoomGlide` returning a fresh controller object
  every render, which `commit()` closed over, which broke every `useCamera` action's identity. It was
  fixed with synced refs, not with a store — so this candidate neither subsumes nor depends on it, and
  the attribution hazard is gone. See `stable-hook-identities` for the follow-on ruling.
- If the ruler is the only real winner, is the right slice **much smaller** — give `GridRuler` a
  memoized projection of the camera it actually depends on, and leave the other six alone? That needs
  no store at all.
- What is the **cost** side? A store means `useSyncExternalStore` in seven places and a subscription
  per consumer; `getSnapshot` runs on every render of every subscriber. `hardener` measured the
  analogous `useReducedMotion` call at 0.54µs, which is negligible — but that was one call site.
- Does the maintainability argument stand on its own if the performance one dissolves? Seven `camera`
  props threaded through two paths is not obviously bad; `Grid`'s `renderOverlays` inversion already
  exists to keep `Grid` from importing its overlays.
