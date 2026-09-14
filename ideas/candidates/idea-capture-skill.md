---
name: idea-capture-skill
title: Add /idea-capture, and give .claude/skills/** the Vale section it is missing
created: 2026-09-14
---

## Context

Child 1 of `backlog-readiness-assessment.md`. Two problems, one landing:

**Capture is prose-driven.** Filing a candidate means remembering `ideas/TEMPLATE.md`'s shape by
hand. The board shows the drift: measured 2026-09-13, 24 of 61 idea files carry sections the
template does not name, and frontmatter stays uniform only because the same seat writes it.

**`.claude/skills/` would land on an unlinted surface.** Measured 2026-09-13: no `.vale.ini`
section glob matches a path under `.claude/skills/`, so Vale applies zero rules there while
`npm run prose-lint` still counts the file — a confident zero of exactly the class `prose.md`
enumerates. The `Instruction` style, the regrowth guard for instruction files, does not reach it.
The section must land in the same slice as the first skill file, because a section matching zero
files is the same defect in the other direction.

## Sketch

- `.claude/skills/idea-capture/SKILL.md` — capture a raw thought into `ideas/candidates/<slug>.md`
  from `ideas/TEMPLATE.md`. Sets `name` = basename, `created` = today, leaves Sketch thin (a
  candidate may). `allowed-tools: Read, Write`. Model-invocable, so a passing thought is filable
  without the user typing the command.
- `.vale.ini` gains `[.claude/skills/**/*.md]` — `architect`'s edit. STE + Procedure + the three
  Instruction rules, mirroring the role-file section. A three-place edit, not seven: the four
  later overlapping sections already carry `= NO` for every rule it enables.
- `prose.md`'s "What is scoped, and what is not" names the new surface; `prose.meta.md` records
  the measured zero and the date.

## Touches

- `.claude/skills/idea-capture/SKILL.md` (new)
- `.vale.ini` (`architect`)
- `.claude/agents/articles/prose.md`, `prose.meta.md` (orchestrating session)

## Open questions

- Nothing blocking. Verification is the standing set: `prose-lint` scoped to the skills dir
  reading the trailing file count, `agent-doc-check` (hypothetical scripts written with angle
  brackets), `reference-check` (every filename token resolves by basename), `format:check`, and
  one live `/idea-capture` invocation whose output passes `format:check`.
