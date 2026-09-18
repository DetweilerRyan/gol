# Rationale: The merge protocol

**Audience:** whoever is changing a step in `merge-protocol.md`. **Read when:** amending,
narrowing, or overturning one — never in order to follow one.

## Placement ruling and its test

**A fact that binds before step 1 stays in CLAUDE.md; a fact that binds inside the
protocol moves.** The serial-landing rule binds before any merge starts — it decides how
many slices the seat runs concurrently — so it stayed. Everything from "Rebase, do not
merge" onward binds only once a merge is underway, so all of it moved.

The precedent is the mutation-invariance allowlist, which once lived in CLAUDE.md,
`mutation-testing.md`, and `hardener.md` at once and drifted apart across the three. A
single procedure restated in more than one file is the failure mode this placement
ruling exists to avoid, and this move keeps the protocol in exactly one place.

## Why each step is shaped as it is

**Step 1 — rebase rather than merge.** This keeps `main` linear, which is what `workflow.md`'s "a
prior role's commit" ordinal reasoning assumes, and keeps each slice's `By <role>.` chain readable
in order.

**Step 2 — the slice's own session resolves its own conflicts.** It has the context the orchestrator
does not.

**Step 3 — why `npm run test:mutation:full` is mandated there.** The rebase brought in another
slice's moved and renamed files, which is exactly the file-level assumption the incremental cache
cannot survive.

**Step 4 — why `--ff-only`.** It is the assertion that step 1 actually happened.

**Step 5 — why the gate runs again on an identical tree.** Step 3 ran against a different Stryker
cache and a different `coverage/`. The step-5 run is what rebuilds `main`'s own caches into a state
the next merge can trust.

**Step 5 — why the incremental cache is deleted rather than reused.** Deleting the cache is the
honest expression of intent. It is not stale; it is describing a tree that no longer exists, which
is the situation `.claude/agents/articles/mutation-testing.md` already names.

**Step 5 — why only one `rm -f` path.** `npm run test:mutation:scripts` passes no `--incremental`
flag, so the `scripts/` side never writes `reports/stryker-incremental-scripts.json` at all — see
`.claude/agents/articles/mutation-testing.md` for the source-level verification of that.

**Step 6 — why the tag marks both.** After the fast-forward in step 4 the slice's tip is `main`'s
tip.

**Step 7 — why `--follow-tags` is written out.** This repo sets `push.followTags = true` locally, so
a plain `git push` already carries the tag. The flag stays written out because `.git/config` is not
tracked, so a fresh clone or a CI checkout will not have the setting.

**Step 8 — where the acceptance-mutation figure comes from.** It comes from `product`'s VERIFY
handoff now rather than from `hardener`'s. `engineering.md` says why it records no literal in the
same breath as recording none: "a literal in this file is wrong the moment the second one lands".

**Step 8 — the runner's two inputs.** `.feature` files and `features/steps/*.ts` became the two
inputs at `acceptance-mutation-on-playwright`. `*.steps.test.*` was the second input before it, and
the runner no longer touches that layer at all.

**Step 9 — why the ancestry assertion is safe.** The `git merge-base --is-ancestor` check asserts
the condition you actually care about, and `-D` cannot do damage because it only runs once that
assertion has passed.

**The perf harness — why no per-slice stage and no perf role.** Render performance is meant to be
held by the architecture — the world-anchored tile keys, the eviction hysteresis — rather than
re-measured on every slice. A per-slice harness stage would quietly recast an architectural
guarantee as a test result. `hardener` already owns exactly the post-merge sequence, and already
knows when to reach for `test:mutation:full`.

## The stage-5 exemption — the argument behind the clause

**Why the exemption exists.** Steps 3 and 5 both mandate `npm run test:mutation:full`, and for some
diffs that is two full runs measuring a quantity that provably did not move. `stryker.config.json`'s
`mutate` list covers only `src/**`, and its `ignorePatterns` keeps `features/` out of the sandbox
entirely. So for a diff confined to the paths `mutation-invariance.config.json` allowlists, neither
a mutant nor a test that could kill one is reachable.

Left unaddressed this is not merely a cost. It is a standing incentive to bundle unrelated features
into one slice, to pay the bill once. That is the opposite of what the serial-landing rule is for.

**Why the predicate is stated over the `src/` run alone.** `stryker.scripts.config.json` carries no
`ignorePatterns` at all. Two `scripts/` tests read `features/*.feature` from the live tree. So a
`features/**`-only diff can change a `scripts/` test's outcome, and therefore a mutant's fate, under
`npm run test:mutation:scripts`.

**Why an allowlist rather than a blocklist.** That direction is the whole design. A blocklist fails
open: a path nobody thought to list silently skips the mutation gate, and a skipped run reads exactly
like a passing one. That is the same dangerous direction as the `ignorePatterns` glob that matches
nothing, already described in `.claude/agents/articles/mutation-testing.md`. An allowlist fails safe.

**Why the list is not restated in the instruction half.** It once lived in CLAUDE.md, in
`mutation-testing.md` and in `hardener.md` at the same time, and the three drifted apart.

**Why this gate's own config is on the absent list.** Without `mutation-invariance.config.json` and
`schemas/**` as absent entries, the first slice to edit the allowlist would be granting itself an
exemption.

