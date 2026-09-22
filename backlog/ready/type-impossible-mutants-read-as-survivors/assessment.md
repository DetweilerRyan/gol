---
name: type-impossible-mutants-read-as-survivors
assessed: 2026-09-22
idea-blob: efad941e69e53a70ea7136e1f59acf4e25ea3df0
---

# Assessment — type-impossible-mutants-read-as-survivors

`/idea-assess`, 2026-09-22. Kind: knowledge-bearing (SAFe: exploration enabler). Disposition: Ready.

`LAYER1 backlog/ideas/type-impossible-mutants-read-as-survivors.md: 7 checks, 0 findings`

Layer 1 measured, 2026-09-22: lane ideas, scqa shape, 108 lines, 0 depends-on mention(s), no assessment record.

| Letter      | Score | Finding                                                                                |
| ----------- | ----- | -------------------------------------------------------------------------------------- |
| Independent | 4     | Names no dependency and the reach is a measurement over today's tree; never says so.   |
| Negotiable  | 5     | Three outcomes held open, and the file names the run time that would rule it out.      |
| Valuable    | 4     | Names the decision and what each answer changes; the parent-idea clause has no target. |
| Estimable   | 5     | Bounds the surfaces by name and lists the unknowns that would move the bound.          |
| Small       | 4     | Trips no design-pass trigger; the open questions leave a seam a split could take.      |
| Testable    | 4     | Names the question and a two-part probe method; never says where the record lands.     |

## The slice check

Not exempt. The title states a decision to be made rather than a verdict already reached, so it is no `REFUTED`
or `DECLINED` record. The file never says of itself that it is not work, and it proposes no children, so it is
no index.

## The kind check

Would a `product` VERIFY pass have anything to observe? No. The file's Answer commits to a measurement whose
recorded outcome then selects among three follow-on actions — enable the checker, give
`.claude/agents/articles/mutation-testing.md` a type-impossible ruling shape beside its equivalent-mutant one,
or both. A finished state that is a recorded answer to a named question is knowledge-bearing, so V and T score
against that column and the frontmatter label is `spike`.

The file's own last open question asks whether it is a spike or an enabler-technical slice. That is this check's
question, and it is ruled here: spike. The alternative reading — enabler-technical, on the ground that the
intended diff lands in `stryker.config.json`, `stryker.scripts.config.json` and `package.json` — would score a
configuration change the file deliberately declines to commit to. Its Complication says outright that the share
of type-impossible mutants in this tree is unmeasured, and that two named facts cut against a large win.

Because the candidate is itself the spike, no separate Spike disposition follows. There is nothing to split off:
the measurement is the whole proposal.

## Independent

The file names no dependency, and Layer 1 counted zero depends-on mentions on 2026-09-22. The stated reach
supports that reading: classifying a survivor list against `tsc -b` and timing a run with the checker wired in
are both operations on the tree as it stands, and the upstream plugin facts the Situation cites were read from
published documentation rather than waiting on any slice here. The anchor for 5 asks the file to state that it
waits on nothing, and this one never does. The gap is a missing sentence, not a dependency.

## Negotiable

The Situation and Complication state the need without committing to a fix, and the Answer offers three outcomes
rather than one: enable the checker, document a type-impossible ruling shape, or both. The file goes further and
names what would rule the idea out on its own terms — the first open question records that the mutation stage is
already the slowest gate in the sequence, and that an unacceptable run time decides the matter with no
triage-cost figure needed. The Complication supplies a second self-refutation: the checker's overrides relax
`noUnusedLocals` and `noUnusedParameters`, which all three leaf tsconfigs set to `true`, so a mutant that merely
strands a local or a parameter keeps surviving. A file that argues against its own premise this explicitly
satisfies the top anchor.

## Valuable

The decision is named and what waits on it is named: whether to pay the checker's per-mutant cost on every run,
and what `cleaner` and `hardener` do with a survivor that no test can kill. The file states what each answer
would change — the article gains a ruling shape, or the configs gain a `checkers` entry, or both — and it
carries the consequence through to the `break` thresholds recorded in force at 85 for `src/` and 95 for
`scripts/`, which it says would be re-read against a new denominator rather than kept.

The anchor for 5 asks that the parent idea's blocked letters be named. This spike has no parent. It is a
standalone decision spike rather than a readiness spike raised against another candidate, so that clause has no
target and cannot be met. Read 4 as the ceiling available to this file, not as a deficiency in it.

## Estimable

The size is bounded by name rather than by area. The file identifies the two Stryker configs and their mutate
globs, the absent `@stryker-mutator/typescript-checker` dependency in `package.json` (verified in the file on
2026-09-22 against `@stryker-mutator/core` ^10.0.0), the solution-file `tsconfig.json` with its three
references, the two `break` thresholds, and the article plus sidecar that would carry a documentation outcome.
The No-gos fence off the acceptance-mutation runner, the incremental cache's contents, the sandbox exclusions
and the mutation-invariance allowlist. Nine open questions then name the unknowns that could move the bound,
including the run-time cost on this tree, whether `--build` mode over the solution file survives the Stryker
sandbox given that `ignorePatterns` keeps `features/` out of it, and whether both configs or one earn the cost.

## Small

Against CLAUDE.md's design-pass checklist the reach trips nothing. A spike writes no product code, so there is
no refactor without behavior change, no module created, moved or split, no crossing of the framework-free module
to hook to component layering, no oversized target file, and no span across three or more modules.

The anchor for 5 asks that a split would have nothing to separate, and there is a visible seam. The file's own
open questions carry probes that do not share a run: classifying survivors by compilability and timing a wired
run are two halves of one pass, but whether the incremental cache holds a `CompileError` verdict across runs is
a separate investigation again. That seam is a candidate for a follow-on rather than a reason to split this
slice now, so it holds the letter at 4 rather than making it a blocking finding.

## Testable

The question is named in the Question section, and the probe method is named in the Answer: classify one
full-scope survivor list by whether each mutant compiles under `tsc -b`, then time the same run with the checker
wired in. The answer shape is checkable from those two probes — a share of the survivor list, and a run-time
delta against the current mutation stage.

What is missing is the top anchor's clause: the file never says where the record will live. Its nearest sentence
is the open question asking which file carries the ruling shape, the article's survivor section or the sidecar
behind it, and that question is about where the outcome's documentation lands rather than where the spike's own
findings are recorded.

## What happens next

Promote. `/idea-promote` moves the file to `backlog/ready/type-impossible-mutants-read-as-survivors/` and writes
`kind: spike` into the proposal; a spike runs no role pipeline and closes by recording its answer in
`findings.md`.

## The human ruling

Ruled 2026-09-22.

Independent — agree.
Negotiable — agree.
Valuable — agree.
Estimable — agree.
Small — agree.
Testable — agree.
