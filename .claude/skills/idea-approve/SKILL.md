---
name: idea-approve
description: Record the human's per-letter ruling into an idea's assessment record, as its own act before any promotion.
argument-hint: '[backlog/ideas/<name>.md]'
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git *)
---

# Rule on an assessment

Record the user's ruling on the assessment for $ARGUMENTS. The human invocation of this command is the ruling, and
nothing else may write that section.

Preconditions, checked in order:

- **The record must exist**, at `backlog/ideas/<name>.assessment.md`. Absent one, stop and report that `/idea-assess`
  writes it.
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result
  against the record's `idea-blob`. On a difference, stop and report it, and recommend a fresh `/idea-assess`.
- **The ruling must be in this conversation**, per letter: agree, or differ with the reason. Absent a letter, ask for it
  and stop.
- **The target must sit in the ideas lane.** A promoted record is frozen. Stop and say so.

Then:

1. Replace the record's `None recorded.` line with the ruling.
2. Commit the record alone, naming the idea in the subject.

The ruling's shape, in place of that one line:

- Open with `Ruled <YYYY-MM-DD>.` on its own line.
- Then one line per letter, all six, in the order the summary table holds them.
- Each line names the letter as the table spells it, then `agree` or `differ`.
- A differing letter carries the user's reason on the same line. An agreement carries none.

Rules that bind the write:

- Rule on every letter, a declined score included. A missing letter refuses the next promotion.
- Change nothing else in the record. The judge's half is never edited, at any point.
- A record already ruled on may be ruled on again while the idea is in the ideas lane, replacing the ruling whole.
- A fresh `/idea-assess` discards the ruling, since the ruling was given on findings that no longer stand.
- Match the 120-character width. Formatting is prettier's job.

Report the commit hash.
