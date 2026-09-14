---
name: idea-assess-skill
title: Add /idea-assess — Layer 1 injected, Layer 2 judged, one of four dispositions out
created: 2026-09-14
---

## Context

Child 3 of `backlog-readiness-assessment.md`, after the rubric survives its three-candidate test.
The assessment becomes invocable: Layer 1 arrives as injected fact rather than prose instruction,
Layer 2 scores against the article's anchors, and the output is a disposition with findings —
never a bare number.

## Sketch

- `.claude/skills/idea-assess/SKILL.md` — `context: fork`; `allowed-tools` without `Write`, so
  the judging seat cannot act on its own grade (the same asymmetry as hardener's exemption rule).
  Opens with a dynamic-injection line running `layer1.sh`; immediately beneath it: absent a
  `LAYER1` count line, Layer 1 did not run — stop and say so, do not assess.
- `.claude/skills/idea-assess/layer1.sh` — POSIX sh, under ~30 lines, always exit 0. Frontmatter
  facts Vale cannot see (name == basename, created is a date), section presence, line count,
  `Depends on` count, lane. Ends `LAYER1 <path>: <n> checks, <m> findings`. No jq, no Vale, no
  rewriting.
- `.claude/settings.json` — `PostToolUse` on `Write|Edit` with `if` scoped to `ideas/**`, calling
  the same script. Advisory by the event's own mechanics. Verify whether one handler can carry
  both tool names by running it, not reasoning about it.
- `vale-styles/Board/NoStatusField.yml` + fixture pair + `fixtures.vale.ini` wiring, and an
  `[ideas/**/*.md]` section enabling that one rule — `architect`'s. Measured 2026-09-13: zero
  `status:` fields on the board, so it lands clean on both lanes.

## Touches

- `.claude/skills/idea-assess/` (new), `.claude/settings.json`
- `vale-styles/Board/` (new), `vale-styles/fixtures/`, `.vale.ini` (`architect`)
- `.claude/agents/articles/prose.md`, `prose.meta.md`

## Open questions

- **Is the hook worth its noise?** It cannot block, so its whole value is stderr text. Ship it,
  and drop it if it never catches a malformed write the injection would not have.
