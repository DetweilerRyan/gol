# Rationale: `cleaner`

Evidence behind the rules in `.claude/agents/cleaner.md`. No role has a read trigger for this file.
It is read when a rule in that file is being changed, never in order to follow one.

Every rule these measurements produced is stated in the role file and is actionable there without
this one. Nothing here restates a rule.

## A contaminated run reported two mutants as `Timeout` when one was killable

Measured in `equivalence-rulings-live-in-commits-not-at-sites`: `scrollbars.ts:30` carried two mutants, both reported `Timeout`; hand-applied, one **reds two assertions in 924ms** and the other is genuinely equivalent. Neither was killed by anything new, and reading them as killed would have silently dropped a survivor from the audit.

## A covered mutant survived because no test drove the branch that differs

Measured in `stable-hook-identities`: emptying `useCamera.ts`'s `cameraRef` sync effect to `useEffect(() => {})` left the whole unfiltered suite **green at 908** — because no test panned the camera before calling a centered zoom. It was not equivalent. The probe that proved it (pan, then `zoomInCentered`, assert against `zoomCameraAtPoint(pannedCamera, …)`) reds against the mutant, and once folded in, that one case reds **exactly 1 of 909**.

## Running the unfiltered suite costs less than the scan's own fixed overhead

Measured on this tree: `npm test` is **9.05s** for 664 tests, against a scoped Stryker scan whose _fixed overhead alone_ is **16.4s** before a single extra mutant. A slice leaving three survivors pays ~27s on a step that already costs minutes.

## A bound read as unreachable because every fixture line ended the same way

The `gherkin-ast-mutation` case: a scan's end-of-line bound read as dead defensive code because every fixture line happened to end in a `|`, so the pipe always stopped the loop first. The bound was live, the mutant hung forever, and `hardener` had to overturn the argument by measurement.

## This file once claimed `hardener` owned both mutation suites

This line said `hardener` owned both until the `acceptance-mutation-on-playwright` review; `product.md`, `hardener.md` and CLAUDE.md always said otherwise.
