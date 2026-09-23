---
name: mutation-runs-score-programs-typescript-forbids
assessed: 2026-09-22
idea-blob: e9ff668cbfc84e49b3abb62b3bbdc85fc21768b2
---

# Assessment — mutation-runs-score-programs-typescript-forbids

`/idea-assess`, 2026-09-22. Kind: checker-bearing (SAFe: architecture or infrastructure enabler). Disposition:
Epic.

`LAYER1 backlog/ideas/mutation-runs-score-programs-typescript-forbids.md: 7 checks, 0 findings`

Layer 1 also measured, on 2026-09-22: lane `ideas`, SCQA shape present, 92 lines, 0 `depends-on` mentions.

The kind check asked whether a `product` VERIFY pass would have anything to observe. It would not: every
finished state this file names is a command's reading or an instruction file's text. V and T are therefore
scored against the checker-bearing column. **The sub-kind does not resolve at this file's level**, and that is
part of the Small finding rather than a separate one — two of the three threads land in the tree the gates
measure (`enabler-technical`) and one lands in the instructions that run them (`enabler-process`).

| Letter      | Score | Finding                                                                                      |
| ----------- | ----- | -------------------------------------------------------------------------------------------- |
| Independent | 4     | Names one dependency, the parent spike, and it has landed; verified in the tree 2026-09-22.  |
| Negotiable  | 4     | States the need, marks the Answer "shaped, not specified", leaves five open questions live.  |
| Valuable    | 5     | Names the false claim, cites 11 live instances, dated and measured 2026-09-22.               |
| Estimable   | 4     | Bounds each thread's surface and names the unknowns; the third thread's bound stays wide.    |
| Small       | 2     | Three deliverables, three surfaces, two sub-kinds. No ordering of behavior-preserving steps. |
| Testable    | 3     | Adoption's reading is named to the anchor's top; the ruling shape names no check at all.     |

## Independent

The file names one dependency: `slice/type-impossible-mutants-read-as-survivors`, and states it has landed
with no change to the tree. Both halves check out on the working tree as read on 2026-09-22.
`backlog/done/type-impossible-mutants-read-as-survivors/` holds `proposal.md`, `assessment.md`, `findings.md`
and `research.md`. Neither `stryker.config.json` nor `stryker.scripts.config.json` carries a `checkers` key,
and `package.json` names no `@stryker-mutator/typescript-checker`.

Layer 1 counted 0 `depends-on` mentions, consistent with a file whose one dependency is already retired.

Anchor 4 rather than 5: the file names a dependency and it has landed, rather than declaring that it waits on
nothing. The internal ordering among the three threads is stated in the Answer and is not an external
dependency — the Epic split resolves it by giving each thread its own slice.

## Negotiable

The Situation and Complication state the need at length before any solution appears. The Answer is labelled
"Shaped, not specified, and the ordering is the only part worth holding", and the Question hands the split
ruling to this assessment rather than asserting one. Five open questions are left live, including two the
parent spike deliberately declined to close.

The No-gos fence scope rather than close negotiation: they record that adoption itself was ruled by the user
on 2026-09-22 and is not re-litigable here, which is a user ruling correctly held out of the judge's reach
rather than a solution decided by the author.

Anchor 4 rather than 5: nothing in the file says what would rule the whole idea out on its own terms. The
closest it comes is the dark-file thread, where it states that all 9 of today's dark mutants deserve their
`n/a`, so a guard written now would fire on five correctly-silent files. That names the ground for declining
one thread, not the file.

## Valuable

Scored against the checker-bearing column. The file names the false claim that survives without the work: a
type-impossible survivor that a role cannot tell apart from a genuine coverage gap, whose investigation
`mutation-testing.md`'s own rule leaves with no valid ending, because no input exists at which the two
programs differ.

Live instances are cited and attributed to the parent spike's 2026-09-22 measurement: 11 of 61 survivors
across both configs, 6 of 23 on `src/` and 5 of 38 on `scripts/`, with 261 verdicts independently checked and
no false one under a negative control that passed 60 of 60. That reaches anchor 5 — a live instance, dated and
measured.

The value is not evenly held across the three threads, and the split should carry that. Threads one and two
(adopt the checker; rule a type-impossible survivor) carry the whole of the evidence above. The third, the
dark-file guard, has no live failure at all by the file's own account — it guards drift, and the file says so
plainly. A child candidate carrying only that thread would not inherit this score.

## Estimable

The file bounds each thread's reach in named surfaces rather than areas. Adoption reaches two Stryker configs
and `package.json`. The ruling shape reaches `.claude/agents/articles/mutation-testing.md` or its sidecar —
one of two named files. The guard reaches either a new `scripts/` program or nothing.

