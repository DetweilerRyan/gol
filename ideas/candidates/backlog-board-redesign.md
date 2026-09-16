---
name: backlog-board-redesign
title: Redesign the board as backlog/ with per-item artifact folders, ADRs, and retrospectives
created: 2026-08-24
---

## Context

**Depended on `nested-spec-discovery`, which has since landed** (`slice/nested-spec-discovery`
is tagged): `scripts/` discovery is recursive now. Moot as a blocker anyway — the
capability-directory move it enabled was declined at the 2026-09-16 reevaluation.

The repo's spec and idea folders are bespoke. Adopting a published layout makes
the structure recognizable rather than something every reader has to learn.

**What this tracks is `intent-driven`, not base OpenSpec** — a community OpenSpec
schema. The `openspec/` substrate is shared between them, but every distinctive
element adopted here is intent-driven's: the per-change `adr.md`, the durable
`adr/NNNN-*.md`, the `proposal → specs → design → adr → tasks` order, the
read-back rule, ADR immutability, and applicability scaled by slice type.
**Base OpenSpec has no ADR concept at all.** (Reevaluated 2026-09-16: the
`openspec/` substrate is dropped — see "The board redesign" under Sketch. What
survives of intent-driven is the per-change `design.md`/`tasks.md`, scaled
applicability, and the ADR tier; the prior-art base broadened to Kiro and
GitHub spec-kit, which reach the same folder-per-item shape.)

The concrete gap this closes: `architect.md` says design mode's "deliverable is a
plan, not a diff", and nothing writes that plan down — it lives in a handoff
message that dies with the session. The REVIEW pass is then meant to "verify the
executed structure actually matches what you approved" against an artifact that
no longer exists. `ideas/candidates/scrollbar-visible-proportion-affordance.md` records
the cost verbatim, and the figure has since grown: **"Raised four times now, by
three roles, for two different consumers."** Two of those four were `architect`
DESIGN rulings that reached the same conclusion independently, because the first
one's reasoning was never written anywhere a later pass could read it.

`.feature` files stay hand-authored source, executed by playwright-bdd against the
`features/steps/*.ts` step modules and hardened by `acceptance-mutation` — strictly
more than either framework's specs get. (This paragraph originally named a colocated
`.steps.test.ts(x)` layer; `delete-step-test-layer` removed it.)

## Sketch

Target layout:

```
adr/                         # PARTLY LANDED -- see below
  README.md
  TEMPLATE.md
  0001-adopt-intent-driven-layout.md
  0002-lsp-proxy-for-out-of-band-writes.md
spikes/                      # provisional top-level dir -- ruling DEFERRED 2026-09-16, see open questions
  lsp-fs-sync/
openspec/                    # SUPERSEDED 2026-09-16 -- the substrate is dropped entirely; the
  backlog/                   #   backlog/changes halves are replaced by the board redesign below,
  changes/                   #   and the specs/ half was declined outright
    <slice>/
      proposal.md
      design.md
      adr.md                 # DECLINED 2026-09-16 -- see the decisions table
      tasks.md
    archive/YYYY-MM-DD-<slice>/
  specs/                     # DECLINED 2026-09-16 -- features/ stays flat, see the decisions table
    <capability>/            #   (the .steps.test layer this bundled is gone; steps/ and screenplay/
    _shared/                 #   were never placed here -- the sketch predates delete-step-test-layer)
```

### The board redesign — ruled 2026-09-16 at reevaluation, replacing `openspec/`

Points 3 and 4 of the reevaluation, ruled together by the user. With the spec
move declined and this redesign, nothing would live under `openspec/`, so that
substrate is dropped. The board's replacement:

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

The rulings, each user 2026-09-16:

- **Names: `backlog/` root, `ideas` and `ready` lanes.** `backlog` is the Agile
  Alliance term for what the directory is; `ready` makes the lane name and
  `definition-of-ready.md`'s promotion bar the same word.
- **Kind lives in frontmatter.** `/idea-assess`'s kind check writes
  `kind: story | enabler | spike | epic` (its contract-bearing /
  checker-bearing / knowledge-bearing labels, plus the epic disposition). One
  fact, one home: directory carries the lane, frontmatter carries the kind. A
  `kind:` field is not a lane duplicate, so the Board style's no-`status:` rule
  is untouched.
