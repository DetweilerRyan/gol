---
name: idea-promote
description: Promote an assessed candidate to backlog/ready with the two-record verdict commit.
argument-hint: '[backlog/ideas/<name>.md]'
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git *)
---

# Promote an idea

Move the candidate in $ARGUMENTS to its `backlog/ready/<name>/` folder, carrying the calibration record. The human invocation of this command is the grant; the judging pass never promotes.

Preconditions, checked in order:

- **A judge's record for this file must be in this conversation** — a `/idea-assess` output with kind, per-letter findings, and a Ready disposition. Absent one, stop and say so.
- **The human's ruling must be in this conversation** — agree or differ, per letter, with reasons on the differing letters. Absent one, ask for it and stop.
- **Report the lane count.** Run `git ls-files 'backlog/ready/*/proposal.md'` and count. Above three, report the cap and proceed only on the user's word, since a hard refusal would be the board's first gate.
- **The kind must be in the file's frontmatter** — `/idea-assess` writes it at assessment. Absent a `kind:` line, take it from the judge's record in this conversation and add it in step 3's edit commit, never in the move commit.

Then, in this order:

1. Run `git mv backlog/ideas/<name>.md backlog/ready/<name>/proposal.md`. The basename change does not defeat rename detection — it is content-based.
2. Commit that move alone, with the two-record body below.
3. Flesh out the file afterwards, as its own commit, if the file needs it.

The commit body carries **two records, in this order**:

- The judge's six letters, verbatim from the assessment — each score with its finding text. Never edit this half after the fact.
- The human's ruling, per letter: agree, or differ with the reason.

A number never travels without its finding text, and the body carries no total. `definition-of-ready.md` says why the order matters: the judge's half written first is what keeps the human label uncontaminated for calibration.

Report the commit hash and the new path.
