---
name: shell-comments-are-unscanned
title: Let reference-check read a shell file's own comments, not only shell-shaped tokens
created: 2026-09-16
---

## Situation

`reference-check` scans comment lines in the source surface and every line of every doc file,
and its token extractor already recognises shell-shaped filenames wherever they appear in a
scanned file. Two shell scripts now live under `.claude/skills/` as hook and injection
machinery, each opening with a header comment that cites config files, runners, and a skill by
name.

## Complication

A shell file's own comments are never scanned — the source surface's extension list stops at
TypeScript and YAML — so those header citations are machine-checked by nothing. Found by
`hardener` 2026-09-15 while gating the write-time hook slice: the asymmetry is one-directional,
tokens in, comments never read. The citations resolve today; nothing notices when they stop.
`yaml-block-scalar-prose-is-unscanned.md` records the sibling class on the YAML side.

## Question

Which unscanned comment surfaces should the source scan claim, and is shell one class or an
instance of the wider gap the YAML sibling already names?

## Answer

Shaped, not specified: widen the source scan to shell and reach the directory the scripts live
in — the hash-prefixed comment form already parses as a comment line, so the cost is an
extension and a prefix rather than a parser.

## Open questions

- Does the widening land alone, or fold with the YAML sibling into one widen-the-scan slice?
- The change edits a gating `scripts/` program, so the full `scripts/` gate tax applies —
  is the small widening worth its own slice, or does it wait for the next reference-check
  slice regardless?
- Are there other comment-bearing surfaces the scan misses beyond shell and YAML block
  scalars? A census belongs in the slice, not here.
