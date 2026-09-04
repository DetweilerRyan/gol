---
name: zoom-glide-regressed-the-pan-path
title: Find why smooth-zoom-transitions cost the pan path ~14% and close it
created: 2026-09-02
---

## Context

Measured by the orchestrator's post-merge perf run on `slice/smooth-zoom-transitions`, against the
baseline taken on `main` at `6be96a5` immediately before the slice began. **A zoom slice regressed
the pan path**, which nothing in the slice was supposed to touch.

Reproducible across three independent runs — this is not noise:

| scenario                          | baseline    | run 1 | run 2 | run 3 |
| --------------------------------- | ----------- | ----- | ----- | ----- |
| `pan-min-zoom-50k` @1920×1080     | **58.45ms** | 66.70 | 66.60 | 66.07 |
| `pan-min-zoom-50k` @1280×900      | **41.80ms** | 50.00 | 50.00 | 49.91 |
| `pan-default-empty` @1280×900     | **8.40ms**  | 9.10  | 9.02  | 9.30  |
| `pan-default-50k-offscreen` @1920 | 8.93ms      | 9.70  | —     | —     |

(Frame Δ p95. The `zoom-toolbar-clamp` slowdown in the same run — 757 → 3004ms wall clock at
1920×1080 — is **expected and correct**: the settle-wait sits inside its measured callback by
design, so it now counts ~12 clicks × 200ms of glide that previously measured a snap. That is the
measurement becoming honest and is **not** what this candidate is about.)

## The leading hypothesis, and the evidence against it

`architect` flagged at REVIEW that `useReducedMotion`'s `getSnapshot` constructs a
`MediaQueryList` **per call**, and `useSyncExternalStore` calls it on every render of `useCamera`.
It deliberately did not fix it — both cache-it alternatives are worse (a module-scope `const`
throws at _import_ under jsdom; a memoised `let` is global state defeating `stubMatchMedia`'s
per-test overrides) — and recorded the reasoning at the site.

`hardener` then bounded the **CPU** half in real Chromium: **0.54 µs/call net**, and corrected the
"once per pointermove" framing — pan is rAF-coalesced through `useRafCoalescedPan`, so it is once
per _frame_, ~0.065 ms/s, about **0.007% of a 16.7ms budget**. It explicitly could **not** bound
**GC pressure** from the allocation under sustained drag, and named the post-merge perf run as the
thing that would.

**But the shape of the regression does not match a fixed per-render cost.** A constant per-frame
allocation would cost roughly the same absolute time in every scenario. Measured, it is **+0.7ms**
on `pan-default-empty` and **+8ms** on `pan-min-zoom-50k` — it scales with the scenario's weight.
That is consistent with GC pressure compounding against a larger heap, and equally consistent with
something else entirely. **Do not start from the allocation as though it were established.**

## RE-MEASURED 2026-09-03 on `main` at `eb00437` — the finding narrows, and my stated reasoning was wrong

A fresh full baseline, taken after both `slice/wheel-zoom-ignores-magnitude-and-pinch` and
`slice/grid-tabbable-when-cursor-off-screen` merged:

| scenario                  | pre-zoom-slice | first re-run | now       |
| ------------------------- | -------------- | ------------ | --------- |
| `pan-default-empty` @1280 | 8.40           | 9.10         | **8.42**  |
| `pan-default-empty` @1920 | 8.72           | 9.70         | **8.60**  |
| `pan-min-zoom-50k` @1280  | 41.80          | 50.00        | **50.00** |
| `pan-min-zoom-50k` @1920  | 58.45          | 66.70        | **66.60** |

**The light-pan movement was noise, and the argument I built on it does not survive.** This file
originally reasoned that the regression "scales with the scenario's weight — +0.7ms light, +8ms
heavy", and used that to argue _against_ the fixed-per-render `useReducedMotion` allocation
hypothesis. The light scenarios are now back at their pre-slice figures, so **there was no +0.7ms to
scale from**. That argument is withdrawn; it does not resurrect the allocation hypothesis either,
since a fixed per-render cost would still have to show up somewhere in the light scenarios.

