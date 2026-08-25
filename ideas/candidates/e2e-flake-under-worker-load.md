---
name: e2e-flake-under-worker-load
title: A shift-wheel zoom test flaked once under full-suite worker load
created: 2026-08-25
---

## Context

`features/mouse-wheel-controls.e2e.spec.ts:29` — _"scrolling with shift held zooms instead of
panning, keeping the cursor point fixed"_ — failed **once** for `product` during T4's VERIFY-side
runs, under a 5-worker full-suite run. It was **3/3 green in isolation** (`--repeat-each=3`), and
a later full 105-test run by `coder` passed clean with that test included. Pre-existing on `main`;
untouched by the slice that noticed it.

**Why this is filed rather than shrugged off.** The programme that adopted `playwright-bdd` names
flake as an explicit stop condition, and the reasoning is specific rather than general fastidiousness:

> A flaky failure under `--retries=0` scores as **`killed`** and silently inflates the only
> mutation signal `features/` has.

That matters for the planned `acceptance-mutation-on-playwright` slice, which spawns one Playwright
run per mutant with `--retries=0` and reads the outcome from the JSON reporter. A flake there is not
a red test someone re-runs — it is a **mutant scored as caught when nothing caught it**, and it
inflates a percentage rather than failing anything.

**The earlier clean measurement does not cover the current suite.** The five-repetition baseline
that cleared this condition ran **59 tests** and was clean five times (21–25s). The suite is now
**105** (59 hand-written + 46 generated), so contention at `fullyParallel: true` with 5 workers is
materially different from what was measured. One sighting at the new size is not a trend, but it is
also not covered by the old evidence.

## Sketch

Reproduce before diagnosing. `--repeat-each` in isolation is the wrong instrument — it passed 3/3
there — because the hypothesis is _contention_, not the test. Run the **whole** suite repeatedly at
the configured worker count and count failures across runs; only then look at the test.

Two candidate mechanisms worth separating, since they have different fixes:

- **A real race in the app** — shift+wheel zoom-at-point holds the world point under the cursor
  fixed, and `useRafCoalescedPan` coalesces within a frame. A dropped or late frame under CPU
  contention could land the assertion a pixel out. This would be a genuine defect, and the
  `src/` kind rather than the test kind.
- **A harness timing assumption** — the step or spec reads a position before the rAF-coalesced
  update has settled. `flush()` exists on `useRafCoalescedPan` for exactly this class of problem.

Deciding between them is the slice. Note the two `.feature` clauses this spec's generated
counterpart covers assert _direction_ only, so a per-pixel race would show up here first.

## Touches

`features/mouse-wheel-controls.e2e.spec.ts`, `features/steps/mouse-wheel-controls.ts`,
`features/e2e-helpers.ts` (`shiftWheel`), possibly `src/hooks/useRafCoalescedPan.ts` and
`src/camera.ts`'s `applyWheelInput` if it turns out to be the first mechanism.

## Open questions

- **Does it reproduce at all?** One sighting may be environmental (this machine was running a
  mutation suite concurrently for part of the evening). Measure before assuming.
- Should `acceptance-mutation-on-playwright` be gated on a clean N-run baseline **at the current
  suite size**, rather than on the 59-test one already recorded? That is the decision this idea
  actually blocks.
- Would `--workers=1` for the per-mutant spawns sidestep it entirely? Each mutant runs one spec
  file, so the contention profile there is not the full suite's — this may be a non-issue for the
  gate even if it is real for developers.
