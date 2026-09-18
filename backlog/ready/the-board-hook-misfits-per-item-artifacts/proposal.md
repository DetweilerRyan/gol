---
name: the-board-hook-misfits-per-item-artifacts
title: Teach the board-shape hook that per-item artifacts are not idea files
created: 2026-09-17
kind: enabler-process
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R3,
2026-09-17 — a process observation first made in its SPEC handoff. The mechanism below was
read out of the hook itself on 2026-09-18.

**Parked 2026-09-18, behind `relocate-the-skill-hooks-into-the-tested-tier`.** `coach`'s spec
is written and unsigned at that date. The user declined to sign a spec changing untested
logic, `slice/spike-where-a-skill-script-can-live-and-be-tested` established the path to
testedness, and the user then ruled the relocation lands first.

**Two consequences for whoever resumes this.** The spec's readings were taken against
`layer1.ts` at its current path and single-file shape, so the relocation makes them stale —
reach for an amendment rather than a re-spec, since a moved file is the trigger
`pipelines.md` names for exactly that. And the relocation splits the program into a `run.ts`
shell plus pure modules, so the logic this slice rewrites will live in a module that does not
exist yet.

## Situation

`.claude/settings.json` wires `.claude/skills/idea-assess/scripts/layer1.ts` as a
PostToolUse hook on `Write` and `Edit` under `backlog/**`. It is advisory: it always exits
0, and it reaches the acting agent only when it has a finding. It applies six checks to
whatever file it fires on.

1. `name:` equals the file's basename — or, for `proposal.md`, the folder's basename.
2. `title:` is present and non-empty.
3. `created:` matches a `YYYY-MM-DD` date.
4. `status:` is absent, since the directory is the status.
5. The opening section is present: `## Question` where the file has `## Situation`,
   otherwise `## Touches`.
6. `## Open questions` is present.

It also prints one report line: the lane, the shape era, a line count, and a count of
`depends on` mentions.

## Complication

The board holds six artifact kinds and the hook has one shape. Census taken 2026-09-18:
`proposal` ×12, `spec` ×4, `amendment-<n>` ×5, `design` ×2, `findings` ×1, and `tasks`
declared but never built.

**`amendment-<n>.md` is the hardest case and the file missed it until assessment.** It
landed 2026-09-18 with the amendment mechanism, it is numbered rather than literal, so a
basename-keyed shape table needs a pattern for it rather than a name. A `coach` SPEC composed
from an earlier draft of this file would have ruled shapes for five kinds and missed the
sixth.

Its scope test asks only whether the path sits under `backlog/`. There is no basename test
and no extension test, so every artifact is measured against the idea-file shape. The one
artifact-aware branch is the identity check's `proposal` case, which reads identity from
the folder rather than the file. That case shows the author met this problem once and
solved it for exactly one basename.

Two consequences, both observed when `coach` wrote `spec.md` on 2026-09-17:

- The identity check falls through to the file's own stem, so a spec is asked to declare
  `name: spec`. No spec should satisfy that.
- The era discriminator keys on `## Situation` alone. An artifact that has no Situation
  section is classified as the legacy era and asked for `## Touches` — not because it is an
  old file, but because it is not an idea file at all. The demand is right for the wrong
  reason, which is why it read as sound.

## The readings, and why they are worse than noise

Taken 2026-09-18, by running the hook against three landed artifacts:

| Artifact                                                                        | Hook reading                               |
| ------------------------------------------------------------------------------- | ------------------------------------------ |
| `backlog/done/extract-the-merge-protocol/spec.md`                               | **0 findings**                             |
| `backlog/done/declare-the-role-cycles-in-config/design.md`                      | **0 findings**                             |
| `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-1.md` | **5 findings**, none a defect in that file |

**The two zeros are the finding.** This file predicted that no spec should ever declare
`name: spec`. Both of those artifacts now do, and both carry a `## Touches` section, because
each was bent to the shape the hook demanded. So the hook is not merely reporting a false
class — it has already deformed two artifacts and now reads green on them.

That is the case the slice should be specified against. A noisy check trains a reader to
skim; a check that reshapes the thing it measures and then passes it is a different defect,
and the passing reading is the evidence.

## Question

What shape does each per-item artifact owe, and how does the hook tell an artifact from an
idea file — by basename, by lane, or by frontmatter?

## Open questions

- Does artifact frontmatter get documented in `backlog/TEMPLATE.md`, a sibling template,
  or `.claude/references/pipelines.md`, which already names the artifacts per kind?
- The era discriminator conflates two questions: is this file old, and is this file an
  idea. Does splitting them retire the legacy branch, or does the board still hold files
  that need it?
- `proposal.md` resolves identity from its folder. Do the other five do the same, or does
  an artifact declare no `name:` at all?
- `board-era-check-as-a-tengo-rule` ports the same era discriminator into a Vale rule. It is
  optional by its own text — "The skill's script keeps its own copy of the check regardless"
  — so neither blocks the other. Ruling the discriminator here may retire that item or
  narrow it.