**What survives is narrower and more stable: `pan-min-zoom-50k` alone, ~+8ms, across four
measurements** (50.00 / 50.00 / 49.91 / 50.00 at 1280). It is the only scenario that moved and stayed
moved.

**And the pre-slice figure it is measured against has n = 1.** 41.80/58.45 is a single sample from one
run; the post figures are four. Before treating ~+8ms as established, the cheapest honest step is to
re-measure the _pre-slice_ tree several times — `git stash`-free, since the baseline commit is
reachable — rather than assuming one sample bounded the noise on the heaviest, most variable
scenario in the harness.

**Separately, the slice this file was named for cost nothing on the wheel path**, which was the other
open question: `zoom-shift-wheel-empty` is 8.50 / 8.40 against 8.51 / 9.16 before. The continuous
magnitude mapping produces many more distinct `cellSize` values and did **not** measurably cost the
reference-identity bail-out.

## CONFIRMED 2026-09-03 — the regression is real, the harness is ruled out, and the code named the suspect in advance

The pre-slice tree was re-measured three times in its own worktree at `6be96a5`, scoped to the one
scenario. **Both trees are tightly clustered and ~8ms apart**, so the original n=1 sample was accurate
and the "it was probably an outlier" hypothesis is dead:

| tree                | 1280×900                      | 1920×1080                     |
| ------------------- | ----------------------------- | ----------------------------- |
| pre-slice `6be96a5` | 42.70 / 41.81 / 41.91         | 58.45 / 58.33 / 60.02         |
| current `main`      | 50.00 / 50.00 / 49.91 / 50.00 | 66.70 / 66.60 / 66.07 / 66.60 |

**~+8ms (≈19%) at 1280 and ~+7.5ms (≈13%) at 1920.** `pan-min-zoom-50k` is the only scenario that
moved and stayed moved; every light pan is back at its pre-slice figure.

**The instrument was checked before the code, and it is not the cause.** `perf/` did change in that
span (`restore-perf-harness`), so three specific worries were each ruled out by inspection: the
node-churn `MutationObserver` was **already present** at `6be96a5`; `perf/gestures.ts`'s diff is purely
additive (`waitForZoomAtRest` is new, `panPaced` untouched); and `pan.perf.spec.ts`'s only change calls
`waitForZoomAtRest` inside `beforeMeasuring`, which runs **before** the measured region.

**`src/hooks/useReducedMotion.ts` predicted this in its own comment**, and that comment is now the
starting point rather than a hypothesis someone has to reconstruct:

> Constructs a MediaQueryList per call, and useSyncExternalStore calls this on every render of whatever
> composes it — which, through useCamera, means once per camera change … **NOT MEASURED** on the perf
> harness … so if a post-merge run shows the `pan-default-*` or `pan-min-zoom-*` per-move numbers
> moving, **this is the first thing to look at.**

**Two suspects, both introduced by `smooth-zoom-transitions`, both new on the pan hot path:**

1. `useReducedMotion`'s `getSnapshot()` allocating a `MediaQueryList` per call. `hardener` bounded the
   **CPU** at 0.54µs and explicitly could not bound **GC pressure**; a cost that compounds with heap
   size fits a regression visible only on the 50k scenario.
2. **`panByPixels` now routes through `commit()`, which calls `glide.cancel()` on every pan frame.**
   Pre-slice it was a bare `setCamera(prev => panCamera(...))`. This is genuinely new per-frame work and
   was not on anyone's list.

**Note what the shape of the evidence rules out.** A _fixed_ per-render cost would show on the light pan
scenarios too, and they are unmoved — so whatever this is, it scales with mounted cells or heap, not
with render count. That points at GC pressure over raw CPU, and it is the one thing `hardener`
said it could not measure.

