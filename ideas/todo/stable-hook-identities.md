---
name: stable-hook-identities
title: Stop hook-returned actions capturing render-varying state, and guard the two that propagate
created: 2026-09-04
---

## Context

`zoom-glide-regressed-the-pan-path` fixed a regression that **every gate in this repo was blind
to** — `test:mutation:full` at 98.71%, `crap4ts` 0 above threshold, 116 green e2e tests — and which
surfaced only because one perf scenario moved 8ms. Three causal explanations were confidently stated
and refuted along the way, one of them written into the code as a prediction. The eventual guard was
three assertions that would have failed the instant the churn was introduced.

The user's observation, which prompted this: `useCamera`'s `zoomInCentered`/`zoomOutCentered` capture
`camera` in their closures, so they break identity on every camera change, and that is a general
hazard rather than a one-off.

**The observation is correct, it is broader than `useCamera`, and — measured below — there is a second
live instance of the exact same defect class in the tree right now.** Arming a pattern and moving the
pointer re-renders **every mounted cell on every pointer move**. Nothing in the suite notices.

This file is `architect`'s DESIGN ruling. Everything below is measured, in this worktree, on
`e4e3230`; the probes were throwaway and are deleted. Every claim is scoped to what its command
covered.

## What was measured

### Probe 1 — identity churn of every function-returning hook

`renderHook` in the `dom` (jsdom) project, React Compiler enabled, comparing returned function
references across three transitions. **Full table, not the interesting rows.**

| Hook / transition                                   | Stable                                                                         | Churned                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| `useCamera` / no-op re-render                       | all 7                                                                          | —                                             |
| `useCamera` / after a pan                           | `panByPixels`, `zoomAtPoint`, `applyWheel`, `centerView`, `panByScrollbarDrag` | **`zoomInCentered`, `zoomOutCentered`**       |
| `useGridFocus` / no-op re-render                    | `moveFocus`, `jumpToEdge`, `setFocus`                                          | —                                             |
| `useGridFocus` / camera changed                     | `setFocus`                                                                     | **`moveFocus`, `jumpToEdge`**                 |
| `useGridFocus` / focus changed                      | `setFocus`                                                                     | **`moveFocus`, `jumpToEdge`**                 |
| `useGridFocus` / unstable `onPan` arg               | `setFocus`                                                                     | **`moveFocus`, `jumpToEdge`**                 |
| `usePatternPlacement` / no-op re-render             | all 5                                                                          | —                                             |
| `usePatternPlacement` / pattern armed               | `openOrCancelLibrary`, `closeLibrary`, `selectPattern`, `previewAt`            | **`stampArmedPattern`**                       |
| `usePatternPlacement` / preview moved               | same four                                                                      | **`stampArmedPattern`**                       |
| `useGridPointerGestures` / same callback values     | `handlers` and all four members                                                | —                                             |
| `useGridPointerGestures` / fresh inline callbacks   | `handlers.onPointerDown` (and the other value-independent members)             | `handlers` (the container object)             |
| `useRafCoalescedPan` / fresh `onPan` identity       | `push`, `flush`                                                                | —                                             |
| `useZoomGlide` / fresh `onCamera` identity          | `zoomBy`, `cancel`                                                             | —                                             |
| `useCellTiles` / sub-tile nudge, non-aligned camera | `range` (by reference)                                                         | the view object (`offsetXPx` genuinely moved) |

**A false finding, recorded because it nearly shipped.** A first run reported `useCellTiles.range` as
churning under a sub-cell nudge. That was a **fixture artifact**: the probe's base camera was exactly
tile-aligned, so a 0.25-cell nudge crossed a tile boundary and the range legitimately rebuilt. Re-run
from a non-aligned camera, `nextTileRange`'s by-reference contract holds. `useCellTiles` has no defect.

### Probe 2 — does churn actually propagate? (the question that decides everything)

Real `<LifeBoard>` tree, `vi.mock('./Cell', { spy: true })`, counting `Cell` render calls across five
`pointermove` events. Fixture mounts exactly one cell (empty store, focus cursor at origin).

