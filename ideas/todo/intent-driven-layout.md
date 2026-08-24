---
name: intent-driven-layout
title: Move features/ and ideas/ into the intent-driven OpenSpec layout, adding ADRs
created: 2026-08-24
---

## Context

**Depends on `nested-spec-discovery`.** That slice makes `scripts/` discovery
recursive; until it lands, the capability directories below would break
`acceptance-mutation` and `gherkin-dry` outright.

The repo's spec and idea folders are bespoke. Adopting a published layout makes
the structure recognizable rather than something every reader has to learn.

**What this tracks is `intent-driven`, not base OpenSpec** — a community OpenSpec
schema. The `openspec/` substrate is shared between them, but every distinctive
element adopted here is intent-driven's: the per-change `adr.md`, the durable
`adr/NNNN-*.md`, the `proposal → specs → design → adr → tasks` order, the
read-back rule, ADR immutability, and applicability scaled by slice type.
**Base OpenSpec has no ADR concept at all.**

The concrete gap this closes: `architect.md` says design mode's "deliverable is a
plan, not a diff", and nothing writes that plan down — it lives in a handoff
message that dies with the session. The REVIEW pass is then meant to "verify the
executed structure actually matches what you approved" against an artifact that
no longer exists. `ideas/candidates/scrollbar-thumb-length-affordance.md` records
the cost verbatim: **"Raised twice now."**

`.feature` files and their colocated `.steps.test.ts(x)` / `.e2e.spec.ts` stay
hand-authored source. They are executed 1:1 and hardened by
`acceptance-mutation`, which is strictly more than either framework's specs get.

## Sketch

Target layout:

```
adr/
  TEMPLATE.md
  0001-adopt-intent-driven-layout.md
openspec/
  backlog/                   # was ideas/candidates/
  changes/
    <slice>/
      proposal.md            # was ideas/todo/<slice>.md
      design.md              # NEW
      adr.md                 # NEW -- review manifest: in-force ADRs consulted
      tasks.md               # NEW -- dispatch plan
    archive/YYYY-MM-DD-<slice>/
  specs/                     # was features/
    <capability>/            # .feature + .steps.test.ts(x) + .e2e.spec.ts
    _shared/                 # acceptance-harness.tsx, e2e-helpers.ts
```

Decisions already taken:

|                  | Decision                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CLI              | **Not installed.** `openspec archive` and `validate` need parseable Markdown requirement deltas that `.feature` files cannot provide. Git supplies delta and archive honestly — `ADDED/MODIFIED/REMOVED` annotations can lie where `git diff` cannot. Also avoids an `AGENTS.md` collision with `.claude/agents/`.                                                                   |
| Archiving        | **Adopt.** Completed changes move to `changes/archive/YYYY-MM-DD-<slice>/`. This **reverses the delete-on-tag rule** from `f8ad280`, so that CLAUDE.md section and merge-protocol step 6 get rewritten, not extended.                                                                                                                                                                |
| Backlog          | **Separate lane.** A change folder is created only on promotion. In neither framework.                                                                                                                                                                                                                                                                                               |
| ADR path         | **Top-level `adr/`** — canonical for both ADR-bearing schemas.                                                                                                                                                                                                                                                                                                                       |
| Spec layout      | **Capability directories**, one per spec, matching `intent-driven`. Possible only because `nested-spec-discovery` lands first.                                                                                                                                                                                                                                                       |
| `spec-as-source` | **Rejected.** Extraction exists to bridge Markdown specs to runnable Gherkin — a gap this repo doesn't have. It would make `.feature` a build artifact and break three tools at once: `acceptance-mutation` would mutate generated output, `gherkin-lint` would report findings nobody can fix, `prettier-plugin-gherkin` would format generated files. Opt-in in intent-driven too. |
| ADR template     | **MADR** — Status / Context / Options considered / Decision / Consequences. Accepted ADRs are immutable: supersede, never edit.                                                                                                                                                                                                                                                      |

**`tasks.md` is architect's dispatch plan, not a checklist.** Commits record what
happened; `tasks.md` records how work is dispatched — which `coder`/`cleaner`
invocations run in parallel, which are sequenced, and where parallel units fan
back in (including a node where architect runs `npm run dry4ts` over the union,
since no cleaner can see its siblings' branches). Written once; deviations
recorded rather than edited away, because a plan that said three parallel units
where two collided is exactly the evidence
`ideas/candidates/architect-designs-for-parallelism.md` wants.

That also resolves the ownership question that candidate leaves open: architect
writes the plan **as a reviewable document** and the orchestrator executes it, so
there is no `Agent` grant, no nested subagents, and the step-4 review is not
self-review. Proposing a dispatch order is not dispatching, so `workflow.md`'s
"never `checkout`, `rebase`, `merge`, `push`" is untouched.

Ordered steps, each its own commit:

1. **`git mv` only, no content edits.** Pure renames score `R100` and history
   follows; a move plus rewrite in one commit records delete-plus-add and
   `git log --follow` loses everything prior. The board documents this rule
   already — here it applies to itself.
2. **Path couplings** — about ten are real, out of ~34 files matching
   `features`: `vite.config.ts`'s `acceptanceTests`, `playwright.config.ts`'s
   `testDir`, `package.json`'s `gherkin-lint-plus features`,
   `tsconfig.app.json`'s include, the two `FEATURES_DIR` constants (**path
   string only** — discovery logic is untouched in this slice), and three
   `rules/*.yml` `files:` globs.
   **The glob lockstep is the trap here.** `vite.config.ts` records that
   `acceptanceTests` does **not** cross `/`, but "the _same-looking_ glob string in
   a `rules/*.yml` `files:` key DOES cross `/`, because ast-grep's `*` is a
   different matcher." Worse, if the acceptance glob goes dead, `unit`'s exclude
   list still subtracts unconditionally, so the file "runs in NO project" --
   green, and testing nothing. Change the acceptance glob and the `unit` exclude
   in the **same commit**, and rewrite that comment block for the nested shape.

