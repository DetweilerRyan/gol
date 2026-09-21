# Amendment 1 — `checkers-do-not-reach-the-assessment-sidecar`

`coach` REVIEW, 2026-09-21. Amends the spec signed at the empty commit `454928d`. **Unsigned.**
`writer` has no authority under it until the line at the end is countersigned.

## Item numbers

**Supersedes item 2, in two paragraphs of its verbatim sidecar body, and nothing else.** Items 1,
3, 4, 5 and 6 stand as signed and as landed.

**It also rules one non-item point of the signed spec** — the `npm run prose-lint` row of "What
`writer` runs" — and that ruling carries no corpus edit.

## Trigger

`coach` REVIEW found one live contradiction, landed by the pass itself. Both gates are green:
`agent-doc-check` 56 doc files / 8 agent files / 32 rules / no failures, and `reference-check` 541
files / 3239 references / no failures, both measured on `834e2ca` 2026-09-21.

**Item 6 added a third output-keyed stop clause to `SKILL.md` in the same commit that landed item
2's sidecar, and item 2's verbatim text counts two.** The spec wrote item 2 before D6 was ruled and
never re-read it against D6 being ruled in. That is mine, not `writer`'s: every byte is
spec-supplied.

**The contradiction is between two files of one commit.** `SKILL.md` carries four stop-clause
paragraphs. `SKILL.meta.md` says the basename guard's siblings are "other two", enumerates two, and
closes "which neither clause names". The numeral stands beside its own enumeration, which is the
form `claim-discipline.md` keeps because it fails loudly — and it is now failing.

## The edit — `.claude/skills/idea-assess/SKILL.meta.md`, two paragraphs

Prettier owns the line wrapping. Match on the words, not on the break.

### A. The second paragraph of "Why the basename guard is duplicated in prose"

**Replace, verbatim (ignoring line breaks):**

```text
**The guard covers a gap the skill's other two stop clauses leave open.** Those two key on line shapes: an absent `LAYER1` count line, and a `not a candidate` line. Measured 2026-09-20, the record refusal prints a third shape — `an assessment record, 0 checks` — which neither clause names. Delete the basename guard and a reader holding that line finds a `LAYER1` line present, no `not a candidate` line, and no instruction covering the case.
```

**With, verbatim (ignoring line breaks):**

```text
**The guard covers a gap every stop clause keyed on the `LAYER1` output leaves open.** Those clauses key on a line shape in that output, or on its absence. Measured 2026-09-20, the record refusal prints a shape none of them names — `an assessment record, 0 checks`. Delete the basename guard and a reader holding that line finds a `LAYER1` line present, no stop clause that names it, and no instruction covering the case.
```

### B. The paragraph opening "The `off the board` stop clause"

**Replace, verbatim (ignoring line breaks):**

```text
**The `off the board` stop clause closes the same gap for a fourth line shape.** Measured live 2026-09-20, `node scripts/board-shape-hook/run.ts src/camera.ts` prints a `LAYER1` line reading `off the board, 0 checks` that none of the three prior stop clauses named — the same shape as the basename guard's gap, one line shape later.
```

**With, verbatim (ignoring line breaks):**

```text
**The `off the board` stop clause closes the same gap for one more line shape.** Measured live 2026-09-20, `node scripts/board-shape-hook/run.ts src/camera.ts` prints a `LAYER1` line reading `off the board, 0 checks`, which no stop clause named until `checkers-do-not-reach-the-assessment-sidecar` added one — the same gap as the basename guard's, one line shape later.
```

### Why the fix drops the count rather than raising it

**Raising "other two" to "other three" reproduces the defect at the next clause.** The numeral
counts stop clauses in another file, which is `claim-discipline.md`'s census of external state,
ruled 2026-09-09: drop the numeral, keep the enumeration. Here the enumeration is a census too, so
the property replaces both. **It fails in the right direction.** A future output-keyed clause for
any other shape leaves the sentence true. One for the record shape makes it false, and at that
point the basename guard really is duplicated.

**Verbatim in the replacements is load-bearing in two places.** `an assessment record, 0 checks` is
`board-shape.ts`'s own string and `off the board, 0 checks` is the hook's own stdout. Both
re-measured 2026-09-21 on `834e2ca`. Change neither.

