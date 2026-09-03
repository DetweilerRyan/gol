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

## Sketch

**Measure the cause before changing anything.** The cheapest discriminating experiment: build with
`useReducedMotion` replaced by a constant `false` and re-run `pan-min-zoom-50k` at both viewports.
If the regression vanishes, the allocation is the cause and the fix is a caching strategy that
survives `stubMatchMedia` — `architect`'s two rejected options are the starting point, not the
end of the list. If it does not vanish, the cause is elsewhere in what `useCamera` gained: a
`useZoomGlide` call, a ref, and a `commit()` wrapper on five writers.

Note the harness can now see the mechanism directly where it could not before
`slice/restore-perf-harness`: `reports/perf/latest.json`'s `metricsDeltaPerMoveEvent` carries
`ScriptDuration`, `RecalcStyleDuration`, `LayoutDuration` and the GC-adjacent counters per
scenario. Read those before reasoning about frame p95 — and read `Script + Recalc + Layout` rather
than `TaskDuration`, whose `TaskDuration/wallClock` ratio the report's own header records at
~0.30.

## Touches

Likely `src/hooks/useReducedMotion.ts` and `src/hooks/useCamera.ts`. **`perf/` is
orchestrator-owned** — no role runs `npm run test:perf`, so whoever takes this needs the
measurement handed to them or the loop stays open.

**Expect the mutation and CRAP figures to be unmoved** — this is a per-render allocation question,
not a logic change. If they move, the fix did more than intended.

## Open questions

- **Is ~14% on the heaviest pan scenario worth a slice at all?** `pan-min-zoom-50k` at 66.70ms was
  already far outside the 16.7ms frame budget before this slice (58.45ms), and CLAUDE.md records
  that criterion as _missed rather than waived_ at min zoom. This makes a known-bad case ~14%
  worse; it does not create a new one. A defensible answer is "record it and leave it".
- Does the same cost land on **drag-pan in the app**, or only on the harness's synthetic pace?
  `panPaced` drives moves at a fixed cadence; a real drag is rAF-coalesced against real input.
- If the allocation is the cause, is there a third caching option neither rejected one covers —
  e.g. lazily memoising on first call inside the hook's own module rather than at module scope?
