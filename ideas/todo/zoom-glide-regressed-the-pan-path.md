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
