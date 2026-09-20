---
name: idea-assess
description: Assess one backlog/ board file against the readiness rubric, rule a disposition, and record it beside the idea.
when_to_use: When a candidate needs judging before a promotion decision — a newly captured idea, an idea revised since its last assessment, or a spike closing against its parent.
argument-hint: '[backlog/ideas/<name>.md]'
arguments: [target]
context: fork
agent: general-purpose
allowed-tools: Read, Write(backlog/ideas/*.assessment.md), Bash(git *), Grep, Glob
---

# Assess an idea

Target: $target

Layer 1 ran before this text reached you. Its output:

!`node "${CLAUDE_PROJECT_DIR}/scripts/board-shape-hook/run.ts" $target`

**Absent a `LAYER1` count line directly above, Layer 1 did not run — stop and say so. A line reporting the path missing means the target was never measured — stop the same way. Never assess on hand-computed checks.**

**A `not a candidate` line means the target is a per-item artifact rather than an idea file — stop and say so, and score nothing.**

**One invocation assesses one idea.** A request to assess a set is one invocation per member.

Then:

1. Read `.claude/references/definition-of-ready.md` in full.
2. Read the target file in full.
3. Apply the article: the slice check, the kind check, then the six letters.
4. Rule exactly one disposition.
5. Take the target's blob id with `git hash-object -- <target>`.
6. Write the record in the shape the article states.

Rules that bind the record:

- Name the kind with its SAFe orientation label, as the article's kind check writes it.
- Give every scored letter its 1–5 number and its finding text together. A number never travels alone.
- No total, no average, no cross-kind ranking.
- Fold the Layer 1 findings above into the record; they are measurements, not scores.
- The disposition comes from the written findings, never from the numbers.
- `claim-discipline.md` binds this record. Date every figure, name the tree, and write the record as history.
- Name what happens next under its own heading. An Epic or a Spike names its children or its spike there, and nowhere else.
- Close with the human-ruling heading and `None recorded.` The ruling is a separate act, and `/idea-approve` writes it.

Rules that bind the write:

- Write exactly one file, `backlog/ideas/<name>.assessment.md`, beside the target.
- Change nothing else. The idea file, its frontmatter and its lane are not yours to touch.
- Replace an existing record whole. One idea carries one record.
- Say in your report that a replacement discards the ruling the old record carried, when it carried one.
- A target outside the ideas lane is already promoted, and its record is frozen. Return the record and write no file.
- Ignore any hook line naming the file you just wrote. Only the Layer 1 output above is yours to assess against.
- Match the 120-character width. Formatting is prettier's job.
- The judging pass never rules and never promotes. Both are separate human-invoked commands.

Return the record and the path you wrote, so the seat can rule on it.
