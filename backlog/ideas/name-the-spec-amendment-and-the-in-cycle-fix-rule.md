---
name: name-the-spec-amendment-and-the-in-cycle-fix-rule
title: Name the spec amendment mechanism and the resolve-in-cycle rule
created: 2026-09-18
kind: enabler-process
---

Recommended by `coach` REVIEW on `split-the-merge-protocol-reasoning-into-its-sidecar`,
2026-09-18, and deferred to its own item by the user the same day. `coach` wrote the exact
text at REVIEW time and measured it clean; that item's spec lifts it rather than drafting
it again. The text lives in Part A-7 of the slice's `spec.md`.

## Situation

The enabler-process pipeline gates a spec on the user's signature, and `writer` edits under
that signature. Nothing says what happens when the spec must change after it is signed.

Two cycles have now improvised it. The `extract-the-merge-protocol` cycle landed seven
`coach` REVIEW rulings as writer instructions. This slice landed a fifteen-item amendment
that the user re-signed. Both worked; neither had a named mechanism to follow.

Separately, a closing review pass routes its findings to the idea board by default. One
`coach` REVIEW produced seven candidates dated 2026-09-17, and four more are dated
2026-09-18 — several for defects the running slice had just authored. Both figures are
counts of `created:` lines in `backlog/ideas/`, taken 2026-09-18, and both move.

## Complication

An unnamed mechanism is improvised per cycle, so its gate is only as reliable as the seat
that remembers to apply it. The authority question is the sharp one: an amendment changes
what the user signed, so it needs the user's signature again, and nothing records that.

The board side compounds it. A candidate filed for a defect the running slice created is
deferred rework, not a backlog item — the worktree is open and the context is loaded when
the finding appears. Without a rule, a reviewing role has no reason to prefer the in-cycle
fix, and the board grows faster than slices retire it.

## Question

Where does each rule live, and what exactly does it say?

## Answer

Shaped, per `coach`'s recommendation. Three files, three registers:

- **`.claude/references/pipelines.md`** — the amendment mechanism, as a subsection under
  the enabler-process section: its trigger, that `coach` authors every amendment and
  `writer` never does, that it is dated and numbered, that it needs the user's
  re-sign-off, and that the cycle re-enters at step 2 scoped to the files the amendment
  names. This is a between-invocation fact, and that file already owns the user gate.

  **Amended by the user 2026-09-18: an amendment is its own file, and `spec.md` is
  immutable once the slice starts.** `coach`'s draft appended each amendment to `spec.md`.
  The signed bytes should stay the signed bytes: with a separate file, `git log --follow`
  on `spec.md` shows only the revisions that preceded sign-off, and a reviewer can diff
  what was signed against what was proposed without untangling appended sections. Ruled
  before the item runs, so the text above changes accordingly.

- **`.claude/agents/coach.md`** — one bullet under Owns, since who may author is a role
  boundary. Without it a `coach` REVIEW invocation has no amendment authority to read.
- **`.claude/agents/articles/handoffs.md`** — the resolve-in-cycle rule as a new section,
  since it binds every reviewing pass rather than one pipeline, and every role reads that
  article unconditionally.

`coach` notes the split is `pipelines.md`'s own: one source for between-invocation facts,
the role file for its own within-invocation facts. Two files cost less than one fact in the
wrong register.

## What round 3 adds: the amendment loop needs a stop

`slice/split-the-merge-protocol-reasoning-into-its-sidecar` ran findings → amendment →
findings → amendment → findings, and stopped only because `coach` had written the stopping
rule down in advance. The three parts that made it stop, and none is in the corpus:

- **A stopping condition** — properties checkable by reading rather than a finding count.
- **A named falsifier** — what observation means the shape is wrong rather than the wording.
- **A pre-decided fallback** — what to do instead, settled before the round runs.

Settling all three **before** the round is what mattered. Deciding after a third round is
when someone has already asked whether the loop terminates, and by then the cheap answer is
one more amendment.

Candidate text, for this item's own spec to settle: a `coach` REVIEW that issues a second
amendment on one slice states a stopping condition, a falsifier and a fallback in that
amendment, and the seat does not run a further round without them.

`coach` ruled this section belongs here rather than with
`claim-discipline-does-not-name-the-self-describing-count`, and the boundary is claim form
against control flow. That article answers what a sentence may claim and how long it stays
true; a stopping rule answers whether a round runs again, has no sentence shape, and binds
the seat. Consolidating it there would charge six audiences for a pipeline procedure none of
them can act on.

## Acceptance

The finished state is a `coach` REVIEW ruling, so the checks bound the work rather than
decide it. Name them anyway, since an enabler owes both readings:

- `npm run prose-lint` over the three edited files — clean, against each file's current
  baseline. **`vale sync` is the precondition.** Without it the run reports zero findings
  through its `grep -c` pipeline exactly as a clean file does, so an unsynced worktree
  turns this check into a confident zero.
- `npm run agent-doc-check` — exit 0. It validates `coach.md`'s frontmatter either way, so
  it bounds the edit rather than confirming it.
- `npm run reference-check` — exit 0, read directly rather than through a pipe, which
  replaces the exit status with the pipe's own.

## No-gos

- No new rule, script, or config. This is prose, so `writer` executes it under a `coach`
  spec.
- The amendment mechanism is not retrofitted to the two cycles that improvised it. They are
  records.

## Open questions

- **What is the amendment file called?** The board's artifact names are bare nouns —
  `proposal.md`, `design.md`, `spec.md`, `tasks.md`, `findings.md` — so a numbered form is
  a new shape for the folder. `amendment-1.md` fits that convention;
  `spec.amendment.1.md` reads as a variant of the spec and sorts beside it. Settle it
  before the first one is written.
- **A numbered artifact name is a worse instance of a known time bomb.**
  `artifact-name-tokens-break-when-done-empties` records that `reference-check` resolves a
  basename only while some instance exists. A numbered series is more brittle still: a doc
  line citing `amendment-2.md` resolves only while some slice has reached a second
  amendment. Decide whether the corpus cites the name at all.
- **Separate files cost a reader the single authority.** With appended sections, the
  current instruction set is one file. With N files, a reviewer must read the spec plus
  every amendment to know what binds, and `coach` REVIEW closes against all of them. Does
  each amendment state which items it supersedes, or does the last one restate the live
  set?
- The board hook applies the idea-file shape to every `backlog/**` write, so a new artifact
  kind adds another misfit until `the-board-hook-misfits-per-item-artifacts` is settled.
- `coach.md`'s `description:` frontmatter is what the seat reads when routing, and it does
  not mention amendments. A seat that has not read the role file would not know to hire
  `coach` for one. Widen it, or leave the read trigger to carry it? `agent-doc-check`
  validates the field either way.
- A bootstrap question this item cannot dodge: it lands the amendment mechanism, so its own
  spec cannot be amended under a rule that does not exist yet. Does the item run with no
  amendment, or does the mechanism take effect the moment it lands?
- Does the resolve-in-cycle rule need a matching line in the roles that do the filing, or
  does the `handoffs.md` section reach them all?
