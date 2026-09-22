# Spec: the-idea-template-claims-the-whole-board

By `coach` (SPEC), 2026-09-22.

## What this spec rules

Rename the idea template for the lane it serves, sweep its five live citations by hand, and
correct three board statements that stopped holding. One of the five citations sits under
`scripts/`, which the process pipeline does not write, so item 8 runs a bounded `coder` → `cleaner`
excursion inside this process cycle.

Eight items. Items 1 to 7 are `writer`'s. Item 8 is the deviation, and 8E is an expansion the user
rules on at sign-off rather than a granted item.

## Measurements this spec rests on

Every reading below was taken by `coach` on 2026-09-22, on this slice's branch at its tip before
any item landed. Re-derive rather than inherit them.

| Reading                                                                            | Command                                                                       |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `reference-check` green: 546 files, 3227 references, no failures                   | `npm run reference-check`                                                     |
| `agent-doc-check` green: 56 doc files, 8 agent files, 32 rules                     | `npm run agent-doc-check`                                                     |
| `test:scripts` green: 76 files, 1223 tests                                         | `npm run test:scripts`                                                        |
| `prose-lint` whole tree: 598 files linted; CLAUDE.md 18 findings                   | `npm run prose-lint`                                                          |
| `prose-lint` on `.claude/skills`: 1 finding, in `idea-approve/SKILL.md`            | `npm run prose-lint -- --scope .claude/skills`                                |
| `prose-lint` on `.claude/references`: 1 finding, in `merge-protocol.md`            | `npm run prose-lint -- --scope .claude/references`                            |
| The board root draws the plain refusal                                             | `node scripts/board-shape-hook/run.ts backlog/TEMPLATE.md`                    |
| A template inside `ideas/` scores as a candidate: `7 checks, 2 findings`           | the same command, run in a throwaway tree against `backlog/ideas/TEMPLATE.md` |
| A template directory draws `undeclared lane, 0 checks`                             | the same command, against `backlog/templates/idea.md`                         |
| A `template` key in a flat lane reports `lane declarations unavailable` every path | the same command, against a config carrying that key                          |

Four further measurements decide items below, and each is named again at the item it decides.

- **The citation census.** `grep -rn 'TEMPLATE\.md'` outside `backlog/` returns nine tokens in
  seven files. Three are live prose, two are `scripts/`, three are dated records inside
  `.claude/references/definition-of-ready.meta.md`, and one is `adr/README.md`'s own relative
  reference.
- **Neither gate can catch a stale citation of this file.** `reference-check` resolves a token by
  basename, and `adr/TEMPLATE.md` keeps resolving `TEMPLATE.md` after the rename.
  `scripts/reference-check/scannable-lines.ts` scans a `.ts` file's comment lines only, so
  `board-shape.test.ts`'s string literals are off its surface entirely.
- **No vitest project reads a tracked `backlog/` file.** The board-shape hook's own tests run over
  literals and temporary directories.
- **Prettier reflows the edited test.** `board-shape.test.ts`'s `lines:` element is 120 characters
  today, and five more characters push the array onto three lines. Item 8 carries the post-format
  text.

## Rulings

**R1 — the renamed template is `backlog/IDEA-TEMPLATE.md`.** Three locations were live and one is
now impossible. A lane declaration cannot carry the pairing: `schemas/board-lanes.schema.json`
forbids additional properties, and a probe adding a `template` key made every board path report
`lane declarations unavailable`, rather than making the key inert. Of the two that remain, the
board root keeps the file in the class the classifier already rules silent, and adds no directory
under `backlog/` that is not a lane. A `backlog/templates/` directory draws `undeclared lane, 0
checks` on every write to a file inside it, which is a permanent line that is not a defect reading
as one, and it invites declaring a lane the schema cannot express. The name is singular because the
file is the shape of one idea, and it stays upper case because that is what tells a reader at the
board root that the file is not an item.

**R2 — hook noise does not separate the two locations, and the seat's premise that it does is
wrong.** Measured in hook mode with a `PostToolUse` payload: the board root and a template
directory both print their line and deliver no envelope. The difference is the wording in the log
stream, not whether the acting agent is interrupted. R1 therefore rests on the board's own shape
rather than on noise, and the user may overturn it on editorial grounds with one word.

**R3 — the rename lands before the `scripts/` fix.** No gate forces the order, since neither
citation is on a gate's surface. The reason is that item 8's two edits are observations about a
real path: after item 1, `coder` can take the refusal line from the live tree rather than from a
throwaway one.

