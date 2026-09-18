---
name: sweep-the-sidecars-for-change-logs
title: Apply the sidecars-are-not-change-logs ruling across the tracked sidecars
created: 2026-09-18
kind: enabler-process
---

Split out of `claim-discipline-does-not-name-the-self-describing-count` on 2026-09-18, after
`/idea-assess` ruled that file an Epic: it carried a bounded rule and this unbounded sweep
with no ordering between them. The user ruled both halves belong under the existing
`effective-prose` epic rather than under a new one.

## Situation

**Ruled by the user 2026-09-18: a `.meta.md` sidecar carries the explanation behind its
instruction file — including an option that was dropped and why, so the decision can be
relitigated with context — and never a log of what a slice changed, because git already
holds that.**

The ruling was applied once, to `.claude/references/merge-protocol.meta.md`, in the slice
that produced the evidence. Four sections went: an extraction record, a register-split
record, and two check-readings tables. What stayed is the placement ruling, why each step is
shaped as it is, the stage-5 argument, and the rejected alternatives. That file is the worked
precedent and the only one done.

Measured 2026-09-18 with `git ls-files '*.meta.md'`: **22 tracked sidecars, of which one is
swept.**

## Complication

The other 21 have never been read against the ruling. Nobody knows how much of the tier is
change log, and the number matters — it is the difference between a one-file edit and a
sweep across the article, reference, role and module sidecar tiers.

The ruling removes a defect class rather than policing it. Fifteen findings in one slice were
all change-log prose, so a sidecar carrying no change log cannot produce them. Every one of
those was invisible to `reference-check`, `agent-doc-check` and `prose-lint`, which read
green throughout.

## Question

Which passages in the remaining 21 sidecars are explanation, which are a log of what a slice
changed, and in what order should they be swept?

## Answer

Shaped, not specified:

- **Take the file list first and size it.** A count of change-log sections per sidecar turns
  this from an unbounded sweep into an ordered one, and may show most files are already
  clean.
- **State the retained-versus-deleted test before editing anything**, using
  `merge-protocol.meta.md` as the worked precedent: a dropped option and why it was dropped
  stays, a record of what a slice did goes.
- **Draw the no-retrofit boundary.** The records that produced the evidence are records.

## No-gos

- No new rule. The ruling exists; this applies it. The rule half is
  `claim-discipline-does-not-name-the-self-describing-count`.
- No article split. Creating new sidecars is `roll-the-rationale-sidecar-out`'s question, not
  this one. This sweep only removes change-log prose from sidecars that already exist.

## Open questions

- Does the ruling bind the module sidecar tier — `src/cache.meta.md` and its siblings — the
  same way it binds the article tier? Their audience is a caller rather than a role.
- `roll-the-rationale-sidecar-out` is marked in `effective-prose` as "believed complete —
  verify and delete, or say what remains". This sweep is new work on the same tier rather
  than the remainder of that one. Does that entry close on its own terms first?
- Is the sweep one slice or several? The file count decides it, and nobody has taken it.