## Obligations the replaced blocks carried

Read at sentence granularity, per the amendment rule. `prose.md`'s "How a pass damages the file it
cleans" names the shapes.

| #   | Obligation in the replaced text                                  | In the replacement | Ruling                                                                                                                                           |
| --- | ---------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | The guard is not redundant with the hook's refusal               | restored           | Carried by "covers a gap … leaves open"                                                                                                          |
| A2  | The sibling clauses key on the output, the guard on the basename | restored, widened  | "or on its absence" is added: the absent-`LAYER1` clause keys on no line at all, which "line shapes" missed                                      |
| A3  | The dated measurement, with the printed shape quoted             | restored           | Date and string unchanged                                                                                                                        |
| A4  | The consequence of deleting the guard                            | restored           | Final sentence unchanged in force                                                                                                                |
| A5  | Which clauses exist, named                                       | **dropped**        | Census of another file's structure. Orientation, not argument; the audience holds `SKILL.md` open                                                |
| A6  | "no `not a candidate` line" as the concrete reading cue          | restored, widened  | One named clause of three would now read as the only one that matters                                                                            |
| A7  | The count of sibling clauses                                     | **dropped**        | Census. See "Why the fix drops the count"                                                                                                        |
| B1  | The `off the board` clause closes the basename guard's gap       | restored           | "the same gap as the basename guard's"                                                                                                           |
| B2  | The live measurement, its command, its quoted output             | restored           | Verbatim                                                                                                                                         |
| B3  | The count of prior clauses                                       | **dropped**        | Census, and it counted line _shapes_ while saying _clauses_, so a reader could not check it either way                                           |
| B4  | That the shape was unnamed                                       | restored as past   | Present tense went false the moment item 6 landed. `claim-discipline.md`'s past-tense escape hatch, with the slice named rather than "this pass" |

**Nothing was added that the replaced text did not argue.** A2 and A6 widen two claims and the
amendment says so; no sequence, sufficiency or permission is asserted that was not there.

## Ruling — the `npm run prose-lint` row of the signed run list

`writer` reported an unauthorized substitution rather than resolving it. That was correct conduct.
**Both halves are now ruled.**

**The row meant a directory or pathspec containing each named path, never the path itself.** The
program's own contract says so: `lint-targets.ts`'s `pathspecsFor` takes "a directory or pathspec",
and appends each extension to it. `writer`'s substitution is **ratified**, and the row is corrected
to read that way for any later reader.

**`pathspecsFor` is not the defect. The spec's cell was.** Measured 2026-09-21,
`npm run prose-lint -- --scope CLAUDE.md` prints `prose-lint: no tracked files matched. That is not
a clean run, it is an empty one.` It announces the empty run instead of reporting a clean zero, so
the interface fails safe. Nothing goes to `scripts/`, nothing goes to `architect`, and no candidate
follows.

**One reading of the corrected row binds, and it is how F4 surfaced.** A directory scope aggregates
files the row does not name. Read the output per file against the row's per-file expectation, never
as one total. `npm run prose-lint -- --scope .claude/skills` linted 6 files and reported the
`idea-approve/SKILL.md` finding alongside the two zeros the row expects. For a root-level file the
containing scope is the unscoped whole-tree run.

## The re-entered pass

`writer` runs A and B. Scope is one file, `.claude/skills/idea-assess/SKILL.meta.md`. Then `editor`
CLEAN over the new manifest, then `coach` REVIEW against `spec.md` and this amendment together.

| Command                                         | Expected reading                                 | A finding means                                |
| ----------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `vale .claude/skills/idea-assess/SKILL.meta.md` | 0 — the tier is exempt, unmoved                  | the `[**/*.meta.md]` exemption stopped winning |
| `npm run prose-lint -- --scope .claude/skills`  | the `idea-approve/SKILL.md` finding and no other | A or B introduced one, or F4's finding moved   |
| `npm run reference-check`                       | pass                                             | a filename or symbol citation broke            |
| `npm run agent-doc-check`                       | pass                                             | unexpected — this file carries no such token   |
| `npm run format`                                | clean, last                                      | —                                              |

