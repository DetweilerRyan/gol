---
name: the-idea-template-claims-the-whole-board
assessed: 2026-09-22
idea-blob: c166b0748268cc13843b6f8a4b20bb853990c80a
---

# Assessment — the-idea-template-claims-the-whole-board

`/idea-assess`, 2026-09-22. Kind: enabler-process (SAFe: architecture or infrastructure enabler).
Disposition: Ready.

`LAYER1 backlog/ideas/the-idea-template-claims-the-whole-board.md: 7 checks, 1 findings`

Layer 1 measured the lane as `ideas`, the shape as SCQA, the length as 160 lines, and 0 depends-on
mentions. Its one finding is that the prior assessment record was stale — that record was taken
2026-09-21 against blob `6b3ae86`, and the idea file now hashes to `c166b07`. Those are
measurements and they score nothing. This record replaces the 2026-09-21 one whole.

The slice check passes. The title is imperative rather than a `REFUTED` or `DECLINED` verdict, and
the file opens by naming itself the corpus child of a split rather than by declaring itself an
index.

The kind check asks whether a `product` VERIFY pass would have anything to observe. It would not.
The stated diff lands in `CLAUDE.md`, `.claude/references/pipelines.md`,
`.claude/skills/idea-assess/SKILL.md`, `.claude/skills/idea-capture/SKILL.md` and
`backlog/TEMPLATE.md` — the instructions that run the gates rather than the tree the gates measure.
Two citations under `scripts/` travel with it, carried by the bounded deviation the Answer's fourth
bullet proposes. That reach does not move the label: the deviation changes no behaviour, and the
cycle it runs inside is the process pipeline's. V and T are scored against the checker-bearing
column.

| Letter      | Score | Finding                                                                                     |
| ----------- | ----- | ------------------------------------------------------------------------------------------- |
| Independent | 4     | The one named dependency landed; the declaration-field reach is now measured, not asserted. |
| Negotiable  | 4     | States the need, marks three bullets as user acts, holds eleven questions open; no refuter. |
| Valuable    | 5     | Four false or stale claims, each cited by path, each dated, and each held when checked.     |
| Estimable   | 5     | Bounds the rename, five citations and three amendments, and names five unknowns.            |
| Small       | 4     | Trips no design-pass trigger; the deviation and the sweep question each give a split edge.  |
| Testable    | 4     | Names the check and its confident zero honestly; the prose half has no named check at all.  |

## Independent

The file names one dependency and it has landed. `one-item-shape-serves-every-lane` sat in
`backlog/done/` when this record was taken on 2026-09-22, so the ordering the file declares — that
it runs second — is satisfied on this tree.

The 2026-09-21 record held this letter at 3, because the file then asserted that the sibling's lane
declaration would name the old template and that the cycle could reach it. Both halves were
measured false. The revision repairs that, and repairs it by measurement rather than by deletion.
The Complication now states, dated 2026-09-22, that `board-lanes.config.json` declares a flat lane
as its shape alone, that `lane-declarations.ts` rejects a flat lane whose key count is not one, and
that `schemas/board-lanes.schema.json` forbids additional properties. It reports a probe: adding a
template key made the classifier report every board path as declarations-unavailable. All four held
when checked on this tree — the config declares `ideas` as `{ "shape": "flat" }`,
`lane-declarations.ts` refuses a key count other than one, and the schema sets
`additionalProperties: false`.

The file then routes the consequence correctly. Widening the schema is a `scripts/` change its own
first No-go refuses, so the machine-readable pairing moves out of the Answer and into an open
question that names what would justify the slice. Nothing unlanded is waited on.

Anchor 4 is the fit: the dependency is named and it has landed. Anchor 5 asks the file to state that
it waits on nothing, and this one does not say that in its own words — it states an ordering
against a sibling and leaves the reader to check the lane.

## Negotiable

The file states the problem before it states any answer. The Situation carries the ambiguity, the
sweep and the two stale statements; the Complication separates the half that is a matter of taste
from the half that is not, and separates the defect this idea adopts from the ones it creates; the
Question asks what the template becomes rather than announcing it.

The Answer is marked "Shaped". Three of its seven bullets are attributed to the user — two as
rulings taken 2026-09-21 during the parent's shaping, one as a proposal made 2026-09-22. A user
ruling is a decided constraint rather than a closed solution, and the remaining four bullets read as
offered. Eleven open questions follow, and several hold a real decision open: where the renamed
template sits, whether the pairing ever becomes machine-readable, whether the no-test clause fails
alongside the no-checker one, whether one false clause implies a sweep of the board section, and
whether the shared basename deserves a candidate of its own.

