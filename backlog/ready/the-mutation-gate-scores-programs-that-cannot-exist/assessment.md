---
name: the-mutation-gate-scores-programs-that-cannot-exist
assessed: 2026-09-22
idea-blob: bf663bb9bc08449645de6bc6c937f6d2da6ff955
---

# Assessment — the-mutation-gate-scores-programs-that-cannot-exist

`/idea-assess`, 2026-09-22. Kind: checker-bearing, sub-kind `enabler-technical` (SAFe: architecture or
infrastructure enabler). Disposition: Ready.

`LAYER1 backlog/ideas/the-mutation-gate-scores-programs-that-cannot-exist.md: 7 checks, 0 findings`

Layer 1 also measured, on 2026-09-22: lane `ideas`, SCQA shape present, 77 lines, 0 `depends-on` mentions.

The slice check cleared: the file is neither a verdict record nor a self-declared index. The kind check asked
whether a `product` VERIFY pass would have anything to observe. It would not — every finished state the file
names is a Stryker reading or a config key. V and T are therefore scored against the checker-bearing column.
The sub-kind resolves at this file's level, unlike its parent's: the committed diff lands in `package.json`
and the two Stryker configs, which is the tree the gates measure. The one instruction file the parent thread
would have reached, `.claude/agents/articles/mutation-testing.md`, is fenced out by this file's own No-gos and
routed to the sibling process enabler.

| Letter      | Score | Finding                                                                                         |
| ----------- | ----- | ----------------------------------------------------------------------------------------------- |
| Independent | 4     | Names the parent spike as its one dependency; it has landed, verified in the tree 2026-09-22.   |
| Negotiable  | 4     | Answer marked "shaped, not specified"; five open questions live; the Question invites a split.  |
| Valuable    | 5     | Names the unconcludable investigation, cites 11 live instances, dated and measured 2026-09-22.  |
| Estimable   | 4     | Bounds the committed thread to three named files; the guard half bounds to a slice or nothing.  |
| Small       | 3     | Trips one design-pass trigger, and the file names it as the separable half. Ruled out of scope. |
| Testable    | 5     | Names the check, both readings, and the confident zero the exclusions create.                   |

## Independent

The file names one dependency: `slice/type-impossible-mutants-read-as-survivors`, and states both that it has
landed and that nothing in the tree changed as a result. Both halves check out against the working tree as read
on 2026-09-22. `backlog/done/type-impossible-mutants-read-as-survivors/` holds `proposal.md`, `assessment.md`,
`findings.md` and `research.md`. Neither `stryker.config.json` nor `stryker.scripts.config.json` carries a
`checkers` key, and `package.json` names no `@stryker-mutator/typescript-checker`.

Layer 1 counted 0 `depends-on` mentions, consistent with a file whose one dependency is already retired.

The No-gos name a second slice, the sibling process enabler
`backlog/ideas/a-survivor-no-input-can-distinguish-has-no-ruling.md`, and assert that both land on one branch
and merge together. That is a merge convenience rather than a precondition, and the file frames it as such —
"the split is about which pipeline runs, not about when either ships". Read the other way round, the sibling's
own file states that its need outlives adoption, so neither blocks the other's finished state.

Anchor 4 rather than 5: the file names dependencies, each landed or demonstrably optional, rather than
declaring that it waits on nothing.

## Negotiable

The Situation and Complication state the need before any solution appears, and the Answer is labelled "Shaped,
not specified". Five open questions are left live, including two the parent spike declined to close.

The Question does not assert a scope — it hands the scope ruling to this assessment, naming both failure
directions ("Folding it in risks it riding along unjudged; splitting it risks never writing it"). That is a
file offering its own shape as open rather than committed.

The No-gos fence rather than close. They record that adoption itself was measured, reviewed by `architect`,
and ruled by the user on 2026-09-22, which is a user ruling correctly held out of the judge's reach rather
than a solution the author decided.

Anchor 4 rather than 5: nothing says what would rule the whole idea out on its own terms. The file comes close
on the separable half alone — "Written today it would fire on five files that correctly report `n/a`, so it
guards against drift rather than against anything currently wrong" names the ground for declining that thread,
not the file.

## Valuable

Scored against the checker-bearing column.

The file names the false claim that survives without the work, and it is a claim about a running gate rather
than about a user. `.claude/agents/articles/mutation-testing.md` requires naming an input at which the two
programs differ before a survivor may be closed. For a type-impossible mutant no such input exists, so the
investigation a role opens cannot conclude on the article's own terms, and the role cannot tell in advance
which survivors those are.

The cost is stated rather than asserted: about one survivor investigation in five is unwinnable, and the cost
recurs on every run until the gate stops generating them. Live instances are cited and attributed to the
parent spike's 2026-09-22 measurement — 11 of 61 survivors across both configs, 6 of 23 on `src/` and 5 of 38
on `scripts/`, with 261 verdicts independently checked, no false verdict, and a negative control that passed
60 of 60. That reaches anchor 5: a live instance, dated and measured.

The value is not evenly held across the file's two threads, and the file says so itself. The guard for a file
reporting `n/a` has no live failure at all — "Today that costs nothing, since all 9 such mutants deserve their
exclusion." A candidate carrying only that thread would score the checker-bearing anchor 2 at best: a failure
class asserted with no instance. That asymmetry is not a V finding against this file, which is honest about it.
It is the evidence behind the Small ruling below.

