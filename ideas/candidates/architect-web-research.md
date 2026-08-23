---
name: architect-web-research
title: Give architect web access so it can check upstream claims and survey libraries
created: 2026-08-23
---

## Context

The docs already carry claims about the outside world, and every one of them was
researched by hand, once, and never revisited:

- **`CLAUDE.md`, the crap4ts patch note** — upstream PR `breezy-bays-labs/crap4ts#37`
  is described as "open and unmerged since 2026-04-07", with `crap4ts@1.x`
  "in maintenance mode pending a Rust-backed v2 rebuild, so it may never land."
  If that PR ever merges, `patches/crap4ts+1.0.1.patch` can be dropped and the
  exact-version pin lifted. Nothing re-checks it.
- **`.claude/agents/articles/engineering.md`** — "The interaction has no public
  report — the nearest analogue is `stryker-js#2704`." An **absence** claim about
  a public issue tracker is the most decay-prone kind there is: true the day it
  was written, and unfalsifiable from inside the repo thereafter.
- **`sgconfig.yml` and `CLAUDE.md`** — ast-grep's exit-code semantics are
  "verified against 0.45.1", with `@ast-grep/cli` pinned to exactly that version.
  Whether 0.46 changed them is not knowable offline.

No role can check any of this. All five roles carry an identical allowlist —
`Read, Write, Edit, Bash, Grep, Glob, LSP` — and none has `WebSearch` or
`WebFetch`. Grepping `.claude/**` and `CLAUDE.md` for
`websearch|webfetch|web access|internet|external source|upstream issue` returns
**zero hits**: external research isn't forbidden here, it is simply unmentioned.
The pipeline depends on it and has no seat for it.

`architect` is the plausible owner. It already owns keeping the docs true after
a structural change, owns `rules/*.yml` (where the version-pinned claim lives),
and in **design mode** is the role choosing between approaches — precisely when
"does a library already solve this" or "is that upstream bug fixed yet" changes
the answer.

## Sketch

1. Add `WebSearch, WebFetch` to `architect.md`'s `tools:` line.
2. Add a short **External research** section to the role body, scoping when to
   reach for it rather than leaving it open-ended:
   - **design mode**, when weighing an approach against an existing library;
   - **review mode**, when it is already touching a doc that carries a pinned
     upstream claim.
     Not as a routine step in every pass — the point is a narrow licence, not a
     habit.
3. Require any doc change it justifies to cite **the URL and the date checked**,
   so the next reader knows when the claim was last true rather than inheriting
   another undated assertion. This is the mechanism that makes the whole idea
   pay for itself; without it the slice just moves the staleness problem.

## Touches

`.claude/agents/architect.md` (frontmatter and body), and `CLAUDE.md`'s
allowlist paragraph — which becomes false the moment the five allowlists
diverge, so it has to change in the same slice.

Changing a role's tools needs explicit user direction under `workflow.md`'s
role-boundary rule, so this cannot start as a normal `architect` self-edit.

## Open questions

- **It reverses a decision the repo made on purpose.** `CLAUDE.md` says plainly:
  "What separates them is no longer the tool allowlist — it's the **write
  boundary**, stated in prose." Giving one role a tool the others lack
  reintroduces allowlist-as-boundary. Two honest ways out: accept the reversal
  and say why, or give all five roles web access and keep the boundary in prose
  where it now lives. Picking one is the first thing this slice has to do.
- **It makes an architect pass non-deterministic.** Every gate here is offline
  and reproducible; two runs of the same slice could now reach different
  conclusions with nothing in the handoff explaining why. The URL-plus-date
  citation is the proposed mitigation — whether that is enough, or whether the
  findings need to be quoted into the handoff so a later reader can audit them
  without re-fetching, is unresolved.
- **Fetched pages are untrusted input.** `architect` holds `Write`/`Edit` over
  `rules/*.yml`, `CLAUDE.md`, and `src/`. A README or issue thread is data, never
  instructions, and that should be written in the role file rather than assumed.
- **Is `architect` even the right role?** `hardener` owns the dependency-facing
  gates and would be the one to notice a patch that no longer applies. The case
  for `architect` rests on design mode; the case for `hardener` rests on
  upkeep. They may not be the same slice.