**Two earlier readings in this file were wrong and are withdrawn**, recorded because both were
confidently stated: the "+0.7ms light / +8ms heavy, therefore it scales with weight" argument (the light
figure was noise), and the expectation that re-measuring would show the pre-slice sample to be an
outlier (it was not — I predicted that explicitly and it was refuted by three runs).

## Both named suspects are ELIMINATED by measurement (2026-09-03)

Three arms, two runs each, in a disposable worktree off `main`, scoped to the one scenario:

| arm                                                                              | 1280×900      | 1920×1080     |
| -------------------------------------------------------------------------------- | ------------- | ------------- |
| control                                                                          | 49.97 / 50.00 | 62.55 / 64.55 |
| **A** — `getSnapshot` returns a constant (no `MediaQueryList` per call)          | 49.82 / 50.00 | 63.66 / 66.70 |
| **B** — `panByPixels` calls `setCamera` directly (no `glide.cancel()` per frame) | 50.00 / 50.00 | 66.60 / 66.70 |

**Neither moved.** 1280 is rock-solid at ~50 in every arm, so **`useReducedMotion`'s allocation is not
the cause** — despite its own comment nominating it — and neither is the per-frame cancel. Use 1280 to
judge this scenario; 1920 varies by ~4ms between runs and cannot resolve an 8ms effect reliably.

**The field is now very narrow.** Diffing `6be96a5..main` restricted to non-comment lines: `cellTiles.ts`
and `cellAnchor.ts` changed **comments only**, and `useCamera.ts`'s entire real diff is the `commit()`
wrapper (arm B, eliminated) plus one new line — `const glide = useZoomGlide(setCamera)`.

**So the remaining hypothesis is the hook call itself**, and there is a concrete mechanism to test rather
than a vague suspicion. `useZoomGlide` carries a `useEffect` with **no dependency array** (it runs after
every render) and returns a freshly-built controller object. If that identity churns per render it flows
through `commit` → `panByPixels` → `Grid`'s props → every mounted cell — which would **scale with mounted
cells rather than render count**, matching the one thing the evidence has consistently said: the light pan
scenarios are unmoved and only the 50k one regressed.

**Arm C attempted this and was INVALID — recorded because the failure mode is the one this repo keeps
paying for.** Replacing `useZoomGlide(setCamera)` with a stable noop broke `zoomBy`, which
`pan-min-zoom-50k` needs _in its setup_ to reach min zoom. Playwright exited **1**, no fresh raw samples
were written, and `npm run perf-report` regenerated the **previous** run's numbers — which came back
byte-identical to control and read exactly like "arm C had no effect". Only `echo "exit=$?"` on its own
line distinguished the two. **A perf arm must not stub anything a scenario's own setup depends on**, and a
perf number must never be read without checking the run that produced it succeeded.

A valid arm C keeps `zoomBy` working and tests identity directly — e.g. memoise the returned controller,
or assert its identity across renders in a unit test, which is cheaper than a perf run and answers the
same question.

## CAUSE FOUND (2026-09-03) — identity churn through `commit()`, measured on both trees

A `renderHook` probe comparing identities across a **no-op re-render**, run on `main` and on the
pre-slice `6be96a5`, with a stable callback mirroring `useCamera`'s real `useZoomGlide(setCamera)`
call shape:

|                                | pre-slice `6be96a5`   | current `main`                |
| ------------------------------ | --------------------- | ----------------------------- |
| `useZoomGlide` controller      | _(did not exist)_     | **new identity every render** |
| `useCamera` actions that churn | **none — all stable** | **all seven**                 |

Post-slice the churned set is `panByPixels`, `zoomAtPoint`, `applyWheel`, `centerView`,
`zoomInCentered`, `zoomOutCentered`, `panByScrollbarDrag`.

**The chain, each link measured rather than inferred:** `useZoomGlide` returns a freshly-built
controller → `commit()` closes over it and churns → every action closes over `commit` (or, for the two
centered-zoom actions, over `glide` directly) → `LifeBoard` passes those into `Grid` → **`Grid`'s props
differ on every render, so React Compiler's memoization bails and every mounted cell re-renders.**

