---
name: effective-prose
title: Effective prose — the epic, and the slices that remain under it
created: 2026-09-10
---

## Situation

`lint-jsdoc-with-vale` landed a Vale style over JSDoc, a runner, an ownership clause, and the
instruction-versus-explanation split. It also generated five candidates of its own and inherited a
dozen more that were filed before it.

The result is a board with roughly twenty entries orbiting one subject and no statement of how they
relate. Several are prerequisites for others. Two are closed and read as open. One is the planned
successor that was always going to follow.

## Complication

**The entries do not partition by topic; they partition by which failure each one prevents.** Read as
a flat list they look like twenty similar chores, so the reflex is to do the cheap ones first. That
ordering is wrong: the cheap ones are mostly checker-reach fixes, and the expensive ones are what
make the checkers worth extending.

Three facts a reader of the flat board would miss.

- **The linter's own directory is not linted by the reference checker.** `vale-styles/` carries 15
  filename citations that nothing verifies. Extending any convention before that is building on
  ground the tooling does not cover.
- **Nothing in the pipeline runs the linter.** `npm run prose-lint` exists, no role invokes it, and it
  is not one of `hardener`'s eight stages — measured, `hardener.md` does not mention it. Every slice
  below that adds rules adds rules nobody runs.
- **The runner cannot be tested.** It is a `.sh` in a TypeScript directory, so `test:scripts`,
  `crap4ts:scripts`, `dry4ts:scripts`, `test:mutation:scripts` and `reference-check` all miss it. It
  carries 0 test files where the other eight programs carry 1 to 13.

Those three are the epic's foundation, and none of them is the largest slice on the board.

## Question

What order turns twenty entries into a sequence where each slice makes the next one cheaper?

## Answer — four waves, with the first one held as a gate

**Read this before the waves.** Wave 1 is not merely first; it is a **hold**. Work does not proceed to
Wave 2 until the user judges the tooling **and** the prose surface sound — `prose-linting.md`,
`doc-comments.md`, and the Vale rules that mechanise them. That call belongs to the user and is made
by judgement, not by a passing gate.

### Wave 1 — make the tooling AND the process sound before extending either

**Wave 1 is a gate, not a phase. Nothing in Waves 2, 3 or 4 starts until the user rules Wave 1
complete.** That ruling is the user's alone. It is a judgement about whether the surface is sound, not
a checklist any gate can compute, so no agent may declare it and no green run substitutes for it.

**Soundness here covers the process, not only the programs.** Wave 1 is complete when all three of
these are true together:

- **The tooling runs, is tested, and is reachable by the gates that police the rest of the repo.**
- **`prose-linting.md` is instruction, and says correctly where a sentence goes.** It is now the home
  of the instruction-versus-explanation split, so an error in it propagates into every article and
  role file written afterwards.
- **`doc-comments.md` is right about what belongs in a hover**, and agrees with `prose-linting.md`
  where the two meet. These are the two files every author consults, and the `JsDoc` rules mechanise
  `doc-comments.md`'s own rules 2, 4 and 5 — so a rule and its article can disagree silently.
- **The Vale rules match what those two articles actually say.** A rule enforcing a superseded
  sentence is worse than no rule: it is confidently wrong and it is mechanical.

**The reason this is a gate rather than a preference.** Waves 2 to 4 write rules and remediate at
scale against whatever the articles say at that moment. Every error still present in the instruction
surface gets multiplied by the volume of work done under it, and mechanised errors are the expensive
kind to unwind. Ordering here is cheap; re-remediating is not.

Nothing in the table below changes a rule. Each one closes a gap that would otherwise silently weaken
every later wave.

