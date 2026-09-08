---
name: rationale-sidecar-pilot
title: Split doc-comments.md into an instruction file and a rationale sidecar, and stand up Vale report-only
created: 2026-09-08
---

> Written as Situation / Complication / Question / Answer rather than the Context / Sketch shape in
> `ideas/TEMPLATE.md`. Scope, Roles, Acceptance and Rollback follow the Answer; Touches and Open
> questions are unchanged. Promoted from the candidate
> `simplified-technical-english-for-agent-docs`; the STE shape rules, the vocabulary process and the
> `prose-linting.md` article are deferred to `ste-shape-rules-for-instruction-files`.

## Situation

Every role and this session read `CLAUDE.md` plus some subset of `.claude/agents/**` before doing any
work. That corpus is the repo's largest unexecuted artifact, it is where this repo deliberately puts
the reasoning nothing else can check, and its only reviewer is `hardener`.

**It grew 28-fold in three weeks.** Measured over 227 commits touching `CLAUDE.md` or
`.claude/agents/**`, end-of-day `git ls-tree -r --long` bytes, 2026-08-18 through `bac96c4` on
2026-09-08:

| date           |   CLAUDE.md | house rules | unconditional | whole corpus |
| -------------- | ----------: | ----------: | ------------: | -----------: |
| 2026-08-18     |       8,513 |           0 |         8,513 |       19,982 |
| **2026-09-05** | **255,770** |      55,409 |   **311,179** |      395,366 |
| 2026-09-06     |      58,592 |      63,612 |       122,204 |      518,894 |
| 2026-09-08     |      62,649 |      73,541 |       136,190 |  **556,528** |

"House rules" is `engineering.md` + `workflow.md` + `handoffs.md`, read unconditionally by every role
and this seat. "Unconditional" adds `CLAUDE.md`, auto-loaded into every session and every subagent —
the floor every participant pays before doing anything.

**And most of that corpus issues no instruction.** Blocks — a paragraph or a list item — classified by
whether they carry a directive (a normative marker: must, never, do not, should, is owned by, belongs
in, refuses; or an imperative head verb, including one after a short leading clause). On the same tree:
**381 of 821 blocks — 46% — carry no directive at all**, totalling **158,114 bytes, 30% of the corpus's
prose.** Separately, and needing no classifier judgement: **341 backticked slice-slug mentions**, every
one naming repo history rather than anything a normal workflow must do.

**This is a proxy, not a measurement of "clarity", which is not measurable.** It estimates how much
prose an agent must sift to reach its directives. Hand-validated on two stratified samples of 36 blocks:
**24/36 and 25/36 — about 2 in 3**, the second drawn after the marker lists were corrected so it scores
the shipped classifier rather than the one it was tuned on. **The errors are asymmetric**: in both
samples the dominant failure was a _missed_ directive, which moves blocks into rationale-only. So read
**30% as an upper bound** on what could move cleanly and **81% entanglement as a lower bound**. Both
bounds fail in the safe direction.

## Complication

**The repo already diagnosed size creep and already applied the structural fix. Measured, that fix
moved the tax rather than reducing it.** On 2026-09-06 the routing-index split took `CLAUDE.md` from
255,770 to 58,592 bytes and grew the articles from 3 files to 13. `CLAUDE.md` fell 76% and the
unconditional load fell 56%. But the corpus grew **123,528 bytes that day** — the largest single-day
increase in the series, next largest +48,150 — the unconditional floor climbed **11% in the two days
after** (122,204 → 136,190), and `engineering.md` is now **62,217 bytes against `CLAUDE.md`'s 62,649**,
within 432 bytes, while being one of the three articles nobody may skip.

**And the rationale is not in separable chunks — it is woven through the instructions.** Of the 440
blocks carrying a directive, **357 also carry non-directive prose: 81% entanglement.** Five files sit
at **100%** — `acceptance-mutation.md`, `architecture.md`, `ast-grep-rules.md`, `quality-tooling.md`,
`testing-layers.md` — meaning every directive-bearing block in them is mixed.

That cuts twice. An agent cannot skip rationale by skipping blocks, because four in five blocks
containing something it must do also contain something it does not need. And any fix that separates
them is **a rewrite of those blocks, not a move**.

## Question

Can the rationale be separated from the instructions entirely, rather than merely shortened — and does
separating it actually help, or is the surrounding argument carrying disambiguation that its removal
would destroy?

