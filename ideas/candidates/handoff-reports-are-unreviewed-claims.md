---
name: handoff-reports-are-unreviewed-claims
title: Give a role's handoff report the same scepticism its code gets
created: 2026-09-06
---

## Context

`orchestrator-prose-has-no-reviewer` names the gap for documentation the
orchestrating session writes. This is its sibling one layer over: **the prose a
role writes describing what it just did.** That report is not decoration — it
becomes the next role's invoking prompt, it is where a measured figure enters
the record, and it is the only account of work the orchestrator did not watch.
Nothing checks it.

Three claims were falsified during the `jsdoc-*` slices, each caught only
because a later role had been told to re-measure rather than relay:

- **`coder` reported the opposite of the truth about a hover mechanism.** It
  said JSDoc above a hook's local function declaration does _not_ reach a
  destructured caller, and recommended a placement rule on that basis.
  `architect` re-measured in eight fresh probe files and found it **does**
  reach — and that the real hazard runs the other way, a _named_ return
  annotation silently blanking docs at every other site. Relayed, that would
  have become a rule in `doc-comments.md` and sent a later slice into an
  unnecessary refactor.
- **`coder` described a partition it had not performed.** It reported
  `src/test-support/scrollbarQuery.ts`'s 32-line opener as splitting across two
  functions; all four concerns stayed on one, and the second function's JSDoc
  came from a different pre-sweep block. `architect` corrected it, in its own
  words, "before it became fact".
- **Sizing was wrong three consecutive times** — 12 files/253 lines against an
  actual 14/950, then 3/67 against 8/222, then 4/66 against 6/211. Not
  carelessness: `architect` measured the cause. The survey predicate ("a block
  directly above an exported declaration") is narrower than the sweep's real
  unit, and only **94 of 217 blocks and 712 of 1838 lines — 39%** — sit above
  an export. Every estimate built on that predicate bills about a third of the
  work.

**The asymmetry is what makes it worth a mechanism.** A false `.feature` step
reds. A false comment does not — that is already
`orchestrator-prose-has-no-reviewer`'s argument. A false _handoff claim_ is
worse than either, because it is consumed by construction: it is pasted into
the next prompt, and the role receiving it has no way to tell a measurement
from a recollection.

## Sketch

The cheapest intervention already worked and costs nothing to adopt: **every
catch above came from an invoking prompt that said re-measure, don't relay.**
So the leading option is a convention rather than a tool — a line in
`handoffs.md` requiring a report to mark each claim as measured or inferred,
and naming the command or probe behind anything measured. `hardener` already
does this unprompted ("I verified it rather than taking it"); the gap is that
nothing asks the others to.

Stronger options, in increasing cost: have the receiving role explicitly
re-derive any figure it is about to act on (which is what happened here, by
accident of prompt-writing); or make the handoff carry a machine-checkable
manifest — file list, counts, gate numbers — that the orchestrator diffs
against `git` before dispatching the next role.

## Touches

`.claude/agents/articles/handoffs.md`, which every role reads unconditionally
and which currently specifies the handoff's _shape_ but not its _evidentiary
standard_. Possibly each role's own "Handoff" section.

Related: `orchestrator-prose-has-no-reviewer` (the same gap for docs),
`measured-figures-should-name-their-tree` (the same disease at figure level —
a number without its tree), `agent-output-verbosity` (which trades against
this: a shorter report has fewer places to hide a claim, and also fewer places
to cite evidence).

## Open questions

- **Is a convention enough, when the failure is confident error rather than
  laziness?** Every falsified claim above was written in good faith by a role
  that believed it. A "mark claims as measured" rule catches the honest
  hedge, not the confident mistake — which is the one that propagates.
- **Who reviews the reviewer?** Pushing verification onto the receiving role
  makes every handoff cost a re-measurement, which is most of the saving of
  having roles at all. The three catches here were cheap only because they were
  targeted; a blanket rule is not.
- **Does this want a rule at all, or is it the orchestrator's job?** The
  orchestrator is the only reader of every handoff and the only one positioned
  to notice a claim contradicting an earlier one. That argues for guidance in
  CLAUDE.md rather than `handoffs.md` — but the orchestrating session is
  exactly the reader `orchestrator-prose-has-no-reviewer` says has no reviewer,
  so that path closes one gap by widening another.
- **Would a manifest have caught any of these three?** The two mechanism claims
  are prose about behaviour, not counts — a file-list manifest catches the
  sizing errors and neither of the falsified rules. Worth deciding whether the
  expensive option addresses the expensive failure.
