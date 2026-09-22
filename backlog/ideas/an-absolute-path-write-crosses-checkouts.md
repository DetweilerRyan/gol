---
name: an-absolute-path-write-crosses-checkouts
title: Widen the absolute-path warning from LSP to any write, and state the check
created: 2026-09-22
---

Recommended by `coach` REVIEW on `slice/a-reader-finds-a-sidecar-without-an-inventory`,
2026-09-21, after the second incident of the session. `coach` ruled it agent conduct rather than
that slice's corpus, so it routes here rather than into an amendment.

## Situation

`.claude/agents/articles/workflow.md` warns, under "Worktrees and branches", that a relative path
handed to `LSP` resolves against the session's working directory rather than the worktree, and
that because the same relative path exists in both trees it answers about the wrong copy
silently, with no error.

The hazard it names is real and measured. The warning names one tool.

## Complication

**Both incidents this session were plain writes, not `LSP` reads, and both crossed checkouts in
the opposite direction** — an **absolute** path aimed at the primary checkout from a session
working in a worktree.

**Measured 2026-09-21.** `editor` CLEAN's first edit on that slice landed in
`/Users/ryandetweiler/Documents/projects/gol-claude/.claude/agents/articles/doc-comments.md`
rather than in the worktree's copy. It caught this on its next command and reverted with
`git checkout --`; the seat verified independently that the primary checkout was clean and at its
expected tip. The seat had also mis-edited a relocated config the same day, by a different
mechanism.

**A worktree makes every path ambiguous in a way a single checkout does not.** The same
repo-relative path names a real file in both trees, so an absolute path built from the wrong root
writes successfully, silently, to the wrong tree. Nothing in the tooling refuses it, and the
write reports success.

**The recovery is only cheap while somebody notices.** The reverted edit was caught on the next
command. A misdirected write noticed one pass later lands in another slice's diff, or on `main`,
where the merge protocol assumes `main` is written by nothing but itself.

**`workflow.md` already forbids a role committing to `main`** and already carries the worktree
isolation rules. What it does not carry is a check anyone runs before writing.

## Question

Should the warning cover any absolute-path write rather than `LSP` alone — and what is the check
a role runs before its first write of a pass?

## Answer

Shaped, not specified. Two halves, and the second is the one that changes behaviour.

**Widen the stated hazard** from an `LSP` read to any path-bearing operation, in both directions:
a relative path resolving against the wrong root, and an absolute path built from the wrong root.
The existing measured `LSP` case stays as the worked instance.

**State a check, not a caution.** A warning that says "be careful" has now failed twice in one
session against agents that had read it. The check is cheap and mechanical: before the first
write of a pass, confirm the working directory against the path prefix being written.

## No-gos

- **No new gate.** Nothing mechanical can distinguish an intended cross-checkout write from an
  accident, and a checker that guessed would block legitimate seat work on `main`.
- **Does not touch the `LSP` hazard's own account.** That measurement stands and stays where it
  is; this widens the surface around it.
- **Does not change the worktree layout or the merge protocol.** Both are working as designed —
  the isolation held, and the incident was a path, not a process.

## Open questions

- **Which file carries it?** `workflow.md` holds the existing warning, which argues for keeping
  the pair together. Against that, a check that binds before the first write of any pass is the
  shape CLAUDE.md's branch 3 exception puts in the auto-loaded file, because only that surface is
  guaranteed to be read first — and a read trigger is the weaker guarantee that let the existing
  warning be read and then not applied.
- **Does it reach the orchestrating seat as well as the roles?** Both of this session's incidents
  involved an agent, but the seat mis-edited a relocated file the same day by the same family of
  error. `workflow.md` is read by every role and by the seat.
- **Is once per pass the right granularity?** A role that edits in two trees legitimately, which
  the seat does when it writes the board while a slice runs, would need the check per target
  rather than per pass.