| Slice                                               | Why first                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decide whether `prose-lint` gets a pipeline home    | **Not filed.** A gate change, so it needs a ruling: a `hardener` stage, a role trigger, or deliberately neither. Answer before Wave 2 doubles the rule count.                                                                                                                                                                                                                                                                                                         |
| Review `prose-linting.md` end to end                | It now owns the instruction-versus-explanation split, so an error in it propagates into everything written afterwards. Unreviewed by anyone but its author since that move.                                                                                                                                                                                                                                                                                           |
| Review `doc-comments.md` against it                 | The two meet at the hover boundary and must agree. Both are read by every author.                                                                                                                                                                                                                                                                                                                                                                                     |
| Reconcile the four `JsDoc` rules with both articles | The rules mechanise `doc-comments.md` rules 2, 4 and 5. A rule and its article can disagree in silence, and the rule wins.                                                                                                                                                                                                                                                                                                                                            |
| Settle `prose-linting.md`'s size                    | Measured against `main` it grew 27 percent across this slice. Needs a target from the user, not an invented one.                                                                                                                                                                                                                                                                                                                                                      |
| `rename-prose-linting-to-match-its-job`             | The article's job is now wider than its name. Cheap, and it is the file every later wave is written against.                                                                                                                                                                                                                                                                                                                                                          |
| `orchestrator-prose-has-no-reviewer`                | **Process, not tooling.** Every artifact in the cycle has a reviewer upstream of `hardener` except orchestrator-authored prose. This slice demonstrated the cost twice.                                                                                                                                                                                                                                                                                               |
| `a-clean-lint-is-not-evidence-a-block-hovers`       | oxlint sees a JSDoc tag only at line start; TypeScript's hover parser sees any whitespace-preceded `@`. A block passes `npm run lint` while hovering broken, and the `JsDoc` rules lint prose inside blocks that may not hover at all.                                                                                                                                                                                                                                |
| `spike-vale-rules-that-compress-the-agent-files`    | **A spike, and its output is rules rather than a rewrite.** The five role files hold 15,007 words; the enabled six rules find 195 findings on them, the full `STE` + `Slop` set finds 582, and neither `Microsoft` nor `Google` is installed. Applies rules one at a time, measuring whether each drives a rewrite that is shorter and says the same thing. **Subsumes the `Microsoft`/`Google` half of the row below** — reconcile the two rather than running both. |
| `mechanise-prose-soundness-with-a-style-package`    | Survey `Std`, `Google` and `Microsoft`. The gate's own standard is soundness enforced by tooling rather than by prose someone remembers, and six rules enforce a fraction of what the articles ask for. Wholesale `Std` is already declined; the per-rule and the two unexamined packages are not.                                                                                                                                                                    |
| `rename-the-rationale-tier`                         | The tier is named for one of the four things it holds, which invites a misfile in one direction. Sequence late in Wave 1, after the contents settle, and consider landing it with the rename above.                                                                                                                                                                                                                                                                   |

#### In flight — the three foundation lanes, promoted 2026-09-11

Three of the rows above are in `ideas/todo/` and authored concurrently. They are the three the
Complication section names, and the dependency analysis agrees with it: every other Wave 1 row either
edits the articles or decides policy, and both halves assume the tooling can see and test itself
first.

`vale-styles-is-reachable-by-vitests-default-include` is the exception, promoted on a different
argument. **It is prerequisite to no Wave 1 row.** It defuses a hazard that arms only when someone
allowlists `vale-styles/**`, and it earns a lane by being free — `vite.config.ts` alone, no overlap
with the other two.

**All three foundation lanes have landed** — `slice/vale-styles-is-reachable-by-vitests-default-include`, `slice/prose-lint-runner-is-shell-not-typescript`, `slice/reference-check-reach`. Land order was C then A then B: the vitest exclusion first because it is one line, then the runner
port, then the checker bundle — so the widened scan reaches the ported `run.ts` rather than the
reverse. Whichever of the port and the bundle lands second inherits the other's new scan surface at
merge step 3, which is expected rather than a defect. The port also moots one of the bundle's open
questions, since it removes the repo's only `.sh`.

All three re-arm the full mutation run by construction: `scripts/**` and `vite.config.ts` are both on
the mutation-invariance **absent** list. Three lanes therefore cost three `test:mutation:full` runs at
step 3. That is the price of the concurrency, not an argument against it.

#### Wave 1's tooling half is complete. Its process half is not.

The three Complication bullets at the top of this file are all closed, and each was closed by
measurement rather than by the change alone:

- **The linter's own directory is now linted by the reference checker.** `vale-styles/` joined the
  source prefixes, and the doc surface became every tracked `.md` outside `ideas/` rather than two
  files named exactly.
- **The runner is TypeScript and testable**, reached by `test:scripts`, `crap4ts:scripts`,
  `dry4ts:scripts`, `test:mutation:scripts` and `reference-check`.
- **Nothing in the pipeline runs the linter** — still true. That row is unchanged and is the one
  foundation fact these three slices did **not** close. It is the unfiled pipeline-home decision
  below.

**What remains in Wave 1 is the part no slice can discharge:** the article reviews, the `JsDoc` rule
reconciliation, the size question, the two renames, and `orchestrator-prose-has-no-reviewer`. Those
are judgement, and the gate at the top of this file says the user closes them.