**Neither replacement adds a filename token, an `npm run` token, a retired-role name or a bare
role-cycle chain.** `SKILL.md` and `scripts/board-shape-hook/run.ts` already appear in the file, and
paragraph 1's `board-shape.ts`'s `checkShape` citation is untouched.

**Read the whole `SKILL.md` clause list once after the edit, not the sidecar alone.** The defect
this amendment fixes was a cross-file one, and only reading the pair catches its recurrence.

## The four findings this amendment does not reach, and the ruling on each

The stopping condition: only a live contradiction or a red gate reopens the cycle. Applied in both
directions, and deliberately against the parent slice's record of four amendments outliving their
subject.

| Finding | Subject                                                | Live contradiction? | Red gate? | Disposition                             |
| ------- | ------------------------------------------------------ | ------------------- | --------- | --------------------------------------- |
| F1      | `SKILL.meta.md`'s clause count, short by one           | **yes**             | no        | **this amendment**                      |
| F2      | `pipelines.md`'s "ahead of the candidate test"         | no                  | no        | `retro.md`                              |
| F3      | `SKILL.meta.md`'s undated hook-internals paragraph     | no                  | no        | `retro.md`                              |
| F4      | `prose.md`'s "it carries no backlog", false today      | no                  | no        | `retro.md`, plus a board recommendation |
| —       | `SKILL.meta.md`'s heading versus paragraph B's subject | no                  | no        | `retro.md`                              |

**F2 — not reopened, and the register defect is real.** "ahead of the candidate test" is an undated
present-tense assertion about another program's internal ordering, and `claim-discipline.md` binds
`.md` harder than `//`. It is **true on `834e2ca`**, re-measured 2026-09-21: `board-shape.ts`
refuses the record path before the candidate test. A claim that is true today and rots later is a
non-blocking finding by the condition this slice runs under, not a contradiction. `SKILL.meta.md`'s
first paragraph already dates the same fact, which is the tier that should carry it — that is the
durable half for `retro.md`, and it is a wording change, not a correctness one.

**F3 — not reopened, same reasoning, and one thing in its favour.** The paragraph is in the sidecar
tier, where an account of a mechanism belongs. Its three siblings date their claims and it does
not. Non-blocking.

**F4 — not reopened, and it is pre-existing.** `handoffs.md`: a finding the slice did not create is
out of scope by default. Say what made it visible — `writer`'s directory-scope substitution, ruled
above. Measured 2026-09-21: `prose.md` says of the skills tier "The surface is authored under the
rule from the start, so it carries no backlog", and `npm run prose-lint -- --scope .claude/skills`
reports `idea-approve/SKILL.md:40:91:Instruction.HistoricalNarration`. **Both available fixes are
outside what this contradiction forces.** Clearing the finding edits a skill file this pass never
opened. Rewriting the sentence edits a `prose.md` passage item 4 never touched, and the sentence is
a bare zero-count claim about external state, so the honest rewrite drops the claim rather than
updating it. Recommendation 3 below carries it.

**The heading observation — not reopened, and paragraph B keeps its own framing.** The section is
titled "Why the basename guard is duplicated in prose" and paragraph B's subject is the
`off the board` clause. B's closing clause, "the same gap as the basename guard's, one line shape
later", is what holds it under that heading. A heading rewrite is a structural change the signed
spec licensed nobody to make, and it belongs in `retro.md`.

## P1 to P7 carried forward

P1, P2, P3, P4, P5 stand as written in the spec. P6 and P7 stand, each with one revision below.
All seven go to `retro.md`, which the seat writes.

- **P1 — `pipelines.md` plans `design.md`; `architect.md` grants no write. Unchanged.**
- **P2 — a rule and its mandatory article entry have two owners and no green intermediate state.
  Unchanged, and the spec's item-2-and-3 instance held: the ordering instruction worked.**
- **P3 — a role file's standing duty and a legitimate prompt can contradict each other.
  Unchanged.**
- **P4 — the board read carve-out is a two-file allowlist and the pipeline needs three artifacts
  through it. Unchanged.** This REVIEW invocation needed no third artifact, so it adds no instance.