## Answer

**Split one file as a pilot, measure it, and decide the rest afterwards.**

Move rationale out of `.claude/agents/articles/doc-comments.md` into a sidecar
`doc-comments.rationale.md`, read only when the instruction is being renegotiated and never under a
normal workflow. Stand up Vale report-only alongside it, so the pilot produces a number rather than an
impression.

**Why `doc-comments.md` and not something more valuable.** It has the **highest rationale share in the
corpus at 57%**, so there is the most to move; it is a **topic article read on trigger**, not part of
the unconditional set, so a bad outcome costs little; and it is **49,532 bytes**, big enough for the
result to mean something. The files with the most to gain — `CLAUDE.md` at 48%, `handoffs.md` at 51%,
`engineering.md` at 29% of 62,217 bytes — are deliberately **out of scope** until this works.

### The sidecar tier

**This extends an existing architecture rather than inventing one.**

- **`archive.md` is already this file.** It holds "layers that no longer exist, kept for their method",
  and CLAUDE.md says of it: "No role has a trigger for this one; it is research material." A
  rationale-only article that no role reads under a normal workflow already exists and is accepted.
- **The routing test's rule 4 already puts a sidecar beside its subject** — `<module>.md` next to
  `<module>.ts`. This is that move applied to `.claude/` instead of `src/`.

**How "never read" is enforced, honestly: the same way it already is for nine articles.** Nothing
auto-loads a sidecar and no role file names a trigger for one. Nothing mechanically prevents an agent
reading it, and nothing needs to — the cost being removed is the unconditional load, not the
possibility of a curious reader.

**A closed decision leaves a one-line marker behind. This is part of the split, not an optional
extra.** Some rationale exists specifically to stop a decision being re-litigated. An agent that never
reads it can propose exactly the rejected thing in good faith, which is the one way this split makes
the corpus worse rather than lighter. So a block moved because it records a **closed question** leaves
a marker in the instruction file:

> The `@remarks` split was measured rendering inline and rejected — see `doc-comments.rationale.md`.

**The marker carries the fact of the closed question and never the argument for it**, which keeps it a
pointer rather than rationale. One line per closed decision, not per moved block.

### The Vale setup

**One rule, report-only, scoped to instruction files.** Four reasons, in descending weight: report-only
is an existing concept here (`ast-grep`, `gherkin-dry`, `halstead4ts`, with `engineering.md` carrying
the convention for reading one); Vale parses Markdown to an AST and lints prose nodes only, skipping
code blocks and inline code, which matters on a corpus this dense with them; one rule keeps the first
run actionable rather than delivering ~1,300 findings on day one; and `.vale.ini` can express the
instruction/sidecar split directly.

**The style's rule names, read from `Syntaf/vale-llm-slop`'s `styles/STE/` on 2026-09-08** — twelve:
`Ambiguity`, `Articles`, `Contractions`, `Dictionary`, `Gerunds`, `Modals`, `NounClusters`,
`OneInstruction`, `ParagraphLength`, `PassiveVoice`, `ProcedureLength`, `SentenceLength`. The pilot
enables **`STE.SentenceLength` only** and disables the other eleven. `STE.Dictionary` in particular
must stay off: no open tool ships ASD's copyrighted wordset, and the vocabulary process that would
govern a substitute is deferred to the follow-on candidate.

`SentenceLength.yml` as read the same day: `extends: occurrence`, `scope: sentence`, `max: 25`,
`level: warning`. **`level: warning` means `MinAlertLevel` must be `warning` or lower or the pilot
reports nothing** — a silent-zero failure mode, so assert the run is non-empty before trusting it.

```ini
StylesPath = .vale
MinAlertLevel = warning

[.claude/agents/**/*.md]
BasedOnStyles = STE
STE.Ambiguity = NO
STE.Articles = NO
STE.Contractions = NO
STE.Dictionary = NO
STE.Gerunds = NO
STE.Modals = NO
STE.NounClusters = NO
STE.OneInstruction = NO
STE.ParagraphLength = NO
STE.PassiveVoice = NO
STE.ProcedureLength = NO

[**/*.rationale.md]
BasedOnStyles = Vale
```

**Two facts about `.vale.ini` that make the second section work**, from Vale's own documentation:
sections **stack in the order written** and a file applies every section whose glob matches it, later
winning per key — **except `BasedOnStyles`, which replaces rather than adjusts.** That is what strips
`STE` back off the sidecars in two lines instead of a maintained file list.

