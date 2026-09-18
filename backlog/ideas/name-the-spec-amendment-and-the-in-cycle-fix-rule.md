---
name: name-the-spec-amendment-and-the-in-cycle-fix-rule
title: Name the spec amendment mechanism and the resolve-in-cycle rule
created: 2026-09-18
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

Separately, a closing review pass routes its findings to the idea board by default. Ten
candidates landed on 2026-09-18 from review passes, several of them for defects the running
slice had just authored.

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
  `writer` never does, that it is dated, numbered and appended to `spec.md`, that it needs
  the user's re-sign-off, and that the cycle re-enters at step 2 scoped to the files the
  amendment names. This is a between-invocation fact, and that file already owns the user
  gate.
- **`.claude/agents/coach.md`** — one bullet under Owns, since who may author is a role
  boundary. Without it a `coach` REVIEW invocation has no amendment authority to read.
- **`.claude/agents/articles/handoffs.md`** — the resolve-in-cycle rule as a new section,
  since it binds every reviewing pass rather than one pipeline, and every role reads that
  article unconditionally.

`coach` notes the split is `pipelines.md`'s own: one source for between-invocation facts,
the role file for its own within-invocation facts. Two files cost less than one fact in the
wrong register.

## No-gos

- No new rule, script, or config. This is prose, so `writer` executes it under a `coach`
  spec.
- The amendment mechanism is not retrofitted to the two cycles that improvised it. They are
  records.

## Open questions

- `coach.md`'s `description:` frontmatter is what the seat reads when routing, and it does
  not mention amendments. A seat that has not read the role file would not know to hire
  `coach` for one. Widen it, or leave the read trigger to carry it? `agent-doc-check`
  validates the field either way.
- A bootstrap question this item cannot dodge: it lands the amendment mechanism, so its own
  spec cannot be amended under a rule that does not exist yet. Does the item run with no
  amendment, or does the mechanism take effect the moment it lands?
- Does the resolve-in-cycle rule need a matching line in the roles that do the filing, or
  does the `handoffs.md` section reach them all?
