---
name: the-board-hook-misfits-per-item-artifacts
title: Teach the board-shape hook that per-item artifacts are not idea files
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R3,
2026-09-17 — a process observation first made in its SPEC handoff.

## Situation

The PostToolUse board hook fires on every `backlog/**` write. When `coach` wrote
`spec.md` into `backlog/ready/extract-the-merge-protocol/` on 2026-09-17, the hook applied
the idea-file shape to it.

## Complication

Half the hook's demands fit: asking a spec for `## Touches` and `## Open questions` was
sound. Half did not: it asked for a `title` matching an idea file's frontmatter, which a
per-item artifact does not carry. The board's artifact tier — `proposal.md`, `design.md`,
`spec.md`, `tasks.md`, `findings.md` — has no documented shape of its own, so the hook has
nothing better to check against.

## Question

What shape does each per-item artifact owe, and how does the hook tell an artifact from an
idea file — by basename, by lane, or by frontmatter?

## Open questions

- Does artifact frontmatter get documented in `backlog/TEMPLATE.md`, a sibling template,
  or `.claude/references/pipelines.md`, which already names the artifacts per kind?