**R4 — the pairing stays prose, and the question is closed rather than deferred.**
`board-lanes.config.json` declares item depth and basename only, ruled 2026-09-22. Item 2 states
the pairing in the board's own documentation and says outright that nothing machine-readable
carries it, so a later reader does not go looking for a config field.

**R5 — the no-test clause was true, and it goes anyway.** No vitest project reads a tracked
`backlog/` file, so the clause is not the false one. It goes because a bare negative standing beside
a corrected positive rots the same way the no-checker clause did. Item 3 replaces the whole negative
list with what exists, and keeps the no-gate fact explicitly, since the hook's own shell states that
fact about itself.

**R6 — one false clause does not imply a sweep, and the rest of the board section was read
rather than assumed.** `coach` read CLAUDE.md's Idea board section end to end on 2026-09-22 against
the tree: the three lanes, the six per-item artifact names, the read carve-out, the two board
rules, and the closing tooling paragraph. The no-checker clause is the only statement that does not
hold. No other edit to that section is in this spec.

**R7 — the assessment skill misses three never-measured cases, not one, and the remedy is a
positive gate rather than a longer list.** Measured 2026-09-22 against `board-shape.ts`'s outcome
literals: `lane declarations unavailable`, `undeclared lane` and `shape mismatch` each print a
`LAYER1` line that no stop clause in `SKILL.md` names. This is where the spec departs from the
proposal's reading, which names one. A longer list leaves the skill one behind every outcome the
classifier grows, and the classifier's artifact axis is deliberately open. Item 6 replaces the
wording-keyed refusal clauses with one clause keyed on the measured form.

**R8 — item 6 does not disturb the 2026-09-20 ruling, and this was checked rather than assumed.**
`.claude/skills/idea-assess/SKILL.meta.md` records that a stop clause keyed on the hook's own
refusal line was rejected, and that the basename guard stays. Item 6 keeps that guard byte for
byte. Its new clause is keyed on the **measured** form rather than on a refusal form, so an
unrecognised refusal stops the pass instead of passing through it. The enumerated form failed open;
the positive form fails safe.

**R9 — the deviation's authority is the seat's prompt, not a board path.** Item 8 carries its two
edits verbatim, so the seat pastes them into `coder`'s prompt the way it pasted the proposal into
this one. No story-pipeline role reads under `backlog/` on this slice.

**R10 — `writer` performs the rename.** The board docs sit in `writer`'s write surface by its own
file, and `backlog/IDEA-TEMPLATE.md` is a board doc rather than an item. The prompt names both
paths, so nothing is derived. Item 1 needs no read of the file's contents.

## Item 1 — rename the template — `writer`

Run `git mv backlog/TEMPLATE.md backlog/IDEA-TEMPLATE.md`. Change no byte of the file's contents.

Commit this move on its own, before any other item in this pass. Nothing inside the file names the
file, so rename detection does not depend on the isolation; the separate commit is so a later reader
can read `git log --follow` across one commit whose whole content is the move.

## Item 2 — CLAUDE.md, the template sentence — `writer`

**Anchor.** The one-sentence paragraph in the Idea board section that begins
`` `backlog/TEMPLATE.md` is the idea-file shape: ``.

**Replace that whole paragraph with:**

```text
`backlog/IDEA-TEMPLATE.md` is the `ideas/` lane's item shape: frontmatter (`name`, `title`, `created`, and `kind` once assessed) over Situation / Complication / Question, an optional shaped Answer and No-gos, then Open questions. It sits at the board root, not inside `ideas/`: a file in a flat lane is a candidate, and a template fails every identity check. Nothing machine-readable pairs a lane with a template — `board-lanes.config.json` declares item depth and basename only.
```

Why: this sentence is the pairing, per R4, so it states where the file sits, why it cannot sit in
the lane, and that no config field carries the link.

Measured 2026-09-22: this paragraph reports no Vale finding under the `[CLAUDE.md]` section, probed
in a throwaway tree carrying this repo's `.vale.ini` and `vale-styles/`.

## Item 3 — CLAUDE.md, the no-checker clause — `writer`

**Anchor.** The paragraph in the Idea board section beginning `Nothing enforces any of this.` and
ending `That is the extent of the tooling.`

**Replace that whole paragraph with these two paragraphs:**