**One glob hazard, and this repo has met it from the other side.** Vale's `*` **crosses `/`** — its
docs give `docs/*.md` matching `docs/sub/nested.md`. That is ast-grep's behaviour, not `globSync`'s,
the exact asymmetry CLAUDE.md documents under `ast-grep-rule-check`. A glob written on the `globSync`
intuition **fails open** here: it silently lints files nobody scoped it to, which on this corpus means
the sidecars.

**Vale's sentence count will not match this file's.** `scope: sentence` means Vale does its own
segmentation; the 38.0-word average and 65%-over-25 figures in the parent candidate came from a regex
splitter. **Record Vale's baseline as its own number** rather than reconciling the two, and do not
report a discrepancy between them as a defect.

**Vale is a Go binary, not an npm dependency**, so it does not reproduce from `npm ci` — the same
footgun CLAUDE.md already documents for `typescript-language-server`. Say so wherever the command is
recorded, or a fresh clone reads a skipped run as a clean one.

## Scope

**In:**

1. `doc-comments.md` split into itself plus `doc-comments.rationale.md`, with closed-decision markers.
2. `.vale.ini` and a `.vale/` styles directory carrying the vendored `STE` style, configured as above.
3. A recorded before/after measurement (see Acceptance).
4. Whatever `reference-check` and `agent-doc-check` need to stay green.

**Out, deliberately:** every other file's split; the STE shape rules; the `accept.txt`/`reject.txt`
vocabulary and its guards; the `prose-linting.md` article; any gating on Vale's exit code. All are in
`ste-shape-rules-for-instruction-files`.

## Roles

**`product` does not run on this slice, and that is a deviation from the documented cycle that the
prompt must state explicitly.** CLAUDE.md says `product` opens and closes every slice, but this slice
changes no user-observable behaviour, so SPECIFY has no `.feature` to write and VERIFY has no UI to
black-box. The precedent is measured rather than assumed: `slice/no-undated-cross-file-claims`, a
docs-only slice, carries commits attributed to `architect` (6), `coder` (5), `cleaner` (2), `hardener`
(1) and `orchestrator` (1) — and none to `product`.

**`architect` reviews the split before `hardener`.** Named explicitly because this slice rewrites prose
whose only reviewer is otherwise `hardener` — the gap `orchestrator-prose-has-no-reviewer` files, and
this slice's diff is exactly the kind that gap was filed about. `architect` is the right seat: it
already owns `rules/`, and it would own the vocabulary in the follow-on. This does not resolve that
candidate, it just declines to be its first casualty.

**Ryan is the final reviewer, after `hardener` and after `architect`'s cold read.** See acceptance 7 —
it is a blocking gate on landing, not a courtesy notification, and the orchestrating seat carries it
because no role can reach him. This mirrors the stop `product` SPECIFY already makes for explicit user
sign-off; the difference is only that `product` does not run on this slice, so the stop has nowhere else
to live.

**`hardener` runs `reference-check` and `agent-doc-check` as the gate that matters here.** Stages 3–7
have nothing to act on: no `src/` changed, so property, browser, mutation, crap4ts and dry4ts cannot
move. Stage 1 (`build`) still runs.

## Acceptance

Stated as numbers so "done" is not a judgement call. Measure before and after on the same tree:

1. **`doc-comments.md`'s rationale-only share drops from 57% to under 15%**, by the classifier in the
   parent candidate. Not zero: closed-decision markers and short connective prose legitimately remain.
2. **Its byte count falls by at least 30%.** Below that, the split moved little enough that the mixed
   blocks were not really separated and the result is a rename.
3. **Every moved block is accounted for** — the sidecar plus the instruction file contain every block
   the original had, modulo the rewriting of mixed ones. No block is silently dropped, which is the
   failure a 30% byte drop would otherwise hide.
4. **`npm run reference-check` and `npm run agent-doc-check` pass**, and `npm run build` passes.
5. **Vale runs and reports a non-empty result** on `.claude/agents/**/*.md`, and **reports nothing on
   `*.rationale.md`** — the second is the actual test of the config, and a zero on both is the silent
   failure to look for.
6. **The reading test, which is the point and is not mechanical:** `architect` reads the stripped
   `doc-comments.md` cold and reports whether any instruction became ambiguous once its argument left.
   A yes here outweighs every number above.