- **Folder shape scales by kind.** `proposal.md` always. `design.md` only when
  the design-pass triggers fire; `tasks.md` only when dispatch is multi-unit;
  `findings.md` for spikes. An epic gets no folder — it stays an index file in
  `ideas/` and splits into children, per `definition-of-ready.md`.
- **Kind maps to the cycle, and plans rather than authorizes.** Story: the full
  cycle. Enabler: no `product` in either mode — the classification sets the
  expected cycle at promotion, and the walk-every-path demonstration in
  `orchestration.md` still confirms the skip at merge time, the same fail-safe
  shape as the mutation-invariance predicate. Spike: no pipeline; it closes by
  re-assessing its parent.
- **Completion is `ready/<name>/` → `done/<name>/`, and deletion waits for a
  retrospective** (ruled at point 5 of the reevaluation, superseding the
  slice-deletes-its-own-file mechanics). The slice's final act is a `git mv`
  into `done/`, not a `git rm`. Periodically, a retrospective walks `done/`,
  extracts what the finished work can teach, and deletes what it has
  retrospected. `done/` is a **retrospective queue, not an archive** — that
  framing is what squares it with the standing "no `doing/` or `done/` lane"
  rule: the tag already records _finished_, and this lane records the distinct
  fact _not yet retrospected_, which nothing else carries. One fact, one home
  holds.
- **`design.md`'s durable half returns to `backlog/ideas/`.** The retrospective
  is when the extraction happens: content worth keeping — follow-up work,
  unadopted alternatives, standing findings — becomes new `backlog/ideas/`
  files before the folder is deleted. `tasks.md`'s recorded deviations route
  the same way (they are the evidence
  `ideas/candidates/architect-designs-for-parallelism.md` wants), and a spike's
  `findings.md` has usually already landed in its parent's re-assessment, with
  a decision-shaped finding graduating to `adr/`. `proposal.md` needs no
  extraction — the tag message carries the summary.

Promotion stays a move-only commit carrying the two assessment records:
`git mv backlog/ideas/<name>.md backlog/ready/<name>/proposal.md` — rename
detection is content-based, so the basename change still scores `R100`.
Identity: `<name>` is the file basename in `ideas/`, the folder basename in
`ready/`, the branch, and the `slice/<name>` tag. The ~3 cap moves to `ready/`
folders, and `ls backlog/ready/` is still the board.

Prior art, researched 2026-09-16: the folder-per-item-with-typed-artifacts
shape is convergent, not this repo's invention. Kiro's `.kiro/specs/<feature>/`
holds `requirements.md`/`design.md`/`tasks.md` with sign-off between phases and
runs `tasks.md` as a dependency graph in concurrent waves — the dispatch-plan
idea below, independently arrived at. GitHub spec-kit's `specs/<NNN-feature>/`
holds `spec.md`/`plan.md`/`tasks.md`/`research.md`. intent-driven's
`changes/<slice>/` is the version this file started from. The lane vocabulary
(an unrefined tier feeding a `ready` tier gated by a Definition of Ready) is
the standard backlog shape.

Migration surfaces, recomputed 2026-09-16: the three `idea-*` skills,
`definition-of-ready.md` and its sidecar, `.vale.ini`'s `[ideas/**/*.md]`
section and the `Board` style, `reference-check`'s `ideas/**` exclusion and its
test, CLAUDE.md's Idea board section and merge-protocol steps 6 and 8,
`orchestration.md`'s board conduct, and `TEMPLATE.md`, which grows the `kind:`
field.

**Plus the mutation-invariance chain, which the rename must walk end to end**
(verified present 2026-09-16): `vite.config.ts`'s `sharedExclude` entry
`ideas/**` and the comment block above it recording the
`shared-exclude-covers-docs-dirs` probe measurements; the
`mutation-invariance.config.json` allowlist entry
`{ "path": "ideas/**", "securedBy": "vitest-exclude" }`; and the C4-bound
argument prose in `mutation-testing.meta.md`, which names `ideas/` at three
sites. `backlog/**` is a **new entry with its own argument**, not a
find-and-replace: the probe measurement that justified `ideas/**` was taken
against that path, so re-run the probe under `backlog/` and record a fresh
`verifiedOn` rather than carrying the old one forward. Two consequences,
stated so the slice expects them. First, the migration diff edits
`vite.config.ts` and `mutation-invariance.config.json`, both on the config's
`absent` list, so the diff is non-invariant by design and pays
`test:mutation:full` at merge steps 3 and 5. Second, the failure direction of
forgetting the exclude edit: a renamed directory leaves `ideas/**` matching
nothing, and an exclude that matches nothing is silently inert rather than
red — whether `npm run mutation-invariance`'s validation catches a glob with
no live target is unverified, so walk the chain by hand rather than reading
exit 0 as proof.

