---
name: backlog-board-redesign
title: 'Epic index: the backlog board redesign, split into three child candidates'
created: 2026-08-24
---

**This file is an index, not work** — the slice check's second exemption in
`.claude/references/definition-of-ready.md`. It began life as `intent-driven-layout`, was
reevaluated point by point with the user on 2026-09-16, renamed, and then ruled an **Epic** by
that day's `/idea-assess` run (S=1: reach spans more than one slice with no ordering; the epic
test passed in the splitting direction). The full reevaluation record — every dated ruling,
the declined alternatives, the research grounding — lives in this file's git history between
the demotion commit and the split.

## The children

In landing order:

| #   | Child                                         | Delivers                                                                                                                                                                                                                                          |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ideas/candidates/backlog-board-migration.md` | The `backlog/` board: `ideas`/`ready`/`done` lanes, per-item artifact folders scaled by kind, `kind:` frontmatter, the retrospective queue, and the mutation-invariance chain edit with a fresh probe.                                            |
| 2   | `ideas/candidates/pipeline-reference.md`      | `.claude/references/pipelines.md` + sidecar — per-kind classes of service with the citation-only gates rule — and the ruled single-sourcing migrations from `orchestration.md`, CLAUDE.md, `product.md`, and `architect.md`. Lands after child 1. |
| 3   | `ideas/candidates/wire-in-the-adr-tier.md`    | `adr/0001` recording the board decision with the reevaluation's declines as Options considered, the stale `adr/README.md` reservation fix, and `architect.md`'s `adr/` read trigger. Independent.                                                 |

## Declined at the reevaluation, so nobody re-proposes them

One line each; child 3's `adr/0001` carries the full Options-considered record.

- The `features/` → `openspec/specs/<capability>/` move — `features/` stays flat.
- The `openspec/` substrate entirely, and with it the misnomer question.
- The OpenSpec CLI (confirmed) and `spec-as-source` (confirmed).
- The per-change `adr.md` consultation manifest — replaced by the read trigger, revisit when
  the ADR count makes consultation non-obvious.

## Open questions

Carried by this index for the children and the deferred rulings:

- **The retrospective's trigger and owner**, and where a retro's own findings land. Unruled;
  child 1 can land with deletion simply waiting.
- **Where does `spikes/` go, and does it survive?** Deferred by the user until
  `only-harness-writes-reach-the-language-server` lands. The analysis so far: per-change
  scratch is ruled out by the `done/` deletion lifecycle; the leading shape is top-level plus
  retrospective garbage collection; `spikes/**` sits in `vite.config.ts`'s `sharedExclude`, is
  routed to by `definition-of-ready.md`, and is deliberately absent from the
  mutation-invariance allowlist.
- **What discriminates an ADR from the decision surfaces the repo already has** — dated inline
  rulings, `.meta.md` sidecars, `slice/*` tags. Deferred by the user until ADRs have been
  derived from the existing files.
- Whether the fan-in `dry4ts` run reverses `architect.md`'s prohibition acceptably — see
  `ideas/candidates/architect-designs-for-parallelism.md`.