**This explains every observation this file has accumulated**, including the ones that eliminated the
earlier suspects: the cost is per _mounted cell_, not per render, so the light pan scenarios are
unmoved and only `pan-min-zoom-50k` regressed; and neither arm A nor arm B could move it, because
removing the allocation or the per-frame cancel leaves the identity churn untouched.

**The naive fix is wrong, which is why this wants a design pass rather than a one-liner.** Freezing the
controller in a `useRef` on first render captures `prefersReducedMotion` in a stale closure —
`zoomBy` reads it to choose `glideDurationMs`, so a user toggling the OS reduced-motion setting mid-session
would keep the old duration. The hook already solves the same problem for its `onCamera` callback with
an `onCameraRef` updated in an effect, so the shape of a correct fix exists in the file; whether that
generalises, or whether the controller should be assembled differently, is `architect`'s call.

**Two things worth checking as part of any fix.** Whether the `useEffect` with **no dependency array**
(it runs after every render) is load-bearing or can take a dependency list. And whether an identity
regression of this kind should be **guarded by a test** — the probe above is three lines of `renderHook`
and would have failed the moment the churn was introduced, where the perf harness only caught it as an
unexplained 8ms two slices later.

## Sketch

The cause is known, so this is no longer an investigation. **Restore identity stability to what
`useCamera` returns**, so `Grid`'s props stop differing on every render and React Compiler's
memoization holds again.

The constraint that makes it a design question rather than a one-liner: a controller frozen in a
`useRef` on first render captures `prefersReducedMotion` in a **stale closure**, and `zoomBy` reads it
to choose `glideDurationMs`. The hook already solves that exact shape for its `onCamera` callback
(`onCameraRef`, updated in an effect), so a correct pattern exists in the file — whether to generalise
it, restructure how the controller is assembled, or something else, is `architect`'s to rule.

Worth resolving in the same pass: whether `useZoomGlide`'s `useEffect` with **no dependency array**
(it runs after every render) is load-bearing or can take a dependency list.

**Guard it with a test, and put the test where a gate can see it.** The three-line `renderHook`
identity probe that found this would have failed the moment the churn was introduced. Identity
stability is invisible to every current gate — mutation testing, `crap4ts` and the e2e layer all pass
happily while every mounted cell re-renders — so without a test this regresses again silently. A
jsdom test under `src/hooks/` is the right home; **not** a `*.browser.test.ts`, which `vite.config.ts`
excludes from both `crap4ts` and Stryker.

## Verification

**Perf is orchestrator-owned — no role runs `npm run test:perf`.** The acceptance measurement is
`pan-min-zoom-50k` at **1280×900**, which must return from ~50ms toward the pre-slice ~42ms. Use 1280
and not 1920: measured across seven runs, 1280 is stable to ±0.2ms while 1920 varies by ~4ms and
cannot resolve an 8ms effect. Reference figures, all measured:

- pre-slice `6be96a5`: 42.70 / 41.81 / 41.91
- current `main`: 49.97 / 50.00 / 49.91 / 50.00

**A perf arm must not stub anything a scenario's own setup depends on**, and a perf number must never
be read without confirming the run that produced it exited 0 — `pan-min-zoom-50k` reaches min zoom
through the toolbar, so stubbing `zoomBy` makes the scenario fail, `perf-report` then re-renders the
_previous_ run's numbers, and the result reads exactly like a clean null. That happened here.

## Touches

`src/hooks/useZoomGlide.ts`, `src/hooks/useCamera.ts`, and a new identity test under `src/hooks/`.

No contract change and no user-visible behaviour change, so **`product` SPECIFY has nothing to write** —
the shape is `architect` DESIGN → `coder` → `cleaner` → `architect` REVIEW → `hardener`, with `product`
VERIFY at the end confirming nothing moved. The diff will be `src/`-only, so **no mutation-invariant
exemption applies** and stage 4 runs in full.

## Open questions