**Two parts of this landed early, and this slice inherits them rather than creating
them.** Both arrived with the `only-harness-writes-reach-the-language-server` work, which
needed a decision record before this slice was anywhere near ready:

- **`adr/` already exists**, with `README.md`, `TEMPLATE.md` in the MADR shape this file
  specifies, and `0002-lsp-proxy-for-out-of-band-writes.md`. So **step 3 below is now
  partly done**: the scaffolding is there and only `0001` remains to be written. `0001`
  was deliberately left unwritten and reserved for this slice — `adr/README.md` records
  that the gap is intentional so a reader does not read it as a lost file.
- **`spikes/` is a new top-level directory**, holding prototype work that is deliberately
  outside every gate (no CRAP threshold, no vitest suite, no `dry4ts`, no mutation
  testing). Ruled acceptable **provisionally**. Its permanent ruling was point 6 of the
  2026-09-16 reevaluation and the user **deferred it** until
  `only-harness-writes-reach-the-language-server` lands — see the open question, which
  carries the analysis taken so far. It stays provisional and top-level meanwhile, and
  choosing its fate is no longer this slice's work.

Decisions already taken:

|                   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI               | **Not installed.** `openspec archive` and `validate` need parseable Markdown requirement deltas that `.feature` files cannot provide. Git supplies delta and archive honestly — `ADDED/MODIFIED/REMOVED` annotations can lie where `git diff` cannot. Also avoids an `AGENTS.md` collision with `.claude/agents/`. **Confirmed 2026-09-16 at reevaluation point 7**, with a stronger reason than the originals: no `openspec/` directory exists in the design at all, so there is nothing for the CLI to operate on.                                                                                                                                                                                                                   |
| Archiving         | **Superseded 2026-09-16** — the `changes/archive/` form died with `openspec/`, and the user ruled a different shape at reevaluation: a completed slice's folder moves to `backlog/done/<name>/`, held there until a periodic **retrospective** extracts what the work can teach, then deleted. `done/` is a retrospective queue, not an archive — bounded, with a reader, and emptied by its own process. The delete-on-tag rule still ends the same way (the folder dies; the `slice/*` tag is the permanent record); what changes is when, and that CLAUDE.md's Idea board section and merge-protocol step 6 still get rewritten.                                                                                                    |
| Backlog           | **Superseded 2026-09-16** — see "The board redesign" above. The separate-lane principle survives (a folder is created only on promotion, never before); the `openspec/` home does not, and the lanes are now `backlog/ideas/` and `backlog/ready/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ADR path          | **Top-level `adr/`** — canonical for both ADR-bearing schemas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Spec layout       | **Declined** — user, 2026-09-16, at reevaluation, reversing this row's earlier "capability directories" decision. The three-file bundle a directory would unite died with `delete-step-test-layer`; the live pairing is 12 `.feature` ↔ 12 `features/steps/*.ts`, 1:1 by name, so colocation already reads off the filenames. The shared layer grew against grouping (global step registry, `features/screenplay/`, the barrel), two e2e specs are cross-cutting with no `.feature`, and the coupling bill grew past the ~10 estimated: `mutation-invariance.config.json` names `features/**` (C4-bound arguments) and `reference-check` enumerates `features/` in its scan scope, both post-dating this file. `features/` stays flat. |
| `spec-as-source`  | **Rejected.** Extraction exists to bridge Markdown specs to runnable Gherkin — a gap this repo doesn't have. It would make `.feature` a build artifact and break three tools at once: `acceptance-mutation` would mutate generated output, `gherkin-lint` would report findings nobody can fix, `prettier-plugin-gherkin` would format generated files. Opt-in in intent-driven too. **Confirmed 2026-09-16 at reevaluation point 7**, untouched by the reevaluation's other rulings.                                                                                                                                                                                                                                                  |
| `adr/0001` scope  | **Ruled 2026-09-16 at reevaluation point 7**: one ADR recording the board redesign — a title on the order of "Adopt the backlog board layout", the ruled design as the Decision, and the losers as Options considered: the intent-driven `openspec/` layout, capability spec directories, the `changes/archive/` form (superseded by `done/` plus retrospectives), and status-in-frontmatter. Self-demonstrating, as this file always intended. `adr/README.md`'s reservation paragraph is a due edit in the slice: it names the 0001 subject this reevaluation replaced, and cites `ideas/todo/intent-driven-layout.md`, a path stale twice over that survives `reference-check` only by basename matching.                           |
| Slice identity    | **Renamed 2026-09-16 at reevaluation point 7**: `intent-driven-layout` → `backlog-board-redesign`, move-only commit per the board's own rule. The name becomes the branch and the permanent `slice/` tag, and the old name would have labelled the record with the design the reevaluation declined.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ADR template      | **MADR** — Status / Context / Options considered / Decision / Consequences. **Landed already**, with four statuses rather than the two this row assumed: a frozen `Accepted` is immutable, and `Accepted (not yet frozen)` binds while staying editable. See `adr/README.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `adr.md` manifest | **Declined for now** — user, 2026-09-16, at reevaluation. The per-change consultation manifest's value scales with the ADR count, and the count is one, so every manifest would be ceremony. Revisit when "which in-force ADRs touch this slice" stops being answerable at a glance. The read trigger below is what replaces it.                                                                                                                                                                                                                                                                                                                                                                                                       |
| ADR read trigger  | **Adopted** — user, 2026-09-16, at reevaluation. `architect.md` gets a trigger: check `adr/` for in-force records at the start of every design, review, and adjudicate pass. CLAUDE.md's documentation map gets a pointer line. Verified 2026-09-16 that no `.claude/agents/**` file names `adr/` today, so a binding record currently has no reader. Independent of the `openspec/` layout.                                                                                                                                                                                                                                                                                                                                           |

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

Ordered steps, each its own commit — **stale as of 2026-09-16**: steps 2 and 4
served the declined `features/` move, and step 5's paths predate the board
redesign. The steps and Touches get redrawn once reevaluation points 5–7 (the
archive, `spikes/`, and what `0001` records) are ruled.

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

3. **`adr/` scaffolding — mostly landed already.** `README.md` and `TEMPLATE.md`
   exist, so what remains is `0001`, scoped by the `adr/0001` row in the table
   above: the board redesign as the Decision, the reevaluation's declined
   alternatives as Options considered. Self-demonstrating: the board's own
   redesign becomes the first record — and it slots into a directory that
   already proved the format on a real decision (`0002`), which is a stronger
   position than scaffolding a format nothing has used yet. The same commit
   updates `adr/README.md`'s reservation paragraph, which names the superseded
   0001 subject and a lane path stale twice over.
4. **Prose** — comments in `scripts/feature-files.ts`, `src/patternLibrary.ts`,
   `src/components/Cell.test.tsx`, `src/test-support/cellQuery.ts`.
5. **Docs** — CLAUDE.md and the four role files. Rewrite the Idea board section
   and merge-protocol step 6. Keep the move-only promotion rule, now covering
   `backlog/<x>.md` → `changes/<x>/proposal.md`. Give `architect.md` the two
   surviving artifacts (`design.md`, `tasks.md`) and the `adr/` read trigger —
   the `adr.md` manifest and its read-back obligation are declined, see the
   decisions table. **Scale the requirements by slice
   type**: `proposal.md` always, the other three only when the slice meets the
   existing design-pass triggers. The schema itself says the full set is "not
   for small tactical fixes, docs-only changes, or behaviour-only work without
   durable design decisions", and several recent slices were docs-only.

## Touches

`features/**` and `ideas/**` (moved); `spikes/**` (a home to be decided, see the open
question); `vite.config.ts`, `playwright.config.ts`, `package.json`,
`tsconfig.app.json`; `rules/no-aliveness-by-paint-class.yml`, `-tsx.yml`,
`no-domain-imports-in-black-box-steps.yml`; the two `FEATURES_DIR` constants; CLAUDE.md
and `.claude/agents/{architect,coder,cleaner,product}.md`.

`adr/` is **not** in that list any more — it already exists and only needs `0001` added.

No `src/` logic and no `scripts/` logic — only comments and path strings.

**Verification is count-based, not green-based.** CLAUDE.md warns that a vitest
project whose glob matches nothing "reports 0 files and exits 0 — there is no
warning", so record `npm test`'s **Test Files and Tests totals** plus
`npx playwright test --list` before step 1 and assert them identical after step 5. `npm run acceptance-mutation` is the specific detector for a dead acceptance
glob: `assertBaselineGreen` throws on zero tests before scoring a mutant.
`ast-grep:rules` and `agent-doc-check` both gate and both catch a botched rename.
`test:mutation:full`, since the `mutate` globs' file-level assumptions change.

## Open questions

- **What discriminates an ADR from the decision surfaces the repo already has?**
  Dated inline rulings in CLAUDE.md and the articles, `.meta.md` sidecars (whose
  remit names the rejected alternative), and `slice/*` tags all record decisions;
  an ADR's Options-considered section is a close neighbour of a sidecar's. Without
  a routing rule the surfaces drift into each other. Deferred — user, 2026-09-16,
  at reevaluation: the discriminator gets ruled from real cases after the user
  runs through the existing files to derive ADRs, not in advance of them.
- **Where does `spikes/` go, and does it survive?** DEFERRED — user, 2026-09-16,
  at reevaluation: rule it after `only-harness-writes-reach-the-language-server`
  lands and shows whether anyone actually re-runs the spike. It stays top-level
  and provisional meanwhile. The analysis taken before deferring, so the later
  ruling starts from it rather than re-deriving:
  - **Per-change scratch is ruled out** by the board redesign — the
    `done/<name>/` lifecycle deletes folders after retrospective, and a spike
    prototype routinely outlives its slice (`spikes/lsp-fs-sync` backs
    `adr/0002`'s Verification section, and `0002` outlives everything).
  - **The leading shape is top-level plus retrospective garbage collection**:
    each entry names the ADR or parent idea its findings fed, and the point-5
    retrospective also walks `spikes/`, deleting entries nothing cites as
    re-runnable any more. Per-entry judgment replaces the global
    delete-after-ADR rule, keeping a proof while its ADR is young and killing
    it when it becomes a museum piece.
  - Verified 2026-09-16: `spikes/**` is in `vite.config.ts`'s `sharedExclude`,
    so a stray `.test.ts` in a spike is not collected; `definition-of-ready.md`
    already routes throwaway spike artifacts here, so the directory is
    load-bearing whatever the ruling; and `spikes/**` is deliberately absent
    from the mutation-invariance allowlist, the fail-safe direction — an entry
    would need its own argued row.
- **Is nesting worth it at all?** RESOLVED 2026-09-16: no — the spec-layout
  decline in the decisions table is the answer, on this question's own terms.
  The three questions this file asked downstream of nesting (`_shared/`
  placement, the three ast-grep rules' single-segment scoping, `pairTargets`
  under directories) die with it. `pairTargets` had already resolved
  independently: the symbol no longer exists in `scripts/acceptance-mutation/`,
  and `nested-spec-discovery` landed.
- **Two additions are in neither framework**: RESOLVED 2026-09-16 — the tension
  dissolved because standardization is no longer the claim. The board redesign
  stands on this repo's own terms, with Kiro and spec-kit as prior art for the
  folder-per-item shape rather than a schema being conformed to.
- **Archiving versus the tag**: RESOLVED 2026-09-16 — neither, as originally
  posed. The user ruled a `backlog/done/<name>/` lane holding completed folders
  until a periodic retrospective extracts their lessons and deletes them. The
  drift objection dissolves because the lane is bounded and emptied by its own
  process rather than accreting untrusted copies. Two new questions it opens:
  - **The retrospective's trigger and owner.** "Periodically" is unspecified.
    Plausible triggers: `done/` reaching a count (which would also serve as the
    lane's cap), or piggybacking on `definition-of-ready.md`'s calibration pass
    (which fires at ten dispositions). The orchestrating seat presumably runs
    it, since no role reads the board. Unruled.
  - **Where a retrospective's own findings land.** Extraction targets are ruled
    (`backlog/ideas/`, the parent idea, `adr/`); whether the retro also leaves
    a record of itself — and where — is not.
- **Does `openspec/` misname itself**: RESOLVED 2026-09-16 — moot; the
  directory no longer exists in the design. The board redesign's `backlog/`
  names what it holds.
- Whether the fan-in `dry4ts` run reverses `architect.md`'s explicit prohibition
  acceptably — see the open question already recorded in
  `ideas/candidates/architect-designs-for-parallelism.md`.
