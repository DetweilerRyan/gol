---
name: an-interrupted-gate-leaves-a-cache-that-reads-as-complete
title: Give the Stryker incremental cache provenance, so an aborted run cannot be inherited as a finished one
created: 2026-09-06
---

## Context

Merge-protocol step 5 deletes `reports/stryker-incremental.json` and runs the
gate on `main`, and the step's stated purpose is as much to **rebuild that
cache into a state the next merge can trust** as to verify the tree.

During the `jsdoc-in-scripts` merge, that run died partway — the machine slept
— and left the cache on disk at **3.7 MB, timestamped after the last commit**.
Nothing about it is distinguishable from a complete run. It carries no record
of which mutants it covered, which commit it started from, or whether Stryker
reached the end. The next merge would have reused it silently.

It was only distrusted because the same session had watched it die, and the
remedy was to delete it and force a cold `test:mutation:full` so the provenance
was known. **That is not a mechanism. It is a person remembering.**

**Confirmed at source, and it is deliberate rather than a crash artefact.**
`architect` read `node_modules/@stryker-mutator/core/dist/src/reporters/mutation-test-report-helper.js`
while verifying an unrelated claim in the same slice: the handler registered on
`unexpectedExitHandler` (line 41) writes the incremental report on an
unexpected exit by design, and logs `'Saved a partial incremental report to
"%s" after an unexpected interrupt.'` So the artefact is intentional, is known
by the tool to be partial — and is written to the same path, in the same
format, as a complete one. The tool holds the fact that would resolve this at
the moment it writes the file, and drops it in a log line the next run never
reads.

This is the family `.claude/agents/articles/mutation-testing.md` already
enumerates — the ways a run reports a confident number about nothing — applied
one layer down, to the artifact that makes the _next_ run confident. It is the
same shape as `crap4ts-scores-a-tree-that-no-longer-exists`, which fails the
same way with a coverage file instead of a mutation cache; the difference is
that crap4ts's staleness at least produced a visible FAIL once, whereas an
inherited partial cache fails **open** by construction.

**A second, related hole shares the cause: step 5 has no lock.** Two slices
from other sessions landed on `main` during that same gate. It was **not** a
collision — both rebased onto the tree containing the merge and fast-forwarded,
which is the protocol working exactly as written — but the gate was verifying a
tree that stopped existing while it ran, and finished with no way to know. The
result is the same as the cache case: an artifact and a green report that
describe something other than what is now on disk.

## Sketch

**Cheapest: a provenance sidecar.** Write `reports/stryker-incremental.meta.json`
alongside the cache recording the commit the run started from and whether it
completed; refuse to reuse a cache whose sidecar is missing or marks an
incomplete run. Fails safe — an unrecognised state means a cold run, which is
merely slow.

**Cheaper still, and narrower: make step 5 assert its own tree.** Capture
`git rev-parse HEAD` before the gate and again after, and re-run if it moved.
That closes the no-lock half and says nothing about crashes.

**Honest counter-argument to record in the same breath:** `--force` already
makes a cold run trustworthy, and the protocol already deletes the cache at
step 5. So the real question is not "how do we validate a cache" but **"should
anything ever inherit one without provenance at all?"** — and a defensible
answer is no, in which case the fix is a rule rather than a file, and cheaper
than either sketch above.

## Touches

`CLAUDE.md`'s merge-protocol steps 3 and 5; `.claude/agents/articles/mutation-testing.md`,
which enumerates the ways a run reports a confident number about nothing and is
where this belongs as a fifth; `.claude/agents/hardener.md`'s stage 4 if the
check becomes something the role performs. A sidecar would be a `scripts/`
program, with the CRAP ≤ 6, vitest, `dry4ts` and mutation obligations that
implies — which is a lot of machinery for a two-field JSON file and is the main
argument for the rule-not-a-file version.

Related: `crap4ts-scores-a-tree-that-no-longer-exists` (same failure, one tool
over), `invariant-merge-step5-real-score` (which argues about what step 5
should measure at all).

## Open questions

- **Is the cache worth keeping if it needs a guard?** The mutation-invariant
  exemption's whole value is retaining a warm cache across an invariant merge.
  If provenance turns out to be the only way to trust one, the simpler world is
  always-cold-at-step-5, and the exemption stops carrying a cache forward.
  Measure what a cold run actually costs now before assuming the cache is
  worth defending.
- **Does Stryker already write anything usable?** The cache is its own format
  and may carry a schema version or run marker that answers this for free. Nobody
  has looked; doing so is the first ten minutes of this idea and could end it.
- **Does the no-lock half deserve its own slice?** It is a different failure
  (concurrent landing) with a different remedy (a tip check), joined here only
  because one incident produced both. Splitting may be right.
- **What is the correct behaviour when the tip moved?** Re-running is the
  obvious answer and is unbounded under sustained concurrency — the gate could
  lose a race indefinitely. A bounded retry that then refuses is safer but
  needs a person, which is what the protocol's serial-landing rule was supposed
  to avoid.