**One thing the three slices changed about the rest of Wave 1.** The renames are now cheaper and
safer than when they were filed: `reference-check` reaches every tracked `.md`, so a rename that
strands a citation reds the gate instead of passing silently. That was the argument for sequencing
them after the tooling, and it held.

### Wave 2 — run the style over the surface it was built for

| Slice                                   | Note                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ste-over-jsdoc-and-its-remediation`    | The planned successor. Largest single slice on the board. Every corpus figure in it is superseded and must be re-derived.             |
| `ste-shape-rules-for-instruction-files` | Sentence-shape rules plus a governed vocabulary. Overlaps the above; decide whether they are one slice or two before starting either. |

### Wave 3 — close the checker-reach gaps

These share one shape: a convention exists, a checker enforces it, and the two stop at different
boundaries.

- `the-convention-and-its-checker-stop-at-different-boundaries` — README files and module sidecars
- `features-prose-still-carries-undated-claims` — the one directory no role pruned
- `the-doc-convention-stops-at-the-features-boundary` — who owns interface docs under `features/`

`reference-check-cannot-see-a-dot-path` was the fourth entry here and is **no longer in this wave**. It edits the same predicate as a Wave 1 entry, so it was folded into `reference-check-reach` and pulled forward. The user ruled that on 2026-09-11, accepting the wave crossing, because two slices cannot hold one predicate between them.

### Wave 4 — mechanise the claim discipline

The most speculative wave, and the one most likely to produce refutations rather than slices. That is
an acceptable outcome; a measured refutation closes a question permanently.

- `apply-the-census-count-rule-everywhere` — and decide what, if any, is mechanisable
- `mechanise-the-prose-direction-check` — whether the token-frequency diff becomes a command
- `a-written-argument-entry-goes-stale-in-silence` — a mutation-invariance entry whose argument this
  slice falsified, with the gate still exiting 0 over it

### Adjacent, and deliberately not in the waves

The doc-comment depth cluster shares vocabulary with this epic and answers a different question —
_what belongs in a hover_, not _how prose is governed_. Sequence it separately:
`implementation-comments-that-outgrow-their-line`, `hover-carries-detail-no-reader-asked-for`,
`module-depth-as-a-token-ratio`,
`migrate-module-depth-out-of-the-articles`.

Two entries were moved OUT of this group into Wave 1 on a second pass, and the reason is worth
keeping. `a-clean-lint-is-not-evidence-a-block-hovers` reads as hover depth and is really rule
soundness. `orchestrator-prose-has-no-reviewer` reads as a pipeline change and is really the process
half of Wave 1's own gate. Both were misfiled by the shape of their titles rather than by what they
prevent, which is the failure this epic's own framing warns about.

### Closed — do not re-open without new evidence

- `spike-the-slop-rules-one-at-a-time` — **DECLINED.** `Metaphor` read at roughly zero precision.
- `module-mutation-sidecars-refuted` — **REFUTED.** Rulings already live at their sites.
- `roll-the-rationale-sidecar-out` — believed complete. **Verify and delete, or say what remains.**

## Touches

`scripts/prose-lint/`, `scripts/reference-check/`, `vale-styles/**`, `.vale.ini`, every article and
role file, `CLAUDE.md`. Wave 1 touches gating checkers and re-arms the full mutation run by
construction; Waves 2 to 4 are mostly Markdown.

## Open questions

- **Ruled: `ste-over-jsdoc` does not jump Wave 1.** It is the largest remediation and the one a reader
  most notices, which is exactly why it waits. Landing it against an unsound instruction surface
  multiplies every error still in that surface, mechanically.
- **Should `prose-lint` gate?** Three of six enabled rules are prompts needing judgement, so it cannot
  gate on findings. It can gate on _inability to lint_, which it already detects. That is a narrower
  proposal than it first sounds and it is unfiled.
- **Is `prose-linting.md` now the right size?** Measured against `main` it grew 27 percent across this
  slice, from 28,902 to 36,856 bytes, after an instruction-only pass cut roughly 10.9 KB. A further
  cut needs a target, and `architect` correctly declined to invent one.
- **Does the hook belong here?** Installing the `agent-tools` plugin with `VALE_HOOK_LEVEL=warning`
  is a user action, so it is recorded in `prose-linting.rationale.md` rather than filed as a slice.
- **Is this epic itself a lane the board should have?** `ideas/` is two lanes by design, and an epic
  is neither. It sits in `candidates/` as an index rather than as work.
