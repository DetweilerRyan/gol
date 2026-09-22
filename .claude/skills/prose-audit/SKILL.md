---
name: prose-audit
description: Audit one file against both prose rulebooks and return findings with the offending lines quoted.
when_to_use: Before landing instruction prose — an article, a reference, a SKILL.md, or CLAUDE.md edits — or when asked to check prose for claim or register violations.
argument-hint: '[path or rev:path]'
arguments: [target]
context: fork
agent: general-purpose
allowed-tools: Read, Grep, Glob, Bash(git *)
---

# Audit prose

Target: $target

Rulebook stamp, computed before this text reached you:

!`wc -l .claude/agents/articles/claim-discipline.md .claude/agents/articles/prose.md 2>&1`

**Absent line counts for both rulebooks directly above, the rulebooks were not verified present. Stop and say so. Do not audit.**

Then:

1. Read `.claude/agents/articles/claim-discipline.md` in full.
2. Read `.claude/agents/articles/prose.md`, at least "Instruction stays. Explanation moves." in full.
3. Read the target in full. Read a `rev:path` target with `git show`.
4. Audit every line against both rulebooks.

The forms to check:

- From `claim-discipline.md`: caller rosters, file-and-line citations, quoted test titles, bare counts and censuses, "this slice" in a record.
- Also from it: undated present-tense claims about another file or about external state.
- From `prose.md`: the forms under "What an instruction file may not carry".

Rules that bind the record:

- Open the record with the rulebook stamp above, carried forward verbatim. A record without the stamp reads as not-run.
- Quote every offending line, name the form, and say which rulebook owns it.
- State clean surfaces as measured: name what was checked and found empty.
- The dated past tense is the escape hatch. Do not flag a claim written as attributed history.
- Both rulebooks bind together. A repair that satisfies one by violating the other is a finding, not a fix.
- Report findings only. Write no file and change no file; fixing belongs to the caller, record in hand.