It also names the unknowns that could move those bounds, which is anchor 5's clause: whether the ruling
argument must be made against the repo's own compiler config rather than the checker's relaxed one, whether
`hardener`'s own file must state that stage 5 now measures something different, and whether the
mutation-invariance allowlist's `src/`-scoped reading moves.

Scored 4 rather than 5 because one bound is genuinely wide rather than merely uncertain. "A gating program in
`scripts/`, subject to CRAP 6 and its own suite" and "the report is already legible enough" are not two
readings of one size. They are a slice and no slice. The unknown is named, so E does not fall further, but the
bound it leaves is not one a design-pass checklist could run against.

## Small

This is the blocking letter, and the file asked for exactly this ruling.

The stated reach is three deliverables. Wire the checker into both configs. Give a role a shape for closing a
type-impossible survivor. Make a file whose every mutant was excluded visible rather than silently `n/a`. They
land in three different surfaces, and the file names the shared cause as the only thing they share.

Two of them carry different `kind:` labels, and therefore different pipelines: the config and guard work lands
in the tree the gates measure, the ruling shape lands in the instructions that run the gates. One slice cannot
carry both labels, and a single `ready/` folder would have to pick one and mis-route the rest.

The ordering the Answer holds is a priority ordering across independent deliverables — which one delivers on
its own, which is not a precondition — rather than an ordering of behavior-preserving steps inside one slice.
Anchor 2 is the fit: two or more design-pass triggers tripped, and no such ordering named.

**The Epic test.** Each child would score better on its own terms. The adoption child inherits the V=5 and the
T=5 evidence intact and sheds this file's S and T drag. The ruling-shape child gets an S and an E it cannot
have while sharing a file with a config change, and its weak T becomes its own named problem to solve rather
than an average. The guard child separates out precisely so its thin V can be judged rather than carried. The
children do not inherit the same low scores, so this is a split and not an under-examined file.

## Testable

Scored against the checker-bearing column, and the score is an aggregate over threads that sit far apart.

Adoption reaches anchor 5 outright. It names the check (`npm run test:mutation` and
`npm run test:mutation:scripts`), its reading on 2026-09-22 (98.65 on `src/`, 98.94 on `scripts/`), its
reading afterwards (98.41 and 98.62), and the exclusion counts behind the move (636 of 1706 mutants on `src/`,
1189 of 3587 on `scripts/`). It then names what would make a reading a confident zero — a file whose every
mutant is excluded reports `n/a`, which the score and survivor list cannot distinguish from a file whose every
mutant was killed. That last clause is the anchor's top rung, stated in the file's own words.

The ruling shape names no check whatsoever. Its finished state is an article edit, and nothing in the file
says how a reader would tell a working ruling shape from a written one — no gate goes red, no reading moves.
That is anchor 1 for that thread, and it is the thread the Answer calls the only one that delivers on its own.

The guard sits between them: the failure it would catch is named precisely, but the file leaves open whether
the check is a program or a human reading a report, which is the same unknown E already carries.

T=3 is the file's aggregate — the check and the direction of change are named, without one reading that
covers the whole. Each child should be re-scored on its own thread rather than inheriting this number.

## What happens next

The file stays in the `ideas/` lane as an index and gets no `ready/` folder. It splits into three child
candidates, each captured as its own idea file and assessed on its own before any promotion:

1. **Adopt the Stryker TypeScript checker** — enabler-technical. Wires `@stryker-mutator/typescript-checker`
   into `package.json` and both Stryker configs, rules deliberately whether the `break` thresholds still
   encode what they were set to encode, and carries the one-line incremental-cache argument the parent file
   already worked out. It also owns the parent's fourth open question, since adoption is what changes what
   `hardener`'s stage 5 measures and what the mutation-invariance allowlist's `src/`-scoped reading covers.
   This child inherits the parent's Valuable and Testable evidence intact.

2. **A ruling shape for a type-impossible survivor** — enabler-process. Gives `mutation-testing.md` a shape
   for closing a survivor no input can distinguish, covering both the 11 survivors standing on 2026-09-22 and
   the TS6133 class that outlives the checker. It carries three of the parent's open questions: where the
   shape lives, whether the argument must be made against the repo's own compiler config, and whether a
   `CompileError` whose only error sits in a test file needs its own entry. Its own Testable is the thing it
   must solve rather than inherit.

3. **A mutation run scores a file it never mutated** — enabler-technical, and the weakest of the three. Asks
   whether a file reporting `n/a` needs a guard at all, and whether that guard is worth a `scripts/` program
   under CRAP 6 with its own suite. Its assessment may well rule Spike or Not worth doing, and separating it
   out is what makes that ruling possible.

The parent's No-gos travel to all three children unchanged: none of them revisits whether to adopt, and none
reaches the acceptance-mutation runner.

## The human ruling

None recorded.