- **Should the identity guard be broader than this hook?** The same failure — a churning identity in
  one hook poisoning every action a composition root passes down — could recur anywhere. A general test
  over `useCamera`'s returned surface catches it wherever it originates, which is what the probe
  actually did.
- Does `zoomInCentered`/`zoomOutCentered` calling `glide.zoomBy` directly (deliberately bypassing
  `commit()`) survive the fix unchanged? That bypass is load-bearing — `commit()` cancels the glide, so
  routing them through it would cancel the glide they are starting.
- Interaction with [[camera-as-a-store-instead-of-a-prop]]: that candidate proposes moving the camera
  into a store partly on re-render grounds. **This finding changes its arithmetic** — some of the
  re-rendering it would attribute to prop-drilling is this bug, and should be measured again after this
  lands rather than before.

## DESIGN RULING (architect, 2026-09-04) — the fix is ratified, and the stated CAUSE is CORRECTED

Everything below was measured in this worktree with throwaway probes (all reverted; tree clean). Read
this section as superseding "CAUSE FOUND" above wherever the two disagree.

### 1. What the identity churn actually costs — the mounted-cell claim is REFUTED

"CAUSE FOUND" says the churn makes React Compiler's memoization bail so **every mounted cell
re-renders**. Measured at the `LifeBoard` level with `vi.mock('./Cell', { spy: true })` /
`vi.mock('./GridCells', { spy: true })`, 400 mounted cells, a 6-frame paced drag pan (each `raf.advance`
wrapped in `act`, without which every count is wrong — batching hides the renders):

| arm                      | Cell renders per pan frame | GridCells renders | distinct `onPan` identities across 16 Grid renders | `wheel` listener registrations during the pan |
| ------------------------ | -------------------------- | ----------------- | -------------------------------------------------- | --------------------------------------------- |
| control (current `main`) | `[0,400,400,0,400,0]`      | `[0,1,1,0,1,0]`   | **7**                                              | **6**                                         |
| fixed (the change below) | `[0,400,400,0,400,0]`      | `[0,1,1,0,1,0]`   | **1**                                              | **0**                                         |

**Cell and GridCells render counts are byte-identical in both arms.** Those renders are driven by the
tile-range rebuild, not by handler identity: `GridCells`' props are `cells`, `anchorX/Y`, `cellSize`,
`onActivateCell` and `focus`, and none of them is derived from `panByPixels`/`applyWheel`. The
scenario's own numbers say the same thing independently — `perf/pan.perf.spec.ts` pans `400px` per
move, which at `MIN_CELL_SIZE = 8` is 50 cells, far past `EVICT_LAG_TILES`, so `nextTileRange` rebuilds
on **every** move in **both** trees and every mounted cell re-renders in both regardless.

**What does differ, measured: the non-passive `wheel` listener on `#grid-content` is removed and
re-added on every camera commit.** `useWheelInput`'s effect is keyed `[ref, onWheelInput]`, and
`onWheelInput` is `applyWheel` — 6 re-registrations over 6 pan frames in control, 0 after the fix.
`useInitialCentering`'s layout effect (`[size, onFirstMeasure]`) re-runs per render too, but its
`hasCenteredRef` latch makes the body a no-op and it touches no DOM; those two are the only effects
in `src/hooks/` keyed on a churning callback.