```text
Nothing enforces any of this, and `backlog/` has no gate. The board-shape hook (`scripts/board-shape-hook/run.ts`) reads every `backlog/**` write and edit, and it always exits 0. It scores an idea file's shape and refuses everything else, so a line reporting `0 checks` is a refusal rather than a pass. Vale's advisory `Board` style is the only other reader of a board file.

Prettier formats the Markdown, and its ignore list is exclusion-based, so a new top-level path is covered with no config edit. That is the extent of the tooling.
```

Why: the no-checker clause is false and the no-gate clause is a design fact, per R5. The
replacement names the hook, says it never refuses a write, and tells the reader how to read its
silence — so nobody who learns a checker exists expects it to fail something.

The second paragraph is the original's own last two sentences, moved unchanged into a paragraph of
their own. Keep them byte for byte.

Measured 2026-09-22: both paragraphs report no Vale finding under the `[CLAUDE.md]` section, probed
as above.

## Item 4 — the pipelines reference, the positional rule — `writer`

**Anchor.** The paragraph in `.claude/references/pipelines.md` beginning `**The kinds are not a
closed set.** Apart from the record refusal below,`.

**Replace that whole paragraph with:**

```text
**The kinds are not a closed set.** `scripts/board-shape-hook/board-shape.ts` classifies on two axes, and only one of them is a name lookup. The hook looks a lane up in `board-lanes.config.json`, so an undeclared lane draws its own refusal. A per-item artifact stays positional: any file at a folder lane's item depth that is neither the declared item nor an assessment record. So an artifact kind nobody has named yet is covered in an item's folder on the day it lands. `scripts/board-shape-hook/board-shape.meta.md` carries the axis-split ruling.
```

Why: the classifier stopped classifying by position alone when `one-item-shape-serves-every-lane`
landed. The positional half survives for artifacts, so the consequence sentence stays and the
premise gains the split. The closing pointer is how the paragraph stays honest: whoever changes the
classifier reads that sidecar, and it is the file the ruling lives in.

The dropped clause `Apart from the record refusal below,` is not lost. The record refusal keeps its
own paragraph two below, and the replacement names an assessment record inside the artifact test.

Measured 2026-09-22: this paragraph reports no Vale finding under the
`[.claude/references/**/*.md]` section, probed as above.

## Item 5 — the capture skill's step 2 — `writer`

**Anchor.** In `.claude/skills/idea-capture/SKILL.md`, the numbered step reading
``2. Read `backlog/TEMPLATE.md`.``

**Replace with:**

```text
2. Read `backlog/IDEA-TEMPLATE.md`.
```

Why: this is a step the skill executes, so a stale path here is a read that fails rather than a
citation that misleads.

Leave the file's frontmatter alone. Its `description` says "in the template's shape" and names no
path.

## Item 6 — the assessment skill's Layer 1 stop rules — `writer`

**Anchor.** In `.claude/skills/idea-assess/SKILL.md`, the three bold paragraphs that follow the
`!` command line and precede the paragraph about a record's basename. In order, they open:

```text
**Absent a `LAYER1` count line directly above, Layer 1 did not run
**A `not a candidate` line means the target is a per-item artifact
**An `off the board` line means the target is not a board file at all
```

**Replace all three with this single paragraph:**

```text
**Assess only on a `LAYER1` line reporting a non-zero check count.** An absent line, or any other line, means the target was never measured. Stop, report the line or its absence, and score nothing. Never assess on hand-computed checks.
```

**Keep the next paragraph byte for byte** — the one that opens:

```text
**A target whose basename ends `.assessment.md` is a record rather than an idea
```

The user ruled on 2026-09-20 that this guard stays, and R8 says why item 6 does not reach it.

Why: the three replaced clauses each name one refusal wording, and three further refusal wordings
exist that they do not name. A clause keyed on the measured form covers every refusal the
classifier has and every one it grows, and an unrecognised line stops the pass rather than passing
through it.

What the replacement drops, and where each obligation goes:

| Dropped                                                 | Where it lands                                         |
| ------------------------------------------------------- | ------------------------------------------------------ |
| "Layer 1 did not run — stop and say so"                 | "An absent line … means the target was never measured" |
| "A line reporting the path missing … stop the same way" | the same clause; a missing path reports zero checks    |
| The per-artifact and off-board wordings                 | "report the line", which carries the reason after `--` |
| "score nothing", stated three times                     | stated once, in the same clause                        |
| "Never assess on hand-computed checks"                  | kept verbatim as the paragraph's last sentence         |

Measured 2026-09-22: this paragraph reports no Vale finding under the `[.claude/skills/**/*.md]`
section, probed as above. It is four sentences, which is `Instruction.ParagraphSentences`'s limit
rather than past it — a fifth sentence would red that rule.

## Item 7 — the assessment skill's sidecar — `writer`

Two edits to `.claude/skills/idea-assess/SKILL.meta.md`.

**7a. Date the claim item 6 falsifies.** Anchor: in the section `## Why the basename guard is
duplicated in prose`, the bold sentence that opens the second paragraph, plus the sentence
directly after it. The two read:

```text
**The guard covers a gap every stop clause keyed on the `LAYER1` output leaves open.** Those
clauses key on a line shape in that output, or on its absence.
```

Replace those two sentences with:

```text
**Measured 2026-09-20, the guard covered a gap every stop clause keyed on the `LAYER1` output left open.** Those clauses keyed on a line shape in that output, or on its absence.
```

Leave the rest of that paragraph unchanged, including its `checkShape` sentence.

**7b. Record the replacement.** Append this section at the end of the file, after
`## What was ruled out` and its paragraph:

