---
name: a-role-file-is-silent-about-what-it-writes
title: Put what a role writes, and the shape it owes, in that role's own file
created: 2026-09-19
---

Found by `editor` CLEAN on `the-board-hook-misfits-per-item-artifacts`, 2026-09-19, and
re-framed by the user the same day: it is a register error rather than a missing read
trigger. `coach` ruled it a board candidate rather than an amendment.

## Situation

`.claude/references/pipelines.md` carries an Artifacts column per pipeline step. Row 2 of the
Story and Enabler tables has `architect` DESIGN writing `design.md` and `tasks.md`.

That slice also gave `pipelines.md` a section stating what a per-item artifact owes: no
frontmatter, a heading plus an attribution line.

## Complication

**Measured 2026-09-19: `.claude/agents/architect.md` and both files in
`.claude/agents/architect/` never mention `design.md`, `tasks.md`, `findings.md`,
`pipelines.md` or `ready/` — not once.** A `pipelines.md` read trigger exists in `coach.md`,
`product.md` and `orchestration.md`, and in no `architect` file.

So a role writes two artifacts, and neither the fact nor their shape appears anywhere it
reads. The new section routes the shape to the invoking prompt instead, which makes the
convention depend on the seat remembering a clause.

**`design.md` is the artifact the hook deformed twice**, once while that slice's own spec sat
unsigned.

**The register split already rules this, and it is being broken in one direction only.**
`pipelines.md`'s own header states the split: it is the single source for between-invocation
facts, and a role file is the single source for its own within-invocation facts. That file's
gates column already honours it the other way, citing each role's own file rather than
restating any gate list. What a role writes, and the shape that artifact owes, is a
within-invocation fact sitting on a between-invocation surface.

## Question

Does each role file state what that role writes and what shape it owes — and if not, which
files are silent?

## Answer

Shaped, and the shape is already ruled. **`coach`'s C3 on
`slice/name-the-spec-amendment-and-the-in-cycle-fix-rule` is the precedent**: finding E there
was the same defect, where "`writer` never amends" lived in `pipelines.md` and `coach.md`
while `writer.md` named neither as a trigger. The answer was **not** a pointer. `writer.md`
got a bare prohibition in its own voice, and the reason was recorded: a pointer needs a read
trigger it does not have. The SSOT table then generalised it — the source file states the
mechanism, every other file states only its own role's act.

Applied here: a line in `architect.md`, and in each mode file that produces an artifact,
naming what that mode writes and what shape it owes. `pipelines.md` keeps the mechanism and
the per-kind table. `architect.md` restates neither.

## No-gos

- **Not a read trigger.** That is the fix this item exists to reject, for the reason `coach`
  recorded at C3.
- No change to `pipelines.md`'s per-kind table or its artifact-shape section. This item adds
  the role's own half.

## Open questions

- **Does the audit reach further than `architect`?** `product` writes `spec.md` and the
  `features/` manifest; `coach` writes `spec.md` and the amendments; `writer` and `editor`
  write neither. If more than one role file is silent about what it produces, this is a sweep
  rather than a line, and the sweep is its own slice.
- `role-file-shape.md` governs a role file's anatomy. Does "what this role writes" belong in
  its TROOP Output section, or is it a new heading?
- **The falsifier, cheap and concrete, from `coach`: the next `design.md` written after the
  board-hook slice lands.** If it carries frontmatter, prompt-routing failed and this item is
  confirmed. If it does not, the risk is lower than stated and the item can be re-scoped —
  the seat reads `pipelines.md` before composing any invocation, which is why the exposure is
  bounded today.
