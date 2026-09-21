---
name: merge-step-5-regates-an-identical-tree
title: Cut the merge protocol's integration run on main, and keep the coverage refresh it was carrying
created: 2026-09-21
---

## Situation

The merge protocol's step 5 deletes the Stryker incremental cache and runs the full eight-stage gate
on `main` after the fast-forward. It is mandatory, and the protocol says so in the same breath as
acknowledging the tree is unchanged: step 4 is a fast-forward, so the tree step 5 gates is
byte-identical to the one step 3 gated. Step 3 already runs the mutation stage with `--force`.

The merge protocol's sidecar records the reason. Step 3 ran against a different Stryker cache and a
different `coverage/`, and the step-5 run rebuilds `main`'s own caches into a state the next merge
can trust.

Measured 2026-09-21, on `main` at the tip that landed `one-item-shape-serves-every-lane`:

- `reports` is gitignored and nothing under it is tracked. Both Stryker configs name a fixed
  relative `incrementalFile`, so every checkout holds its own cache. A worktree created that day
  held none at all.
- The mutation stage on the `src/` side took about eleven minutes in the slice worktree.
- Nine of the 144 slice tags point at a commit whose body names `hardener`.

## Complication

Three of the four things the step is credited with do not survive inspection.

The tree is not re-verified, because a fast-forward leaves nothing to verify that step 3 did not.
The next slice does not inherit the rebuilt cache, because a worktree starts with no `reports/`
directory and runs cold whatever `main` holds. The next merge does not read it either, because step
5 begins by deleting it, so each rebuild is discarded unread by the following merge.

The fourth survives and is the one worth keeping. The step refreshes `main`'s own `coverage/`, which
`crap4ts` auto-discovers with no flag. That file is not deleted and is read by any later run in that
checkout, and a stale one is a named hazard in this repo's own tooling article.

**Nobody can say whether the step has ever caught anything, and the record cannot be made to
answer.** A fast-forward leaves a step-3 fix and a step-5 fix byte-identical in history: both are
ordinary commits on `main`, and nothing marks which step produced one. Nine tags of 144 point at a
`hardener` commit, which bounds the step-5 catches above rather than counting them, because a
step-3 fix that step 5 then left alone produces exactly the same shape. Read at the time, most of
those nine describe work scoped to their own slice, which is step 3's signature.

That is the same defect the protocol names elsewhere and fixes there. A skipped stage produces no
artifact, so a written record is what makes a skip distinguishable from a pass. A step-5 pass
produces no artifact either, so a step that catches things and a step that never has look identical
in the record.

## Question

What does the integration run give that the slice gate does not already give on the same tree, and
what has to move before it can be dropped?

## Answer

Shaped, per the user's ruling of 2026-09-21.

- **The integration run comes out of the protocol.** Its stated justification rests on cache state
  rather than on defects found, and the cache half does not hold.
- **The coverage refresh stays, by another route.** Whatever replaces the step has to leave `main`'s
  `coverage/` current, because dropping it silently converts a named hazard into the default.
- **The removal is a corpus change and runs the process pipeline.** `merge-protocol.md` and its
  sidecar are instruction prose.

## No-gos

- **Step 3 is untouched.** The slice gate keeps every stage, keeps `test:mutation:full`, and keeps
  running after the rebase and the `done/` move so the gated tip is the true tip.
- **This is not a case for weakening any stage.** The question is whether a second identical run
  earns its cost, never whether the gate itself should check less.
- **The mutation-invariant exemption is a separate rule** and this idea proposes no change to it.

## Open questions

- **What refreshes `main`'s `coverage/` instead?** A coverage run costs seconds against the
  integration run's tens of minutes, but it needs an owner and a place in the sequence.
- **Does anything else read `main`'s caches?** The sidecar's claim covers Stryker and coverage
  together, and only coverage has been traced. A reader in the primary checkout that nobody has
  named would change the answer.
- **Does the step earn its cost on a merge that is not a fast-forward?** The protocol mandates
  `--ff-only`, so the case cannot arise while that holds — but the two rules are recorded
  independently and a future change to one would strand the other.
- **Should the record be made answerable before the step is cut?** One line per merge saying whether
  the integration run changed anything would settle the question permanently, and costs almost
  nothing. Cutting the step first forecloses ever knowing.
- **What else in the protocol has no recorded outcome?** This step was examined because a run was
  under way and someone asked. No pass has audited the other steps the same way.

## Prior instance

The slice `one-item-shape-serves-every-lane` landed on 2026-09-21 without step 5, on the user's
ruling, recorded in its tag as a risk acceptance rather than a discharged predicate. Stages 1 to 4
had completed on `main` and matched step 3; stages 5 to 8 did not run. That tag names what the
acceptance rests on and what it cost.