7. **Ryan signs off, and this gate is last.** Nothing merges without it: the gate sits between
   `hardener`'s re-run on the rebased branch (merge protocol step 3) and the fast-forward of `main`
   (step 4), so a refusal costs a revert of the slice branch and never a revert of `main`. It comes
   **after** 1–6 because `architect`'s cold read is an input to the decision rather than a substitute
   for it, and because a number is cheap to produce and worthless to sign off on its own.

**What is put in front of him, and what he is being asked.** Four artifacts: the stripped
`doc-comments.md`, the `doc-comments.rationale.md` sidecar, the before/after figures for acceptance 1–5,
and `architect`'s cold-read report verbatim rather than summarised. The question is not "did the gates
pass" — that is acceptance 1–5 and it is already answered. It is **"is the instruction file still the
thing you would want a role to read, and is anything in the sidecar something you would have wanted left
behind?"** That is a judgement about whether the tier is worth having, and it is the only question this
slice actually exists to answer.

**Three outcomes, and only one of them is a merge.** Approve, and the merge protocol proceeds. Ask for
changes, and the slice iterates — the sign-off is re-sought, not assumed carried over. Reject, and the
Rollback below applies: revert rather than patch, because a rejection here is a finding about the tier,
which is worth more than the split.

**Only the orchestrating seat can reach him**, per CLAUDE.md's escalation lanes, so this gate lives in
that seat's hands and in no role's. `hardener` finishing is not the end of the slice, and a handoff that
reads as "all gates green, ready to land" is wrong on this slice unless it also says the sign-off is
outstanding.

## Rollback

One `git revert` of the slice's commits. The split touches one article, its new sidecar, and two config
files; nothing else depends on them, and no gate is newly armed. **If acceptance 6 fails, or Ryan rejects at acceptance 7, revert rather
than patch** — an instruction that needed its rationale is evidence about the tier, not a wording bug,
and the finding is worth more than the split.

## Touches

`.claude/agents/articles/doc-comments.md`, new `.claude/agents/articles/doc-comments.rationale.md`,
`.vale.ini`, a new `.vale/` directory (vendored third-party style — decide its `.prettierignore` and
`.gitignore` status, the same question `src/catalyst/` already answers for vendored source), and
CLAUDE.md's documentation map if the sidecar needs a pointer line.

**Sizing.** Docs and config only. Every path is inside the mutation-invariant allowlist **except
`.vale.ini` and `.vale/`**, which are new top-level paths the allowlist does not name — so the
predicate does **not** hold and stage 5 runs unless the allowlist is amended first, which is its own
decision and not this slice's to make quietly. No design pass triggers fire; all of them are facts
about `src/`.

## Open questions

- **Does an agent that never reads the rationale re-litigate settled decisions?** The closed-decision
  marker is the mitigation and it has no evidence behind it. Whether a bare pointer stops a re-proposal,
  or whether the argument itself is needed, is what acceptance 6 starts to answer. If the marker proves
  insufficient the fallback is not abandoning the tier — it is widening the marker to a one-line _why_,
  which is a larger claim on the instruction file's bytes.
- **How does an agent know it is renegotiating and should read the sidecar?** The topic articles have
  stated triggers. "You are changing this instruction rather than following it" is harder to state
  crisply than "before authoring a `.feature`". A vague trigger means the sidecars are either never read
  when they should be, or read always — and the second restores the cost the split removed.
- **Does `.vale/` belong in the repo or in a machine-global install?** Vendoring makes the run
  reproducible and adds third-party text to the tree; not vendoring makes a fresh clone silently skip.
  The `src/catalyst/` precedent favours vendoring behind an explicit gate exclusion.
- **Does the sign-off gate generalise past the pilot?** It is scoped to this slice deliberately. If the
  tier is adopted and the rollout runs across `CLAUDE.md`, `handoffs.md` and `engineering.md`, asking for
  a human read of each is either the right level of care for the unconditional set or a bottleneck that
  turns three slices into three waits. Worth deciding before the rollout is scoped, not during it.
- **Is the classifier good enough to score acceptance 1?** It agrees with hand labels about 2 in 3
  times. It is fine for ranking files and **not** fine for deciding individual blocks — so the split
  is done by reading, and the classifier is used only for the before/after number. If that number and
  `architect`'s reading disagree, the reading wins.
