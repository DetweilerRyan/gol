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

| Slice                                               | Why first                                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prose-lint-runner-is-shell-not-typescript`         | Rewrite in TypeScript. Buys five gates at once, and makes the runner testable at all. `architect` ruled it a defect.                                                        |
| `reference-check-does-not-reach-vale-styles`        | 15 unchecked citations in the linter's own directory. Blocks nothing formally; undermines everything informally.                                                            |
| Decide whether `prose-lint` gets a pipeline home    | **Not filed.** A gate change, so it needs a ruling: a `hardener` stage, a role trigger, or deliberately neither. Answer before Wave 2 doubles the rule count.               |
| Review `prose-linting.md` end to end                | It now owns the instruction-versus-explanation split, so an error in it propagates into everything written afterwards. Unreviewed by anyone but its author since that move. |
| Review `doc-comments.md` against it                 | The two meet at the hover boundary and must agree. Both are read by every author.                                                                                           |
| Reconcile the four `JsDoc` rules with both articles | The rules mechanise `doc-comments.md` rules 2, 4 and 5. A rule and its article can disagree in silence, and the rule wins.                                                  |
| Settle `prose-linting.md`'s size                    | Measured against `main` it grew 27 percent across this slice. Needs a target from the user, not an invented one.                                                            |

### Wave 2 — run the style over the surface it was built for

| Slice                                   | Note                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ste-over-jsdoc-and-its-remediation`    | The planned successor. Largest single slice on the board. Every corpus figure in it is superseded and must be re-derived.             |
| `ste-shape-rules-for-instruction-files` | Sentence-shape rules plus a governed vocabulary. Overlaps the above; decide whether they are one slice or two before starting either. |

### Wave 3 — close the checker-reach gaps

These share one shape: a convention exists, a checker enforces it, and the two stop at different
boundaries.

- `no-md-reference-is-checked-anywhere` — the mandated `@see {@link ./x.rationale.md}` form is
  unverified, because a leading-dot token is discarded before any check
- `reference-check-cannot-see-a-dot-path` — the same discard, from the other side
- `the-convention-and-its-checker-stop-at-different-boundaries` — README files and module sidecars
- `features-prose-still-carries-undated-claims` — the one directory no role pruned
- `the-doc-convention-stops-at-the-features-boundary` — who owns interface docs under `features/`

The first two are plausibly one slice. Check before filing them as two.

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
`a-clean-lint-is-not-evidence-a-block-hovers`, `module-depth-as-a-token-ratio`,
`migrate-module-depth-out-of-the-articles`.

`orchestrator-prose-has-no-reviewer` is also adjacent, and is the one entry that would have caught
several defects this slice found late. It is a pipeline change rather than a prose change.

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