| Scenario                                                    | `Cell` render calls                            |
| ----------------------------------------------------------- | ---------------------------------------------- |
| Hover, **no** pattern armed                                 | **0**                                          |
| Hover, pattern **armed**                                    | **5** — one per pointer move, per mounted cell |
| Hover, armed, with `stampArmedPattern` stabilised via a ref | **0**                                          |

The third row is a **counterfactual, not an inference**: causation is established by making the single
suspected cause go away and watching the effect go away. `stampArmedPattern`'s identity churn is the
whole cause. In this fixture the cost is 5 renders; in the real app it is one render per mounted cell
per pointer move for the entire duration of aiming a pattern.

**All 64 tests in `usePatternPlacement.test.ts` + `LifeBoard.test.tsx` + `Grid.test.tsx` pass both with
and without the fix.** That is the finding that matters: nothing in the suite can see this, in either
direction — the same gate-blindness as the regression that prompted the slice.

### Probe 3 — the `cameraRef` fix, de-risked before being written down as "three lines"

Applied a `cameraRef` synced in an effect (`useZoomGlide`'s own precedent for `onCameraRef` /
`prefersReducedMotionRef`) and pointed both centered zooms at `cameraRef.current`:

- `useCamera.test.ts` + `useZoomGlide.test.ts` + `LifeBoard.test.tsx` + `Grid.test.tsx`: **89 passed, 0 failed.**
- Re-probing identity: churned across a pan = **[]** — all 7 actions stable.

### Probe 4 — two claims already written into the codebase, both re-verified

Checked rather than trusted, because both bear on whether a structural rule is possible.

- **`Grid.tsx`'s declaration-form comment is correct.** Moving `activateCell` back to a hoisted
  `function` declaration placed below the `onTap` closure that references it reds exactly
  `Grid.test.tsx`'s "a pan that stays within the current tile range re-renders zero cells" (1 failed /
  44 passed). The claim stands as written.
- **But declaration form alone is not the discriminator.** `useCamera`'s five `commit()`-routed
  writers are hoisted `function` declarations and are identity-stable. The actual discriminator is
  **forward reference** — a declaration referenced from a closure that appears above it — which is
  scope analysis, not a syntax pattern.

## The four rulings

### 1. Not a blanket rule. A scoped contract, with two exemptions that carry their reasons