```text
## The 2026-09-22 positive gate

The stop clauses naming `not a candidate`, `off the board` and a missing path were replaced by one
clause: assess only on a `LAYER1` line reporting a non-zero check count. Measured 2026-09-22 on
`slice/the-idea-template-claims-the-whole-board`'s branch, three refusal forms printed a `LAYER1`
line that no stop clause named — `lane declarations unavailable`, `undeclared lane` and `shape
mismatch`. An enumerated list leaves the skill one behind every outcome the classifier grows, and
the artifact axis is deliberately open.

**The positive form fails safe where the enumerated form failed open.** A refusal worded in a way
the skill does not recognise now stops the pass, because the pass proceeds only on a recognised
measurement. The 2026-09-20 ruling above stands untouched: the basename guard is not keyed on the
hook's wording, and it stays.

**What the replacement gave up is the per-case report wording.** Each replaced clause said what to
say. The clause that replaced them tells the judge to report the line, which carries its own reason
after `--`. The forms `board-shape.ts` printed on 2026-09-22 were `extraction returned empty`,
`path missing or unreadable`, `off the board`, `lane declarations unavailable`, `not a candidate`,
`undeclared lane`, `shape mismatch` and `an assessment record` — every one of them at zero checks,
against one scored form that is not.
```

Why: 7a keeps a record true by dating it rather than deleting it. 7b is where the enumeration goes,
which is the half `prose.md` sends to a sidecar, and it names what item 6 dropped so a later pass
does not read the shorter clause as unexplained.

## Item 8 — the deviation into `scripts/` — `coder`, then `cleaner`

Two citations of the old path sit under `scripts/`, which `writer` never writes. Run one `coder`
pass and then one `cleaner` pass, inside this process cycle, after items 1 to 7 have landed.

**The seat carries 8A and 8B verbatim in `coder`'s prompt**, per R9. `coder` reads no board path on
this slice.

**8A — `scripts/board-shape-hook/board-shape.meta.md`.** In the section `## Ruling 3 — the silent
board root, implemented as deferred`, the first sentence reads:

```text
A one-segment path directly under `backlog/` (`backlog/TEMPLATE.md`) draws the plain
```

Change the parenthetical to ``(`backlog/IDEA-TEMPLATE.md`)``. Change nothing else in that
sentence or that section.

**8B — `scripts/board-shape-hook/board-shape.test.ts`.** The test titled `refuses a file sitting
directly under backlog/ and pins the whole non-candidate outcome` names the old path twice: as
`checkShape`'s first argument, and inside the expected `lines` string. Replace both with
`backlog/IDEA-TEMPLATE.md`. Leave the test's title alone — it stays true.

After `npm run format`, that block reads exactly:

```ts
it('refuses a file sitting directly under backlog/ and pins the whole non-candidate outcome', () => {
  expect(checkShape('backlog/IDEA-TEMPLATE.md', CLEAN, NO_RECORD, LANES)).toEqual({
    lines: [
      'LAYER1 backlog/IDEA-TEMPLATE.md: not a candidate, 0 checks -- only an idea file carries the candidate shape',
    ],
    deliver: false,
  })
})
```

The `lines:` array moves onto three lines because the single-line form is 120 characters today and
the new path adds five. That reflow is Prettier's, measured 2026-09-22 against this repo's
`.prettierrc.json`. Read it as the edit, not as churn.

**8C — the bounds.** Change no behaviour. `checkShape` takes a path string and touches no
filesystem, so neither edit can change what the hook does. Add no test, delete no test, and touch no
other file under `scripts/`.

**8D — `cleaner` runs on 8's manifest and may report nothing.** Its manifest holds one sidecar and
one test file, and no production module, so its scoped mutation scan has no `--mutate` target to
take from the manifest. Report that rather than choosing one.