**Whether that explains the ~8ms is a HYPOTHESIS this pass cannot test.** jsdom has no compositor.
The plausible browser-side mechanism is that adding/removing a blocking (non-passive) wheel handler
forces Chromium to recompute the wheel/scroll-blocking event-handler region for the layer, whose cost
scales with the subtree — which fits every surviving observation (invisible on the light pan
scenarios, ~8ms on the ~19.3k-button min-zoom one, untouched by arms A and B). **It is not
established.** Acceptance for this slice is therefore identity stability plus its guard; if the
orchestrator's post-`hardener` `pan-min-zoom-50k` @1280 run does not come back toward ~42ms, that is a
**new candidate**, not this slice failing — and the next arm to run is the one nobody has run: keep
`zoomBy` working (so the scenario's own setup survives — see the invalid arm C above) and neutralise
only `useWheelInput`'s re-registration.

### 2. The ratified change — `src/hooks/useZoomGlide.ts`, and the exact text matters

Read `prefersReducedMotion` through a ref updated in the hook's existing post-render effect, exactly as
`onCamera` already is. Declaration order is **load-bearing** (see 3 below):

```ts
const prefersReducedMotion = useReducedMotion()
const onCameraRef = useRef(onCamera)
const prefersReducedMotionRef = useRef(prefersReducedMotion)
useEffect(() => {
  onCameraRef.current = onCamera
  prefersReducedMotionRef.current = prefersReducedMotion
})
```

and `zoomBy` calls `glideDurationMs(prefersReducedMotionRef.current)`. Keep the existing "Read via a
ref, exactly as useRafCoalescedPan.ts reads onPan" comment attached to `onCameraRef`; add one sentence
saying the reduced-motion ref exists so the returned controller closes over nothing that varies per
render, which is what lets React Compiler memoize it.

**No stale closure.** The ref is seeded from the first render's value and reassigned after every
render, so `zoomBy` — only ever called from an event handler, i.e. after a commit — reads the current
preference. `useZoomGlide.test.ts`'s existing **"reads prefers-reduced-motion at click time, not just
at mount"** is the guard for this and passes unchanged (all 143 `dom`-project hook tests, and the full
`npm test` at 898, were run green against the fix).

**Rulings on the two questions the sketch left open.**

- **Keep the effect's missing dependency array.** It must run after every render so neither ref lags,
  which is the reasoning `useRafCoalescedPan.ts`'s own comment already records; a dep list would add
  mutants and buy two skipped assignments.
