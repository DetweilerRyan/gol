---
name: the-idea-template-claims-the-whole-board
assessed: 2026-09-21
idea-blob: 6b3ae868e3c3d1966e31ddf6fdb45a7c9d1f28fc
---

# Assessment — the-idea-template-claims-the-whole-board

`/idea-assess`, 2026-09-21. Kind: enabler-process (SAFe: architecture or infrastructure enabler).
Disposition: Ready.

`LAYER1 backlog/ideas/the-idea-template-claims-the-whole-board.md: 7 checks, 0 findings`

Layer 1 measured the lane as `ideas`, the shape as SCQA, the length as 122 lines, and 0 depends-on
mentions, and it found no prior assessment record. Those are measurements and they score nothing.

The slice check passes: the title is imperative rather than a `REFUTED` or `DECLINED` verdict, and
the file opens by naming itself the corpus child of a split rather than an index. The kind check
asks whether a `product` VERIFY pass would have anything to observe. It would not. The stated diff
lands in `CLAUDE.md`, `.claude/references/pipelines.md`, `.claude/agents/articles/doc-comments.md`,
`.claude/skills/idea-assess/SKILL.md` and `backlog/TEMPLATE.md` — the instructions that run the
gates, not the tree the gates measure. V and T are scored against the checker-bearing column.

| Letter      | Score | Finding                                                                                     |
| ----------- | ----- | ------------------------------------------------------------------------------------------- |
| Independent | 3     | The named sibling landed; the declaration-field reach is asserted and measured false.       |
| Negotiable  | 4     | States the need, marks two bullets as user rulings, and holds seven questions open.         |
| Valuable    | 4     | Four live false or stale claims cited by path; one of its own figures does not hold.        |
| Estimable   | 4     | Bounds the rename, five citations and four amendments; the `scripts/` surface is unbounded. |
| Small       | 4     | Trips no design-pass trigger; one open question could grow the reach to a sweep.            |
| Testable    | 3     | Names `reference-check` and the direction of change; the reading-afterwards claim is false. |

## Independent

The file names one dependency and it has landed. `one-item-shape-serves-every-lane` sat in
`backlog/done/` on 2026-09-21, moved there by commit `a7a0892`, so the ordering the file declares —
that it runs second — is satisfied on this tree.

What the file asserts without checking is a second reach. Its second open question says the sibling
lands a lane declaration naming the old template, and that "the declaration is a board file rather
than a script, so this cycle can reach it". Measured 2026-09-21 on this tree, both halves fail.
`board-lanes.config.json` sits at the repository root rather than under `backlog/`, and it declares
`ideas` as `{ "shape": "flat" }` with no template field of any kind — there is no field to inherit
and none to move. Adding one is not a board edit either. `scripts/board-shape-hook/lane-declarations.ts`
validates a flat lane by exact key count, refusing any entry whose key count is not one, and
`schemas/board-lanes.schema.json` sets `additionalProperties: false` on the same shape. A `template`
key added to the `ideas` entry would make every board path report `lane declarations unavailable`.

So the Answer's first bullet — that the lane's own declaration names the template — needs a change
under `scripts/`, which this file's own first No-go forbids the cycle from making. Nobody has filed
that change.

This is not ruled blocking, and the reason is narrow. The file holds the ownership of that field
open rather than claiming it settled, asking whether it belongs here or back with the sibling. What
is wrong is the one clause giving the reason, not the bullet. Correcting the clause is a one-line
edit that changes no ruling. Anchor 3 is the fit: a dependency whose blocking status is asserted
rather than checked.

## Negotiable

The file states the problem before it states any answer. The Situation carries the ambiguity and the
sweep, the Complication separates the half that is a matter of taste from the half that is not, and
the Question asks what the template becomes rather than announcing what it becomes.

The Answer is marked "Shaped" and attributes its first two bullets to user rulings taken 2026-09-21
during the parent's shaping. A user ruling is a decided constraint rather than a closed solution,
and the remaining five bullets read as offered. Seven open questions follow, and several of them
hold a real decision open: where the renamed template sits, who owns the declaration field, whether
the no-test clause fails alongside the no-checker one, and whether one false clause implies the
board section wants a sweep.

What the file does not do is say what would rule the idea out on its own terms. Its fourth open
question asks whether the rename needs a transition at all, which gestures toward a refutation
condition without stating one. That is the distance between anchor 4 and anchor 5.

## Valuable

Scored against the checker-bearing column. The file names four claims that are false or stale today,
each at a path, each dated 2026-09-21, and each of the four held when checked on this tree.

`CLAUDE.md` states that the board has no gate, no checker, and no test beyond the advisory `Board`
Vale style. The board-shape hook ships at `scripts/board-shape-hook/`, `.claude/settings.json`
registers it on two write events, and `run.ts` states in its own header that it always exits zero
because the board has no gate. The no-checker clause is false and the no-gate clause beside it is
true, which is the split the file's last Answer bullet describes.