- **P5 — a synthesized artifact used as a measurement's input was never checked against its own
  ruled shape. Unchanged, and it paid out again.** Every measured premise in this review was
  re-run rather than accepted: the five Vale baselines, both gates, both quoted hook strings, the
  `pathspecsFor` contract and F4's finding. The one figure that had moved is P7's, below.
- **P6 — the seat's staleness residue needs the user's approval of the route as well as the text.
  Unchanged in substance, and this amendment is the instance in the other direction.** F2's and
  F4's remedies are staleness in files the seat reads, and both are routed rather than edited.
- **P7 — an instruction file may not point at its own sidecar, so `CLAUDE.md`'s pair index is the
  only route to any sidecar, and nothing checks it. Revised: the figure moved with this pass.**
  Measured 2026-09-21 on `834e2ca`: **23** tracked `*.meta.md` files, **23** named in the index,
  0 missing. Item 3's bullet is what kept it complete, and it moved by hand — which is the finding.
  The proposal states the figure as of a date, never as a standing count.

### Added by this review

- **P8 — a conditional spec item can falsify a verbatim block elsewhere in the same spec, and
  nothing re-reads the spec against its own ruling. New.** D6 was drafted as rule-in-or-out, and
  item 2's sidecar body was written under the assumption it stayed out. Ruling it in made two of
  item 2's sentences false before `writer` typed a character. The durable form: **a spec carrying a
  conditional item owes a re-read of every other item's verbatim text against that item being
  ruled in.** The cheap version is one line per decision point naming which other items its
  ruling touches — D1 already does this ("item 2's path and item 3's bullet both change"), and D6
  does it only for the one sentence it adds. The sidecar's counts were the sentences D6 did not
  name.

- **P9 — an enumerated count inside a `.meta.md` sidecar counts another file, and the exempt tier
  hides it from every mechanical reader. New.** `claim-discipline.md` keeps the count-beside-its-
  enumeration form because it fails loudly. In a sidecar the loudness has no audience: Vale is off
  by construction, no role has a read trigger, and the numeral's subject lives in a different file
  that a `format:check` never compares it to. Ruling: **a census of another file's structure does
  not belong in a sidecar in counted form at all.** The property form replaces it, as A and B above
  do. This is narrower than P7 and independent of it.

- **P10 — the spec's own sign-off block is written as fill-in lines, which instructs the signer to
  edit an immutable file. New.** `pipelines.md` rules the signed bytes immutable and the signature
  an empty commit. `spec.md`'s block reads `not yet ruled` per decision point and `Signed:
_pending_`, so its own text asks for the edit the convention forbids, and this file reproduces
  the shape. Nothing checks it, and the contradiction is between a template and a rule rather than
  between two claims. Ruling: the block states where the signature lives instead of offering a
  slot. The durable half is one sentence in `pipelines.md`'s amendment section or in whatever
  carries the spec's shape; the seat raised it in this review's prompt, which is where the
  instance is recorded.

## Cross-pipeline recommendations — for the seat to capture, not for `writer`

Recommendations 1 and 2 stand as the spec wrote them, with 1's figure revised to 23 of 23 as of
2026-09-21. One is added.

3. **Candidate — `prose.md`'s skills-tier paragraph claims a zero backlog that is now false.**
   Measured 2026-09-21: one `Instruction.HistoricalNarration` finding in the tier. The candidate
   carries both halves, since either alone leaves the corpus inconsistent — clear the finding, and
   replace the standing zero-count claim with what it was there to say, which is that the tier was
   authored under the rule rather than swept into it. State in the proposal that a bare zero over
   external state is the claim form `claim-discipline.md` rules out, so updating the number is the
   wrong repair. F4 is the instance.

## Sign-off

**This amendment is unsigned.** The spec's signature does not carry across it. `writer` has no
authority to touch `SKILL.meta.md` until it is signed, and the cycle does not re-enter at step 2
before then.

Rule A and B, and the `prose-lint` row ruling. Per this slice's own convention the signature is an
empty commit, and these lines stay as written — see P10.

- A — `SKILL.meta.md`'s clause-count paragraph, property form: **not yet ruled**
- B — the `off the board` paragraph, property form and past tense: **not yet ruled**
- The `prose-lint` row means a directory or pathspec; `writer`'s substitution ratified: **not yet
  ruled**

Signed: _pending_
