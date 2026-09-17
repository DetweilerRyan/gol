---
name: repoint-the-three-stale-protocol-home-citations
title: Repoint the three out-of-boundary citations of the merge protocol's old home
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R1,
2026-09-17.

## Situation

The merge protocol moved from CLAUDE.md to `.claude/references/merge-protocol.md` on
2026-09-17. Three citations of its old home sit in files the signed spec put outside
`writer`'s boundary: `vite.config.ts`'s path-allowlist comment, two `description` strings
in `schemas/mutation-invariance.schema.json`, and the module header of
`scripts/mutation-invariance/checks.ts`.

## Complication

No checker can see any of the three. `.json` is outside `reference-check`'s extension
alternation. The `CLAUDE.md` token still resolves. The possessive citations are not
identifier-shaped. The retained CLAUDE.md pointer keeps a reader navigable, so the cost is
indirection, not a dead end — but the claims are now stale on the record.

All three paths are on the mutation-invariance absent list, so this item re-arms a full
mutation run whenever it lands.

## Question

Repoint the three citations to the protocol's live home, at a moment that does not pay a
full mutation run for three comment lines alone.

## Answer

Bundle with other pending `scripts/` work rather than running alone — `coach`'s carried
recommendation.

## Open questions

- Which pending `scripts/` item is the bundle partner?