## Estimable

The committed thread bounds to three named files: `package.json` and the two Stryker configs. The threshold
question resolves cheaply against the tree — `stryker.config.json` carries `break: 85` and
`stryker.scripts.config.json` carries `break: 95`, against post-adoption scores of 98.41 and 98.62 as the
parent spike measured them on 2026-09-22, so no threshold move is forced and the question is a ruling to
record rather than a surface to change.

The file names the unknowns that could move the bound, which is anchor 5's clause. Two are checkable and check
out as live questions rather than settled ones. `npm run test:mutation:scripts` carries no `--incremental`
today, and `.claude/references/merge-protocol.md` already anticipates the second cache file — its step 5
states that adding the flag re-arms the deletion and requires `reports/stryker-incremental-scripts.json` in
the `rm -f` block. So that open question has a written answer waiting for it.

Two things hold E at 4 rather than 5.

First, the guard half's bound is genuinely wide rather than merely uncertain. "A gating program in `scripts/`,
subject to CRAP 6 and its own suite" and "the report is legible enough that the machinery costs more than it
returns" are a slice and no slice, not two readings of one size. The unknown is named, so E does not fall
further, but that is not a bound a design-pass checklist could run against.

Second, one named unknown reaches across a pipeline boundary the file does not rule. The open question "Does
`hardener`'s own file need to say what stage 5 now measures" names a role file. CLAUDE.md's no-role-edits rule
puts `.claude/agents/hardener.md` in the process corpus, so an `enabler-technical` slice cannot answer that
question by editing it, the way the No-gos already route `mutation-testing.md` to the sibling. The companion
half of the same question is inside this slice's reach: `mutation-invariance.config.json` is a config file,
and its `scope` field carries the `src/`-scoped reading in prose.

## Small

This is the letter the file's Question asks about, and the ruling is that the second thread does not belong
here.

Against the design-pass trigger list in CLAUDE.md, the committed thread trips nothing. Adopting the checker
adds a dependency and two config keys. It creates no module, moves or splits none, crosses no
framework-free → hook → component layering, spans no three modules, and names no oversized file. Taken alone
that is anchor 4.

The separable half trips exactly one trigger, and only conditionally: if the guard becomes a gating program in
`scripts/`, the slice creates a new module. The file names that trigger itself, in both the Question and the
Answer, and labels the thread separable. Anchor 3 is the fit for the file as written.

**The ruling on the Question.** The guard does not travel with this slice. Three findings carry it. Its
Valuable is anchor 2 by the file's own account, against this slice's anchor 5, and folding it in is exactly
the "riding along unjudged" the author warned about. Its Estimable is a slice-or-nothing where the committed
thread's is three named files. Its own finished state is unwritten — the file's third open question asks "What
does the guard assert, given every dark file today is correctly dark?", which is a Testable this slice would
inherit at anchor 1 rather than at the 5 it earns below.

The thread already has a home named for it. The parent epic's assessment, recorded 2026-09-22 in
`backlog/ideas/mutation-runs-score-programs-typescript-forbids.assessment.md`, named three children and
specified this one as its third — "A mutation run scores a file it never mutated", flagged as the weakest and
separated out precisely so its thin V could be judged rather than carried. That child was never captured as
its own file; the thread was folded here instead. The ruling is to capture it, not to fold it.

This is therefore not an Epic ruling. The file does not commit to two deliverables — its Answer commits to
adoption and holds the guard out as a question. A file that asks whether a thread belongs, and is answered no,
is one slice with a question resolved rather than an index over two.

## Testable

Scored against the checker-bearing column, and the committed thread reaches anchor 5 outright.

It names the check: `npm run test:mutation` and `npm run test:mutation:scripts`. It names the reading on
2026-09-22 — 98.65 on `src/` and 98.94 on `scripts/`, with 61 survivors of which 11 are type-impossible. It
names the reading afterwards — 98.41 and 98.62, with 636 of 1706 `src/` mutants and 1189 of 3587 `scripts/`
mutants marked `CompileError` and excluded, and the 11 unwinnable survivors no longer generated. The direction
of change is stated in both figures and in the survivor count.

It then names what would make a reading a confident zero, which is the anchor's top rung: five `src/` files end
up with every mutant excluded and report `n/a`, and neither the score nor the survivor list can tell that apart
from a file whose every mutant was killed.

Note what that passage does and does not do. Naming the confident zero is what anchor 5 asks of this file, and
the file does it. Building a guard against it is a different deliverable, with its own unwritten reading — the
Small ruling above sends that to its own candidate. T=5 is earned by the naming, not withheld for the missing
guard.

## What happens next

Promote to `backlog/ready/the-mutation-gate-scores-programs-that-cannot-exist/`, carrying the adoption thread
alone; the guard thread is ruled out under Small and is captured as its own candidate before promotion.

## The human ruling

Ruled 2026-09-22.

Independent — agree.
Negotiable — agree.
Valuable — agree.
Estimable — agree.
Small — differ. The dark-file guard travels with this slice. Ruled to run all of the enablers within one
slice; the guard rides as scoped rather than being captured as its own candidate.
Testable — agree.