A blanket "everything a hook returns is identity-stable" is the wrong shape: it is unachievable for
projections (`useCellTiles`'s view object _must_ change when the camera moves) and it would spend real
complexity on churn that provably costs nothing. The contract that fits the data:

> **A hook-returned function must not capture render-varying state it only needs at call time.** Where
> such a function crosses a component boundary as a prop, its identity is asserted by a test.

Applied per hook:

- **Must hold, currently broken — fix in this slice.** `useCamera` (all 7, via `cameraRef`) and
  `usePatternPlacement` (all 5, via `placementRef` for `stampArmedPattern`).
- **Already hold, no work.** `useZoomGlide`, `useRafCoalescedPan` (both are the ref precedent this
  slice copies), `useGridFocus.setFocus`, and `useGridPointerGestures`' four handler members.
- **Deliberately exempt, with the measurement as the reason.** `useGridFocus.moveFocus`/`jumpToEdge`
  churn on camera and focus, but reach only `Grid`'s local `handleKeyDown` and from there the
  `#grid-content` div's `onKeyDown` prop — a DOM property assignment, with **no memoized subtree
  behind it**. Stabilising them costs three synced refs plus a call-time `onScreen` recompute, to buy
  nothing measurable. Revisit only if `moveFocus`/`jumpToEdge` ever become props of a memoized child.
- **Exempt because it is irrelevant, not merely cheap.** `useGridPointerGestures`' `handlers`
  _container object_ churns when any member does. `Grid` spreads it (`{...handlers}`) rather than
  passing it down, so React diffs the four members individually and those are each memoized against
  their own dependencies (measured). There is no consumer for whom the container's identity matters.

**Call-time reads are semantically better here, not merely a memoization trick.** `stampArmedPattern`
reading `placement` when the click happens — rather than when the render happened — is what makes it
impossible to stamp a pattern that `Escape` cancelled in between. Same for the camera a zoom click
zooms from.

### 2. Guarded in two layers. No ast-grep — and the reason is measured, not assumed

**Layer A, propagation guards at the composition root — this is the durable deliverable.** The
per-hook assertions are instances; _this_ layer is what makes the whole defect class visible. It
already has one member (`Grid.test.tsx`'s zero-Cell-renders-across-a-pan test). Add its sibling to
`LifeBoard.test.tsx`: **an armed hover re-renders zero cells.** Probe 2 _is_ that test — it reads 5
today and 0 under the fix, so it is `coder`'s TDD entry point rather than a post-hoc guard.

**Layer B, per-hook identity assertions, only where capture risk exists.** Extend
`useCamera.test.ts`'s existing pan test from 5 actions to 7, and add a `stampArmedPattern`-stable-
across-`previewAt` assertion to `usePatternPlacement.test.ts`. That is two edits, not a new pair per
hook — the ceremony objection is real but does not bite at this scale, because the exemptions above
mean most hooks get nothing.

Both layers use the established idiom: `it.skipIf(underStryker)` plus an **unskipped companion** that
holds regardless of memoization (Stryker's per-expression instrumentation defeats React Compiler, and
an ungated identity assertion reds the _dry run_, before a single mutant executes). `LifeBoard.test.tsx`
already declares `underStryker` and has a companion precedent to copy.

**An `ast-grep` rule is not possible, and this slice tested the tempting proxy rather than repeating
the last slice's assertion.** The obvious rule — "no inline arrow functions in a hook's returned object
literal" — is **exactly backwards on this codebase**: `usePatternPlacement`'s four inline arrows are all
identity-stable, and the one function that churns, `stampArmedPattern`, is a hoisted declaration. The
rule would flag four correct sites and miss the only defect. The real discriminator (probe 4) is
forward reference from a closure, which needs scope resolution ast-grep does not do. Identity is a
property of _compiled output_; tests are the only instrument that can see it.

### 3. The store does not deliver this, and should not be the vehicle

Ruling against the `getCameraState()` framing as the fix for identity, **on this slice's own numbers**:

- A camera store fixes **2 of the 5 churning functions** outright (`zoomInCentered`, `zoomOutCentered`).
- It partially addresses **2 more** (`moveFocus`, `jumpToEdge` also churn on `focus`, which no camera
  store touches) — and those two are the ones ruled exempt anyway.
- It does **nothing at all** for `stampArmedPattern`, which churns on `placement` — and that is the
  **only site with proven Cell-level propagation**, i.e. the only one with a measured cost.

A three-line ref, with two sibling precedents already in `src/hooks/`, delivers everything a store
would deliver for identity, for a fraction of the change. **Do not export `getCameraState` until a
caller exists** — an exported getter with no consumer is API surface with no contract behind it, and
the re-render question the user raises (`Grid`, `GridLines`, `GridRuler`, `HoverIndicator`,
`PatternPreview`, `GridScrollbars`, `RulerLabel` all legitimately re-render on camera change) is
untouched by anything here. Those components re-render because the camera genuinely changed; that is
correct behaviour, and narrowing it is the _other_ candidate's job.

**One risk to state plainly rather than wave through.** A `cameraRef` synced in an effect lags the
render by one effect flush — the same window `prefersReducedMotionRef` already accepts. The place it
could bite is glide _chaining_ (two quick zoom clicks must land two rungs up, and a click's target
chains off the pending glide's target while starting from the displayed cellSize). Probe 3 ran
`useZoomGlide.test.ts` and `useCamera.test.ts` against the applied fix: 89 passed. That is evidence,
not proof — `coder` should re-read `zoomGlide.ts`'s `advanceZoomTarget` header before touching it.

### 4. One slice, this one. The store stays a candidate

Both fixes are the same pattern, roughly six lines, sharing one test idiom; splitting them isolates no
risk and pays the handoff cost twice. `camera-as-a-store-instead-of-a-prop` is **independent, not a
successor** — it is a re-render-narrowing idea whose own file already measures the win as "one clear
winner out of seven," and this slice removes identity stability from its list of motivations rather
than adding to it. That file is being annotated to say so, so the next reader does not re-derive the
user's proposal onto it.

## Rules this slice runs under

Checked against the landed rule set before handing off; `npm run ast-grep` is clean on this tree (exit
0, no findings), and no `src/` rename has invalidated a `files:` glob.

- **`rules/no-manual-memo-ts` / `-tsx` is the one that will bite, and it forbids the obvious fix.**
  The reflex for "make this identity-stable" is `useCallback`, and React Compiler is enabled here, so
  that rule fires on it. **The sanctioned mechanism is a synced ref**, which is why this design names
  `useZoomGlide.ts` and `useRafCoalescedPan.ts` as the precedents rather than describing the fix
  abstractly. Copy their shape.
- **Write the ref in an effect, never during render.** React Compiler forbids reading _or writing_ a
  ref's `.current` during render — `useRafCoalescedPan.ts` carries the comment explaining this, and
  it is the trap that turns this six-line change into a confusing compiler error. Both new refs are
  written in a dependency-array-free `useEffect` (so they never lag a render) and read only from
  inside an event-driven action, which is call time, not render time.
- **`rules/no-logic-in-composition-root`** covers `LifeBoard.tsx`. This slice touches only
  `LifeBoard.test.tsx`; if a fix ever seems to want a conditional in `LifeBoard.tsx`, it is the wrong
  fix.
- **No new rule is authored by this slice.** That is a ruling, not an omission — see the ast-grep
  paragraph under ruling 2, where the tempting structural proxy was tested and found to be exactly
  backwards on this codebase.

## Ordering for `coder` — each step leaves the suite green

1. **Failing test first, composition level.** Add the armed-hover zero-Cell-renders test to
   `LifeBoard.test.tsx` (`skipIf(underStryker)` + unskipped companion asserting that a _stamp click_
   does re-render, which holds with or without memoization). It reds at 5.
2. **Failing test, hook level.** Add the `stampArmedPattern`-stable-across-`previewAt` assertion to
   `usePatternPlacement.test.ts`. Reds.
3. **`placementRef` in `usePatternPlacement`.** Both go green. Suite green.
4. **Failing test, hook level.** Extend `useCamera.test.ts`'s existing pan-identity test from the five
   `commit()`-routed writers to all seven. Reds on the two centered zooms.
5. **`cameraRef` in `useCamera`.** Green. Suite green.

## Comments this slice must rewrite, or it lands self-contradicting

Both are load-bearing prose that this slice makes false. Flagged here because a slice that fixes the
code and leaves these behind is worse than one that does neither.

- **`useCamera.test.ts`'s carve-out** on the five-writer pan test, which currently reads that
  `zoomInCentered`/`zoomOutCentered` are _deliberately_ not asserted stable and that "pinning them as
  stable would be asserting something architect's DESIGN ruling explicitly measured false." This
  ruling supersedes that one; the sentence must go, and say which slice changed it.
- **`LifeBoard.test.tsx`'s header**, which enumerates the behaviours that file exists to recover.
  Step 1 adds a fourth.

## Touches

`src/hooks/useCamera.ts`, `src/hooks/usePatternPlacement.ts`, `src/hooks/useCamera.test.ts`,
`src/hooks/usePatternPlacement.test.ts`, `src/components/LifeBoard.test.tsx`. No new module, no moved
module, no layering crossed.

**No `features/` change.** Render counts are not observable through the UI a user has — an armed hover
looks identical either way — so there is nothing here a Gherkin scenario could state, and nothing for
`product` to respecify. The contract is unchanged; only its cost is.

**No perf run needed.** The guards are jsdom render counts, which is the point: this slice converts a
defect class that previously required a perf harness to detect into one that reds in `npm test`.

## Open questions

- Should the exempt pair (`moveFocus`/`jumpToEdge`) get a **comment** recording why they are exempt,
  so the next reader does not "fix" them? Probably yes, at their declaration site — the exemption is a
  measurement, and an unexplained inconsistency invites someone to remove it.
- Is `LifeBoard.test.tsx` the right home for the armed-hover guard, or does a third composition-level
  guard argue for collecting them somewhere? Two is not yet a pattern; revisit at the third.
- The `underStryker` skip/companion idiom now appears in four files. It is correct in each, but if a
  fifth arrives it is worth asking whether it should be a shared helper rather than a copied comment
  block. Not this slice.