- **`zoomInCentered`/`zoomOutCentered` survive unchanged, and their `glide.zoomBy` bypass of `commit()`
  is untouched.** Measured: post-fix all seven actions are stable across a no-op re-render, and five
  stay stable across a camera change while those two churn — they capture `camera` (pre-slice they did
  not; they delegated through `zoomAtPoint`'s functional `setCamera`). Deliberately not addressed: they
  reach only `GridToolbar`, through inline arrows in `LifeBoard`'s `renderOverlays`, which is rebuilt on
  every camera change anyway, so nothing observes the difference. Restoring parity would mean a second
  latest-value ref (for `camera`) inside `useCamera`, i.e. more staleness machinery around the delicate
  documented glide-chaining semantics, for zero measured benefit.

### 3. The fault fixture, and why it is written down: a plausible fix that fixes NOTHING passes everything

Placing the ref update in an effect written **above** the `const prefersReducedMotion = useReducedMotion()`
declaration compiles, type-checks, and passes **all 143 hook tests** — and React Compiler then does not
memoize the controller at all, so every identity still churns and the change is inert. Measured
side-by-side against the correctly-ordered form (`CHURN` vs `STABLE`). **Every guard below must be
observed red against the unfixed tree before it is trusted**, and this misordered shape is the second
fault to check them against, because it is the one a reviewer cannot see.

### 4. Where the guard lives, and the constraint that would otherwise break `hardener`

**Every identity/memoization assertion must carry `it.skipIf(underStryker)` plus an unskipped
non-vacuous companion**, following `src/components/Grid.test.tsx`'s "tile pan-stability" pair verbatim
(`const underStryker = '__stryker__' in globalThis`). Stryker's per-expression instrumentation defeats
React Compiler memoization, so an ungated identity assertion reds the **dry run** and
`npm run test:mutation` never starts.

1. **`src/hooks/useZoomGlide.test.ts`** — `skipIf`: the returned controller keeps its identity across a
   re-render. Its non-vacuity companion already exists and needs nothing new: the reduced-motion
   click-time test, which fails if the ref is never updated.
2. **`src/hooks/useCamera.test.ts`** (a new `describe`, not a new file — this file already owns
   `useCamera`'s contract and its five-row cancel table) — `skipIf`: (a) the **whole returned surface**
   keeps identity across a no-op re-render; (b) the five `commit()`-routed writers (`panByPixels`,
   `zoomAtPoint`, `applyWheel`, `centerView`, `panByScrollbarDrag`) keep identity across a pan, which is
   the hot path. Do **not** pin `zoomInCentered`/`zoomOutCentered` as churning — exclude them with a
   comment pointing at 2 above. Unskipped companion: `camera`'s own identity **does** change across that
   same pan, which holds with or without memoization and proves the probe can see a change.
3. **`src/components/LifeBoard.test.tsx`** — `skipIf`: no `wheel` listener is registered during a
   multi-frame drag pan, spying on `addEventListener` at the prototype (it must be in place before
   `render()`, since the mount registration is half of the instrument's own non-vacuity check).
   **Two mechanics here are unverified and are `coder`'s to settle before trusting the guard**: the
   probe that produced the 6-vs-0 figures above used a hand-written prototype assignment, not
   `vi.spyOn`, and `addEventListener` is inherited from `EventTarget.prototype` — so if
   `vi.spyOn(HTMLElement.prototype, …)` does not intercept, spy `EventTarget.prototype` instead. And
   the spy must be restored explicitly: neither `restoreMocks` nor `clearMocks` is set in
   `vite.config.ts` or `src/test-setup.ts` (checked), so nothing restores it for you. Unskipped
   companion off the same spy: at least one `wheel` registration is seen at mount, which proves the
   instrument observes the thing at all. This is the
   only guard that states the **cost** rather than the cause, and it is the one that survives the churn
   arriving later through some other prop. If the spy proves to leak across tests, the two hook-level
   guards are the required minimum and this one may be dropped — say so in the handoff if it is.

**No ast-grep rule.** Identity stability is a runtime property of compiled output; ast-grep matches
syntax within one file and cannot see whether a captured value varies per render. The nearest
syntactic proxy ("a hook returning an object literal must not close over a non-ref local") would fire
on correct code all over this repo. The guard is the test.

**Do not touch `useWheelInput.ts` this slice.** A consumer-side ref there would also stop the
re-registration, and landing both changes at once destroys the perf run's ability to test which one
mattered.

### 5. Ordering — each commit leaves the suite green

**Every guard is red-checked against TWO arms before it is trusted** — (a) the unfixed tree and (b) the
misordered variant of section 3 — because (b) is the fault a reviewer cannot see and (a) alone does not
catch it.

1. `useZoomGlide.ts` fix (exact text in 2) **plus** guard 1, one commit. Write the test first, watch it
   fail on both arms above, and record those reds in the commit message.
2. Guard 2 in `useCamera.test.ts`. Prove it red by reverting step 1 locally before committing.
3. Guard 3 in `LifeBoard.test.tsx`, same red-first discipline.
4. Correct `src/hooks/useReducedMotion.ts`'s `getSnapshot` comment: it nominates itself as "the first
   thing to look at" if the pan numbers move, and they did and it was **not** the cause — arm A measured
   49.82/50.00 against a 49.97/50.00 control. Record the measurement rather than deleting the note.
5. `git rm ideas/todo/zoom-glide-regressed-the-pan-path.md`.

**Changed-files manifest for this slice, as a ruling** — it is wider than the prompt's scope, and the
manifest is what routes findings at adjudication: `src/hooks/useZoomGlide.ts`,
`src/hooks/useZoomGlide.test.ts`, `src/hooks/useCamera.test.ts`, `src/components/LifeBoard.test.tsx`
(guard 3), `src/hooks/useReducedMotion.ts` (comment only, step 4), and the deleted idea file.
`src/hooks/useCamera.ts` itself is **not** edited — the fix is entirely in `useZoomGlide.ts`.

`architect`'s REVIEW pass owns the `CLAUDE.md` follow-up: one sentence on the `useZoomGlide.ts` bullet
recording that the controller's identity stability is a contract with a named guard, and that the
perf attribution stayed open.
