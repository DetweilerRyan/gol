---
name: the-board-hook-misfits-per-item-artifacts
title: Teach the board-shape hook that per-item artifacts are not idea files
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R3,
2026-09-17 — a process observation first made in its SPEC handoff. The mechanism below was
read out of the hook itself on 2026-09-18.

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

The board holds five artifact kinds — `proposal.md`, `design.md`, `spec.md`, `tasks.md`,
`findings.md` — and the hook has one shape.

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

## Question

What shape does each per-item artifact owe, and how does the hook tell an artifact from an
idea file — by basename, by lane, or by frontmatter?

## Open questions

- Does artifact frontmatter get documented in `backlog/TEMPLATE.md`, a sibling template,
  or `.claude/references/pipelines.md`, which already names the artifacts per kind?
- The era discriminator conflates two questions: is this file old, and is this file an
  idea. Does splitting them retire the legacy branch, or does the board still hold files
  that need it?
- `proposal.md` resolves identity from its folder. Do the other four do the same, or does
  an artifact declare no `name:` at all?