3. **`adr/` scaffolding** — `TEMPLATE.md` plus `0001`, whose Options-considered
   section is the rejections in the table above. Self-demonstrating: the
   restructure's own decision becomes the first record.
4. **Prose** — comments in `scripts/feature-files.ts`, `src/patternLibrary.ts`,
   `src/components/Cell.test.tsx`, `src/test-support/cellQuery.ts`.
5. **Docs** — CLAUDE.md and the four role files. Rewrite the Idea board section
   and merge-protocol step 6. Keep the move-only promotion rule, now covering
   `backlog/<x>.md` → `changes/<x>/proposal.md`. Give `architect.md` the three
   artifacts and the read-back obligation. **Scale the requirements by slice
   type**: `proposal.md` always, the other three only when the slice meets the
   existing design-pass triggers. The schema itself says the full set is "not
   for small tactical fixes, docs-only changes, or behaviour-only work without
   durable design decisions", and several recent slices were docs-only.

## Touches

`features/**` and `ideas/**` (moved); `vite.config.ts`, `playwright.config.ts`,
`package.json`, `tsconfig.app.json`; `rules/no-aliveness-by-paint-class.yml`,
`-tsx.yml`, `no-domain-imports-in-black-box-steps.yml`; the two `FEATURES_DIR`
constants; CLAUDE.md and `.claude/agents/{architect,coder,cleaner,product}.md`.

No `src/` logic and no `scripts/` logic — only comments and path strings.

**Verification is count-based, not green-based.** CLAUDE.md warns that a vitest
project whose glob matches nothing "reports 0 files and exits 0 — there is no
warning", so record `npm test`'s **Test Files and Tests totals** plus
`npx playwright test --list` before step 1 and assert them identical after step 5. `npm run acceptance-mutation` is the specific detector for a dead acceptance
glob: `assertBaselineGreen` throws on zero tests before scoring a mutant.
`ast-grep:rules` and `agent-doc-check` both gate and both catch a botched rename.
`test:mutation:full`, since the `mutate` globs' file-level assumptions change.

## Open questions

- **Is nesting worth it at all?** Colocation already works by filename prefix.
  Making it structural matches `intent-driven` and groups a capability's three
  files, but buys no behavior -- the honest case is legibility, not capability.
- **Where does `_shared/` belong** -- inside `specs/`, or beside it? Inside means
  `**/*.steps.test.tsx` must not accidentally match helpers; beside keeps the
  capability directories uniform.
- **Do the three ast-grep rules stay correct?** `no-aliveness-by-paint-class.yml`,
  its `-tsx` twin, and `no-domain-imports-in-black-box-steps.yml` carry comments
  recording deliberate reasoning about single-path-segment scoping, one of which
  explicitly anticipates a subdirectory. Each needs re-reading, not a mechanical
  glob edit.
- **Does `pairTargets` get simpler or harder?** One capability per directory may
  make pairing _within_ a directory simpler than matching paths globally -- a
  smaller change than it first appears. `nested-spec-discovery` decides this
  first, and this slice inherits the answer.
- **Two additions are in neither framework**: the `backlog/` lane and the
  dispatch-plan `tasks.md`. Both earn their place on this repo's own terms, but
  they are the parts a reader who knows intent-driven will not recognize — which
  is a real cost when standardization is the reason for the change. Worth a
  conscious ruling rather than drift.
- **Archiving versus the tag.** Adopting `changes/archive/` means a completed
  proposal stays readable without git archaeology, but nothing gates it, so it
  will drift out of date. The `slice/*` tag plus its commit message stays the
  more accurate record. Is the archive worth keeping if it is never trusted?
- **Does `openspec/` misname itself** now that the CLI is not installed and the
  schema being tracked is a community one? `intent-driven` is an OpenSpec schema,
  so the name is defensible — but it advertises a tool this repo does not run.
- Whether the fan-in `dry4ts` run reverses `architect.md`'s explicit prohibition
  acceptably — see the open question already recorded in
  `ideas/candidates/architect-designs-for-parallelism.md`.