`doc-comments.md`'s rule 7 names three live module sidecars, and `CLAUDE.md`'s index of which pairs
exist names the same three. A fourth exists — `scripts/board-shape-hook/board-shape.meta.md` — and
it is the first outside `src/`. One cause, two surfaces, and nothing checks either.

`.claude/skills/idea-assess/SKILL.md` instructs the judging pass to stop when Layer 1 reports
without measuring, and names one such case. `board-shape.ts` emits a second, the
`lane declarations unavailable` line. A judge told to stop on the one has no instruction covering
the other. That instance is live against this very invocation.

The sweep the file reports also holds. Citations of the shared basename sit in the auto-loaded index
at `CLAUDE.md`, in `.claude/references/pipelines.md`, in `.claude/skills/idea-capture/SKILL.md` as a
step the skill executes, and in `scripts/board-shape-hook/board-shape.test.ts` as a unit test's path
argument, with a bare one in `adr/README.md`.

The score is held at 4 rather than 5 because one of the file's own figures does not hold on the tree
it names. It states that the hook's directory carries three test files. On 2026-09-21 that directory
carried six. The figure does not weaken the value argument, since the no-checker clause is false at
any count, but a record dated to a tree should match it.

## Estimable

The file bounds the reach well enough to run the design-pass checklist, and it names the unknowns
that could move the bound. The reach is one file rename, five citations at named paths, and four
prose amendments at four named files. The four unknowns are stated as open questions: the renamed
template's location, the declaration field's owner, whether the no-test clause fails too, and
whether the board section wants a sweep.

One surface stays unbounded. The rename touches `scripts/board-shape-hook/board-shape.test.ts`,
which names the old path as a string argument, and it touches the declaration validator if the
first Answer bullet is executed. The file's first No-go excludes `scripts/` from the cycle without
accounting for either. That is what holds the score at 4 rather than 5.

## Small

None of the five design-pass triggers in `CLAUDE.md` fires. The five turn on the shape of `src/` —
a behavior-preserving refactor, new or moved modules, a crossing of the framework-free to hook to
component layering, an already-oversized target, or three or more modules — and this slice's diff
lands in corpus prose and one board file. Anchor 4 is the fit.

The reach is one cycle's work and the file names its ordering constraint, which is that it runs
second. It also adopts one pre-existing defect, the board section's no-checker clause, and the file
argues that adoption from same-file, same-section, same-cycle rather than leaving it implicit.

The score is held at 4 rather than 5 because the seventh open question could grow the reach. If
reading the whole board section against the tree turns up a second stale claim, the slice becomes a
sweep rather than four named amendments. The file leaves that as a question rather than as scope,
which is the right call, but the bound is therefore not tight enough that a split would have nothing
to separate.

Note that the design pass runs regardless of these triggers. `CLAUDE.md` rules it required in the
Enabler pipeline, since an Enabler has no `product` SPECIFY and the design pass is its only
pre-implementation gate. For a process enabler that gate is `coach` SPEC.

## Testable

Scored against the checker-bearing column. The file names the check and the direction of change.
The check is `npm run reference-check`, its reading today is green with every citation resolving by
basename, and its reading afterwards is green with the renamed basename resolving instead.

The reading-afterwards claim is false as written. The fourth open question says the checker "would
red on a stale one rather than pass it — which makes the rename self-policing for prose". That
holds only if no file of the same basename survives the rename. The third No-go guarantees one does:
it declines to rename `adr/TEMPLATE.md`. `reference-check` matches by basename against the live
tree, which is the very property the file's own Situation cites. So after the rename, a stale
`backlog/TEMPLATE.md` citation keeps resolving against `adr/TEMPLATE.md` and the gate stays green.
The rename is self-policing for nothing while the decision-record tier's template stands.

The file names one way the reading is a confident zero, which is the skill step that reads the path
rather than citing it. It misses a second. `board-shape.test.ts` names the old path as a string
argument inside an `expect`, and `reference-check` scans comment lines only in `.ts` files, so that
citation is invisible to the gate. `checkShape` is pure over a path string and reads no filesystem,
so the test also stays green against a path that no longer exists. Two green signals over a dead
reference, and the cycle's first No-go forbids touching either.

Anchor 3 is the fit: the check and the direction of change are named, and there is no trustworthy
reading-afterwards until the masking is accounted for.

## What happens next

Promote. The disposition follows the findings rather than the numbers: no finding says this is more
than one slice, no blocking finding turns on knowledge nobody has, and V's finding cites four live
instances rather than ruling the idea out.

Two corrections travel with the promotion, and `coach` SPEC resolves them before writing the edit
list. The first is the Independent finding — the declaration carries no template field, the
validator and schema both refuse an extra key, and adding one is a `scripts/` change this cycle
forbids itself. Whether that reopens the Answer's first bullet is a user ruling rather than a SPEC
ruling, since the bullet is recorded as a user ruling taken 2026-09-21. The second is the Testable
finding — the self-policing claim fails while `adr/TEMPLATE.md` stands, and the unit test's path
argument is a second citation no gate reaches.

The value findings also correct one figure in the idea file: the hook's directory carried six test
files on 2026-09-21, not three.

## The human ruling

None recorded.