**Why a comment-only edit under `src/` cannot move the score.** The 2026-09-09 ruling rests on an
argument rather than an intuition. Stryker's mutators operate on AST nodes: arithmetic, conditionals,
literals. A comment is not one, so a comment-only diff creates no mutant, removes none, and re-fates
none.

**Why the surviving-stage list had to be re-derived.** The old argument died with the `acceptance`
project. That argument was that `npm run test:coverage` ran four projects, the `acceptance` one
mounted `<App />`, and its coverage landed on `src/`. So `crap4ts` genuinely moved on a
`features/`-only diff. `delete-step-test-layer` removed that project. Measured on the landed tree,
`coverage/coverage-final.json` now contains zero `features/` entries, and no vitest project loads
anything in that directory.

That re-derivation does not weaken the exemption. The predicate is an allowlist of paths that cannot
move the mutation score, and that is more clearly true after it, not less. It does mean the honest
claim is narrower than it used to be: the exemption covers one stage of one run, and the stages that
remain are fewer than the sentence it replaced implied.

**Why the predicate is computed once.** Step 4 is a fast-forward, so the tree step 5 gates is
byte-identical to the one step 3 gated. There is no second diff worth taking.

**Why the cache survives a skipped stage 5.** The step-5 entry above says why the `rm -f` exists;
under this predicate that reason does not hold. Deleting the cache would tax the next merge with a
full cold run in exchange for nothing. That answers step 5's own "different cache" justification on
its own terms, rather than waiving it.

**Why the claim is worded "no mutated file and no collected test differs".** `backlog/`, `.claude/`
and `CLAUDE.md` are tracked and are copied into the sandbox; only `/features` is ignored. A reader
might check the stronger "byte-identical tree" claim, find it false, and reason "well, these are in
the sandbox too". That would extend the allowlist by exactly the wrong logic.

**Why `hardener` may refuse an exemption but never grant itself one.** The rule is deliberately
asymmetric, because the two errors differ. Wrongly granting is silent and permanent; wrongly refusing
costs one mutation run. That is the narrower prohibition the safety argument actually justifies. A
role that can excuse itself from its own gate is not a gate, which says nothing about a role that can
decline an excuse.

**Why a skip has to be recorded.** A skipped stage produces no artifact, which is the same property
that makes wrongly granting an exemption dangerous. A written record is not a score, but it makes a
skip distinguishable from a pass, which was the actual gap.

**Why the clause is written as a self-revocation rather than as a caveat.** It then resolves safely
for a careless reader. The skip instruction is the more specific and more recent one, so anything
phrased as an exception to it loses.

**Stage 6 was the example this clause used to give, and the `features/`-only stage list in
`merge-protocol.md` refutes it.** That example rested on the `acceptance` project, whose removal left
`coverage/coverage-final.json` with zero `features/` entries, so `crap4ts` cannot legitimately move
on an allowlist-only diff. The example outlived its premise and was repaired by
`the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`.

## Rejected alternatives

- **A bare pointer with nothing retained.** Rejected: the serial-landing rule binds
  while planning a slice, before any merge starts, so a reader who never opens the
  reference still needs it in CLAUDE.md.
- **Restating the step-3/step-5 `test:mutation:full` mandates in CLAUDE.md.** Rejected,
  on the three-file drift precedent above: a restatement is a second copy nothing
  compares, and it is exactly how the allowlist drifted the first time.
- **Splitting the clause-level reasoning into this sidecar in `extract-the-merge-protocol`
  itself.** Deferred: a move plus a rewrite in one slice cannot be reviewed as a move,
  since a reviewer cannot tell which lines are relocation and which are edit.
- **The middle option: a plain `npm run test:mutation` in place of the skip.** Since the cache is
  retained by design, a plain run would still produce a real score — most of the saving plus the
  missing evidence. Its cost argument got considerably stronger once
  `pin-stryker-seed-to-unblind-the-mutation-gate` removed the `@fast-check/vitest` floor. A warm run
  on an unchanged tree is now 24s, rather than the ~3m45s that paragraph used to record. It is still
  not adopted, for a reason the collapse does not touch and which is specific to step 3. That branch
  was just rebased onto a `main` that moved, so the worktree's cache is stale with respect to
  everything the rebase brought in. That is the protocol's own stated reason for mandating `:full`
  there. The 24s figure is measured for a warm cache on an unchanged tree, and says nothing about
  that case. The argument is much stronger at step 5, where `main`'s own cache differs from the tree
  by exactly the invariant diff. So the middle option is really a step-5 proposal, and it changes
  what the gate measures, so it is a slice of its own.

## Known-stale window

**A write boundary is set by path in the spec, and absent-list membership is not a boundary.**
`extract-the-merge-protocol` left files outside `writer`'s boundary still citing `CLAUDE.md` as the
merge protocol's home. Those files are on the mutation-invariance **absent** list —
`vite.config.ts`, `schemas/**` and `scripts/**` each appear there. Editing any of them would have
re-armed a full mutation run for a prose move. Read that as a cost that argued for the boundary,
never as the boundary itself. Absent-list membership constrains what a diff costs, not who may
write a file.

**One gap in this window is still open, and no item owns it.**
`schemas/mutation-invariance.schema.json` cites `merge-protocol` step 5 "for why that scope is
load-bearing", and that why now sits in this file under "Why the predicate is stated over the
`src/` run alone". Step 5 still asserts the scope is load-bearing, so the citation degrades rather
than breaks: a reader reaches the assertion and this file is one hop further.