What the file still does not do is say what would rule the idea out on its own terms. The nearest
thing is the question about the shared basename deserving its own candidate, which is a scope
question rather than a refutation condition. That is the distance between anchor 4 and anchor 5,
and it is the same gap the 2026-09-21 record named.

One inconsistency of tense is worth a correcting clause at SPEC rather than a lower score. The
Complication says "The rest arrives with the sibling" and frames the positional prose as stopping
being true when a lane declares its own item shape. The sibling landed on 2026-09-21, so that prose
is false now rather than later. The file's own fourth-from-last open question says exactly that, so
the file holds both readings at once.

## Valuable

Scored against the checker-bearing column. The file names four claims that are false or stale, each
at a path, each dated, and each held when checked on this tree on 2026-09-22.

`CLAUDE.md` states that `backlog/` has no gate, no checker, and no test beyond the advisory `Board`
Vale style. The board-shape hook ships at `scripts/board-shape-hook/`, `.claude/settings.json`
registers it on two write events, and `run.ts` states in its own header that it always exits zero
because the board has no gate. The no-checker clause is false and the no-gate clause beside it is
true, which is the split the file's last Answer bullet describes.

`.claude/references/pipelines.md` states that the board classifier classifies by position rather
than by basename. `board-shape.ts` opens by stating the opposite in part: classification runs on two
axes, the lane axis looked up by name against a declared map and the artifact axis staying
positional. The reference's claim is therefore already false as written, not merely false once
something else lands.

`.claude/skills/idea-assess/SKILL.md` instructs the judging pass to stop when Layer 1 reports
without having measured, and enumerates four such cases — no `LAYER1` line, a path-missing line, a
non-candidate line, and an off-the-board line. `board-shape.ts` emits a fifth, the
`lane declarations unavailable` line, and that case is named nowhere in the list. A judge told to
stop on the four has no instruction covering the fifth. The instance is live against this very
invocation.

The basename ambiguity holds too, and the file states it as a confident zero rather than as a
nuisance. `reference-check` matches by basename against the live tree, `adr/TEMPLATE.md` stands and
No-go 4 declines to rename it, so a stale `backlog/TEMPLATE.md` citation keeps resolving after the
rename and the gate stays green while sending the reader to the wrong form.

The sweep the file reports also holds. Five citations of the shared basename sit outside the board's
own idea and done files: `CLAUDE.md`, `.claude/references/pipelines.md`,
`.claude/skills/idea-capture/SKILL.md` as a step the skill executes,
`scripts/board-shape-hook/board-shape.meta.md`, and `scripts/board-shape-hook/board-shape.test.ts`,
which names the path both as an argument and inside the output string it asserts. The bare one in
`adr/README.md` is named in the Situation and declined in No-go 4.

The 2026-09-21 record held this letter at 4 because one of the file's own figures did not hold — it
claimed the hook's directory carried three test files where it carried six. The revision drops the
numeral and says the directory carries its own test files, so no count remains to rot. The same
revision retires the sidecar-count instance correctly: No-go 2 records that
`a-reader-finds-a-sidecar-without-an-inventory` landed on 2026-09-22 and resolved both surfaces by
deleting the enumerations, and that slice sits in `backlog/done/` on this tree.

Anchor 5 is the fit: live instances, cited, dated, and measured.

One imprecision to correct at SPEC without moving the score. The Situation says the pipelines
reference "gives four properties as the argument" for the positional rule. The four properties in
that file argue that a per-item artifact carries no frontmatter; the classifier's
position-over-basename statement is a separate sentence further down. SPEC should amend the sentence
the file means rather than the one it cites.

## Estimable

The file bounds the size well enough to run the design-pass checklist, and it names the unknowns
that could move the bound. The reach is one file rename, five citations at named paths, and three
prose amendments at three named files — the board section's clause in `CLAUDE.md`, the positional
prose in `pipelines.md`, and the stop-rule list in `idea-assess/SKILL.md`.

The 2026-09-21 record held this letter at 4 for one unbounded surface: the rename strands citations
under `scripts/`, and the first No-go excluded `scripts/` from the cycle without accounting for
them. The revision closes that. It names both citations exactly, proposes a one-off deviation that
carries them, names the roles that run it — a `coder` pass and a `cleaner` pass inside the process
cycle — names what `coach` REVIEW rules and what it does not, and weighs the alternative of a
follow-on technical slice. The first No-go is rewritten to admit that one bounded reach rather than
to contradict it.

