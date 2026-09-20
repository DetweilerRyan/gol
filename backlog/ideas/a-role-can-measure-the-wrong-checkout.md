---
name: a-role-can-measure-the-wrong-checkout
title: Settle which checkout a role measures when the slice runs in a worktree
created: 2026-09-20
---

## Situation

A slice runs in its own worktree, and every role in its cycle is invoked from the session sitting
there. A role's findings are quoted back into an artifact — a spec's Find blocks, a baseline
table, a gate reading — and the seat relays them to the user as facts about the slice.

## Complication

A role may measure the primary checkout instead. `coach` reported on 2026-09-20 that its shell
resolved to the primary checkout while it specified a slice whose worktree already existed, so
several of its baselines and quoted blocks came from there. It caught this itself, verified with
`diff` that every file it had read was byte-identical across the two trees, and corrected the
artifact.

The mechanism is unmeasured. The parent session's own shell held the worktree at the same time,
so a general per-call reset is not what was seen. A subagent's working directory being set from
the session's launch directory rather than the parent's shell is the untested explanation.

Nothing distinguishes the two readings once they are written down. A baseline taken in the wrong
checkout carries no marker, reads as current, and is wrong exactly when the two trees differ —
which is the whole point of a slice.

## Question

What does a role owe about which checkout it measured, and can the invocation make the question
unnecessary rather than answerable?

## Answer

Shaped, not specified. Two directions, and they are not exclusive.

Measure the mechanism first, since the fix follows from it. Establish whether a subagent's
working directory tracks the parent's shell, the session's launch directory, or something else,
and whether an invocation can set it.

Then either make the invocation carry the checkout so a role can verify where it stands, or have
a role state the tree it measured beside every reading it reports. The second is the weaker
remedy and the one that needs no harness knowledge.

## No-gos

- No retrofit of past artifacts. A reading already taken is history and says so by its date.

## Open questions

- Does this reach the story pipeline's roles, whose gates run commands rather than quote files? A
  wrong-checkout `npm test` would still be a green suite over the wrong tree.
- Is the byte-identity check `coach` ran a usable general remedy, or does it only work where the
  slice has not yet edited its targets?
- Does the merge protocol already close this at the point that matters, since it re-verifies on
  the landing tree?
