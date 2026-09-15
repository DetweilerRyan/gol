---
name: idea-assess
description: Assess one ideas/ board file against the readiness rubric and rule a disposition.
argument-hint: '[ideas/candidates/<name>.md]'
arguments: [target]
disable-model-invocation: true
context: fork
agent: general-purpose
allowed-tools: Read, Bash(git *), Grep, Glob
---

# Assess an idea

Target: $target

Layer 1 ran before this text reached you. Its output:

!`sh "${CLAUDE_SKILL_DIR}/layer1.sh" $target`

**Absent a `LAYER1` count line directly above, Layer 1 did not run. Stop and say so. Do not assess.**

Then:

1. Read `.claude/references/definition-of-ready.md` in full.
2. Read the target file in full.
3. Apply the article: the slice check, the kind check, then the six letters.
4. Rule exactly one disposition.

Rules that bind the record:

- Name the kind with its SAFe orientation label, as the article's kind check writes it.
- Give every scored letter its 1–5 number and its finding text together. A number never travels alone.
- No total, no average, no cross-kind ranking.
- Fold the Layer 1 findings above into the record; they are measurements, not scores.
- The disposition comes from the written findings, never from the numbers.
- Write no file and change no file. The judging seat does not act on its own grade; promotion is a separate human-invoked command.

Return the record: kind, per-letter findings with scores, the disposition, and — for epic or spike — what the exit names.
