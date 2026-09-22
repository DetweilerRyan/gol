---
name: claude-md-is-not-the-place-to-document-the-board
title: Move the idea board's documentation out of CLAUDE.md and leave a pointer
created: 2026-09-21
---

## Situation

`CLAUDE.md` carries an Idea board section: the three lanes, the folder-per-item shape, the `kind`
frontmatter, the name-as-identity rule, the move-only promotion commit, the `done/` move, and the
argument for lane-as-directory. Measured 2026-09-21: the section runs 45 lines of a 450-line file.

Three other files already document the same board. `.claude/references/definition-of-ready.md` holds
the assessment, the dispositions and the record shape. `.claude/references/pipelines.md` holds the
per-kind class of service and the per-item artifact convention. `backlog/IDEA-TEMPLATE.md` holds the
ideas lane's item shape, renamed there from `backlog/TEMPLATE.md` on 2026-09-22. Measured 2026-09-21,
those three run 619 lines between them.

`CLAUDE.md` is auto-loaded into every session and every subagent. Its own Idea board section states
that the orchestrating session owns the board and that no role reads it, apart from an item's own
spec and amendment files at paths an invoking prompt names.

The file's routing test already carries the rule that would move this. Ruled 2026-09-17: a long
procedure only one audience executes may live in `.claude/references/`, provided `CLAUDE.md` keeps a
pointer plus whatever binds before the procedure's first step. The merge protocol was extracted on
exactly that reasoning, and `backlog/done/extract-the-merge-protocol/` records it.

## Complication

The board's documentation has no single source. A reader asking what a lane holds, or what promotion
does, finds part of the answer in the auto-loaded index and part in two references, with no rule
saying which is authoritative. Neither half states that the other exists for the same subject.

The split also taxes the wrong audiences. Six audiences load `CLAUDE.md` before doing anything, and
the section itself says only one of them may act on its content. Every role pays for 45 lines it is
forbidden to use.

The precedent for moving it is in force and was applied once. Nothing records why it was not applied
a second time to a section of the same shape and the same single audience.

## Question

What binds before the board's first procedural step, and therefore has to stay in the auto-loaded
file, once the rest moves to the reference tier?

## Answer

Shaped, not specified.

- **The board's procedures move to the reference tier**, where the audience that executes them
  already reads. The merge protocol is the precedent for both the move and the shape.
- **`CLAUDE.md` keeps a pointer and whatever binds first.** The 2026-09-17 exception names that test:
  a reader who never opens the reference must still fail safely.
- **The move is a relocation, not a rewrite.** What the board's rules say is not this idea's subject.

## No-gos

- **The board's rules do not change.** Lanes, promotion, the `kind` field and the retrospective are
  untouched; only where they are written down moves.
- **No checker is built.** Whether anything should verify the board is a separate question.

## Open questions

- **Which reference holds it?** A new file in the tier, or a section inside one of the two that
  already document the board. Both existing files state an audience in their own headers, and the
  board's audience differs from neither exactly.
- **What binds before step one?** The candidate is the promotion rule about the move-only commit,
  since a reader who expands a file before moving it destroys the rename history and cannot undo it
  by reading a reference afterwards.
- **Does the split survive the move, or dissolve?** Three files documenting one board may be the
  deeper finding, in which case the target is a consolidation rather than a relocation.
- **How much of the 45 lines is unique?** Nobody has diffed the section against the 619 lines that
  already cover the subject, so the overlap is unmeasured and the move's real size is unknown.
- **Does the same test reach other sections?** The routing exception is general, and no pass has
  asked which other parts of the auto-loaded file are long procedures with one audience.