Five unknowns are stated as open questions: where the renamed template sits, whether the pairing
becomes machine-readable and what would justify that slice, whether the rename lands before or with
the `scripts/` fix, whether the no-test clause fails alongside the no-checker one, and whether the
board section wants a sweep. Anchor 5 is the fit.

## Small

None of the five design-pass triggers in `CLAUDE.md` fires. All five turn on the shape of `src/` — a
behavior-preserving refactor, new or moved modules, a crossing of the framework-free to hook to
component layering, an already-oversized target, or three or more modules — and this slice's diff
lands in corpus prose, one board file, and two string citations under `scripts/`. Neither `scripts/`
file is a new or moved module. Anchor 4 is the fit.

Note that the design pass runs regardless of these triggers. `CLAUDE.md` rules it required in the
Enabler pipeline, since an Enabler has no `product` SPECIFY. For a process enabler that gate is
`coach` SPEC.

The score is held at 4 rather than 5 because two things give a split an edge to cut on. The
deviation is structurally a second unit of work inside one cycle, needing its own spec item, its own
two role passes, and its own review clause. And the eleventh open question could grow the reach: if
reading the whole board section against the tree turns up a second stale claim, the slice becomes a
sweep rather than three named amendments. The file leaves both as questions rather than as scope,
which is the right call, but the bound is therefore not tight enough that a split would have nothing
to separate. Its own ordering question — does the rename land before or with the `scripts/` fix —
names the seam.

## Testable

Scored against the checker-bearing column.

The file names the check, `npm run reference-check`, and it is now honest about what that check
reads. The 2026-09-21 record held this letter at 3 because the file then claimed the rename was
self-policing for prose. The revision withdraws that claim and replaces it with the opposite,
measured: nothing polices the rename, a stale citation still resolves because `reference-check`
matches by basename and No-go 4 leaves `adr/TEMPLATE.md` standing, so the gate passes while sending
the reader to the wrong form. The citations have to be swept by hand and checked by reading, and a
missed one fails silently rather than loudly. That is a confident zero named, dated and measured,
which is what anchor 5 asks for on top of anchor 4.

What holds the score at 4 is a gap on the other side. For a checker-bearing kind the finished state
is a check's reading, and this slice has no check whose reading moves. `reference-check` reads green
before and after, by the file's own account. The three prose amendments — the false no-checker
clause, the positional prose, and the stop-rule list — name no check at all, and none of
`prose-lint`, `agent-doc-check` or `reference-check` would change its reading over any of them. The
finished state is verifiable, but by `coach` REVIEW reading the landed corpus against the signed
spec rather than by a command's exit code. The file names that review for the deviation and does not
name it for the amendments.

This is not ruled blocking. The process pipeline's closing gate is a role reading against a signed
spec, and the file names the spec as the thing the user signs. What is missing is the sentence
saying so for the prose half.

## What happens next

Promote. The disposition follows the written findings rather than the numbers. No finding says this
is more than one slice — the deviation is two string edits with its owning role named, and the file
weighs the follow-on-slice alternative on the record. No blocking finding turns on knowledge nobody
has: the open questions that could look like spikes are decisions rather than measurements, and the
file says so itself about the no-test clause. V rules the idea in rather than out, with four live
instances that each held when checked.

Three items travel with the promotion for `coach` SPEC to settle before writing the edit list.

First, the renamed template's location. Three forms are named — the board root, a templates
directory, a path named only inside the declaration — and the second is now impossible, since
`board-lanes.config.json` cannot carry a template key. SPEC picks from the remaining two, or the
user rules it.

Second, two corrections to the file's own prose. The Complication's "arrives with the sibling"
frames as future a staleness that is present, and the Situation's "four properties" attributes the
positional argument to the wrong sentence in `pipelines.md`.

Third, the deviation's spec item. The file's own open question states what it owes: the two files,
the bounded change, the ordering against the rename, and the review it answers to. That is what the
user signs, and executing a deviation nobody wrote down is what this corpus refuses elsewhere.

One item is explicitly not this slice's. The third open question parks a reversed user ruling — the
2026-09-21 ruling that a lane declares its template, dropped by the sibling's design pass and
relayed as a benefit rather than as a reversal — for the retrospective. It is a finding about the
design handoff rather than scope here, and the file routes it correctly.

## The human ruling

Ruled 2026-09-22.

Independent — agree
Negotiable — agree
Valuable — agree
Estimable — agree
Small — agree
Testable — agree