**8E — an expansion, declinable, and the user rules it at sign-off.** `board-shape.meta.md`'s same
Ruling 3 section closes with `this slice preserves that ordering rather than introducing it`.
`claim-discipline.md` forbids "this slice" in a record, and `git log` attributes the file to
`one-item-shape-serves-every-lane`. The fix is to replace `this slice preserves` with
`` `one-item-shape-serves-every-lane` preserved ``. Cost: one more line in `coder`'s diff, one more
file-scoped `reference-check` reading that is already being taken, and no gate moves either way.
Carried if the user signs it; dropped in silence if not. It is a pre-existing defect this slice did
not create, made visible by 8A opening the file.

## Check readings

**What can move, and must be green at the end of the cycle.**

| Check                                                           | Before                        | After                             |
| --------------------------------------------------------------- | ----------------------------- | --------------------------------- |
| `npm run test:scripts`                                          | 76 files, 1223 tests, exit 0  | unchanged counts, exit 0          |
| `npm run prose-lint` on CLAUDE.md                               | 18 findings                   | no more than 18                   |
| `npm run prose-lint -- --scope .claude/skills`                  | 1, in `idea-approve/SKILL.md` | the same 1                        |
| `npm run prose-lint -- --scope .claude/references`              | 1, in `merge-protocol.md`     | the same 1                        |
| `npm run format:check`                                          | clean                         | clean                             |
| `node scripts/board-shape-hook/run.ts backlog/IDEA-TEMPLATE.md` | path missing                  | the plain not-a-candidate refusal |

The last row is the rename's acceptance reading, and item 1 is what makes it move. Take it against
the live tree after item 1, not in a throwaway one.

**What cannot move, and why saying so matters.** `npm run reference-check` reads green before this
slice and green after it, in every ordering, including an ordering that renames the file and sweeps
nothing. Two independent reasons, both measured: the checker matches by basename and
`adr/TEMPLATE.md` keeps resolving the old token, and a `.ts` file's string literals are off its scan
surface altogether. `npm run agent-doc-check` cannot move either — no `npm run` reference, agent
frontmatter, retired role or declared role cycle is touched. **This slice is guarded by review, not
by a gate.** That is why the assessment held Testable at 4, and no item below should be read as
though a checker were watching it.

**What the seat inherits at merge.** The diff reaches `scripts/`, so `hardener`'s merge-time run
gains `npm run test:mutation:scripts`, `npm run crap4ts:scripts` and `npm run dry4ts:scripts` per
`engineering.md`'s "Working inside scripts/". Expect `npm run mutation-invariance -- --diff <range>`
to exit 2, since a changed test file can move a mutation score — verify with the command rather than
reading this sentence as the verdict.

## Out of scope

- **`adr/TEMPLATE.md` keeps its name.** No-go 4. Its `adr/README.md` citation is relative to its own
  tier and resolves correctly.
- **The three `TEMPLATE.md` tokens in `.claude/references/definition-of-ready.meta.md`.** All three
  sit inside dated records — a 2026-09-13 collision census, a 2026-09-15 ruling, and a 2026-09-15
  provenance section. A dated past claim states history and does not rot. Read past them rather than
  as an oversight; the spec saw them.
- **Any classifier change.** The declaration format, the depth rule and the warning register belong
  to the sibling that landed them.
- **Any other edit to CLAUDE.md's Idea board section**, per R6.
- **Creating the epics lane**, and **re-proposing the sidecar counts**, per the proposal's no-gos.

## Recommendations — for the seat's handoff, never edits here

- **A spike: can an ambiguous basename be reported without a false-positive flood?**
  `reference-check` resolves by basename deliberately, and CLAUDE.md rules that under-report the
  safe direction. This slice is a measured instance where that ruling lets a stale citation stay
  green, which is the exact defect the checker exists to catch. Whether a directory-aware or
  ambiguity-aware check is possible at tolerable noise is unmeasured, so the honest first step is a
  spike rather than an `enabler-technical`.
- **An `enabler-technical`, conditional on that spike ruling it possible:** report a citation whose
  basename resolves against more than one tracked file.
- **A candidate, unowned by this slice:** whether a dated record should be re-anchored when its
  subject is renamed. Three tokens in `definition-of-ready.meta.md` raise it and this spec declines
  it, per Out of scope.

## Sign-off

Unsigned. `writer` has no authority until the user signs this file, and item 8 has none until the
same signature. The two places most worth overturning are **R1**, the name and the location, and
**R7**, the departure from the proposal's one-case reading. **8E** is the one item that is a
question rather than an instruction.
