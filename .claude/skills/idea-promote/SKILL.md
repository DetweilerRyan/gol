---
name: idea-promote
description: Promote a ruled-on candidate to backlog/ready, carrying its assessment record and freezing it.
argument-hint: '[backlog/ideas/<name>.md]'
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git *)
---

<!-- reference-check: allow assessment.md -- the per-item artifact name this procedure creates; no item carries one yet, and the marker goes stale (delete it) when the first does -->

# Promote an idea

Move the candidate in $ARGUMENTS to its `backlog/ready/<name>/` folder, carrying its assessment record. The human invocation of this command is the grant; neither the judging pass nor the ruling promotes.

Preconditions, checked in order:

- **The assessment record must exist**, at `backlog/ideas/<name>.assessment.md`, carrying a Ready disposition. Absent one, stop and report that `/idea-assess` writes it.
- **The record must carry a ruling on every letter.** A record with none, or one missing a letter, refuses the promotion. Stop and report that `/idea-approve` records it.
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result against the record's `idea-blob`. On a difference, stop, report it, and recommend a fresh `/idea-assess` followed by a fresh `/idea-approve`.
- **Report the lane count.** Run `git ls-files 'backlog/ready/*/proposal.md'` and count. Above three, report the cap and proceed only on the user's word, since a hard refusal would be the board's first gate.

Then, in this order:

1. Run `git mv backlog/ideas/<name>.md backlog/ready/<name>/proposal.md`.
2. Run `git mv backlog/ideas/<name>.assessment.md backlog/ready/<name>/assessment.md`.
3. Commit both moves alone, with the body below. Rename detection is content-based, so neither basename change defeats it.
4. Flesh out the proposal afterwards, as its own commit, if the file needs it.

**`kind:` is written after the move, never before it.** Take it from the record in step 4, absent one in the proposal already. Any earlier edit to the idea file changes its blob id and makes the record stale.

The move commit's body carries the judge's summary: the kind, the disposition, and each of the six scores beside its one-line finding. It names the date the record was ruled on, so a reader of `git log` can see the ruling preceded the grant. The record in full stays in the file, and no total travels in either place.

**This command writes nothing inside the record.** Both halves are already there, and the sync check above covers both — a ruling cannot outlive the record that holds it.

**The record is immutable from the move commit.** A retro compares what happened against the assessment the promotion was granted on, so the frozen text is the point. The stored `idea-blob` stops matching once the proposal is fleshed out, and that divergence is expected history rather than a defect.

Report the commit hash and the new paths.
