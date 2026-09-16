---
name: backlog-board-migration
title: Migrate the idea board to backlog/ with per-item artifact folders and a done/ retrospective queue
created: 2026-09-16
kind: enabler
---

Child of `backlog-board-redesign`, the epic index. The design below is not open — it was ruled
by the user, per point, at the 2026-09-16 reevaluation recorded in that file's git history.
This child executes it.

## Situation

The board is `ideas/candidates/` and `ideas/todo/`, flat files in both lanes. Promotion is a
move-only commit; the slice deletes its own idea file at completion; the `slice/*` tag is the
record. Artifacts a slice's phases produce (architect's design, the dispatch plan) have no home
and die in handoff messages.

## Complication

The user dislikes the lane names, and the artifact gap is measured: a design conclusion was
re-derived four times by three roles because no pass could read the first pass's reasoning.

## Question

Execute the ruled migration: rename the board, give promoted items artifact folders, and route
completion through a retrospective queue.

## Answer (ruled, user 2026-09-16)

```
backlog/
  ideas/<name>.md     # raw, single file, unjudged -- was ideas/candidates/
  ready/<name>/       # assessed against definition-of-ready -- was ideas/todo/
    proposal.md       # the promoted idea file, renamed by the move-only commit
    design.md         # only when the design-pass triggers fire
    tasks.md          # only when dispatch is multi-unit
    findings.md       # spikes only: the recorded answer
  done/<name>/        # completed, awaiting retrospective -- deleted after it
```

- **Kind lives in frontmatter**: `kind: story | enabler | spike | epic`, written by
  `/idea-assess`. Directory carries the lane, frontmatter the kind — not a `status:` field, so
  the `Board` style's rule is untouched. `TEMPLATE.md` grows the field.
- **Folder shape scales by kind**; an epic gets no folder — it stays an index in `ideas/` and
  splits, per `definition-of-ready.md`.
- **Kind maps to the cycle and plans rather than authorizes**: an enabler's `product` skip is
  still confirmed by the walk-every-path demonstration at merge time.
- **Promotion stays a move-only commit** carrying the two assessment records:
  `git mv backlog/ideas/<name>.md backlog/ready/<name>/proposal.md` (content-based rename
  detection keeps `R100`). `<name>` stays the identity: file basename in `ideas/`, folder
  basename in `ready/`, the branch, the tag. The ~3 cap moves to `ready/`.
- **Completion is `git mv` into `done/`, not `git rm`.** A periodic retrospective extracts what
  finished work teaches (durable halves of `design.md` and `tasks.md` deviations →
  `backlog/ideas/`; spike findings → the parent's re-assessment, `adr/` when decision-shaped;
  `proposal.md` → nothing beyond the tag message), then deletes. `done/` records _not yet
  retrospected_, a fact the tag does not carry — the standing "no done/ lane" objection does
  not apply.

**Migration surfaces** (recomputed 2026-09-16): the three `idea-*` skills,
`definition-of-ready.md` + sidecar, `.vale.ini`'s `[ideas/**/*.md]` section and the `Board`
style, `reference-check`'s `ideas/**` exclusion + its test, CLAUDE.md's Idea board section and
merge-protocol steps 6 and 8, `orchestration.md`'s board conduct, `TEMPLATE.md`.

**The mutation-invariance chain, end to end**: `vite.config.ts`'s `sharedExclude` entry
`ideas/**` and its probe-measurement comment block; the allowlist entry
`{ "path": "ideas/**", "securedBy": "vitest-exclude" }`; the C4-bound prose in
`mutation-testing.meta.md`. `backlog/**` is a **new entry with its own argument** — re-run the
`shared-exclude-covers-docs-dirs` probe under `backlog/` and record a fresh `verifiedOn`. The
diff edits `vite.config.ts` and `mutation-invariance.config.json`, both on the `absent` list,
so it is non-invariant by design and pays `test:mutation:full` at merge steps 3 and 5. A
forgotten exclude edit fails silent, not red — walk the chain by hand rather than reading
exit 0.

**Verification is count-based**: record `npm test`'s Test Files/Tests totals before and assert
identical after; `agent-doc-check` and `reference-check` gate the doc surfaces.

## No-gos

- No gate, checker, or board-rendering script for `backlog/` — `ls` stays the board.
- No `status:` frontmatter; the directory is the status.
- The `spikes/` ruling is not this slice's work (deferred on the index).

## Open questions

- The retrospective's trigger and owner, and where a retro's own findings land — carried on the
  epic index, unruled. The `done/` lane can land first; deletion simply waits.
