# Amendment 6 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `50cff34`. **This amendment needs the user's signature
before `writer` runs.** It carries five items, numbered **10 to 14**, continuing the sequence.

**`spec.md` and amendments 1 to 5 are all signed and immutable.** Nothing in any of them is
reworded, renumbered or reordered. The live instruction set is seven files read in number order.

## The scope ruling, before the items

Nine findings reached me. **They are not equivalent, and five of them land here while one becomes
a board item.** The test I applied to each: **does leaving it cause a wrong action that nothing
later catches?**

| Finding | Wrong action if left                                                        | Caught later?                                          | Ruling  |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------ | ------- |
| A       | A reader derives the folder form and gets a dot-leading string              | No                                                     | Land    |
| B       | A writer omits a marker in an evidence file, as the stated contract permits | No — this is the state that reddened the gate          | Land    |
| C       | None today; the numeral is a census that rots later                         | —                                                      | Land    |
| D       | A reader writes a record with one frontmatter field instead of three        | No                                                     | Land    |
| E       | A reader trusts a hook reading that reports findings, not a refusal         | —                                                      | Land    |
| F       | The judge assesses a record as an idea and writes a record of a record      | No                                                     | Land    |
| G       | The user is sent to re-assess a frozen item                                 | Yes — `/idea-assess` refuses a promoted target         | Land    |
| H       | A proposal never gets its `kind:` line                                      | No — the slice removed the precondition that caught it | Land    |
| I       | The seat rules a disposition itself, bypassing the judging pass             | **Yes** — see below                                    | Capture |

**C, E and G are the marginal three, and all three land because they ride a file another item
forces open.** C sits in D's own paragraph, E sits two paragraphs below it in the same file, and G
is a four-bullet reorder in a file F does not touch but which is already in the set. A board item
for any of them would cost a full cycle to buy a change already paid for.

**I is the one that becomes a board item, and the reasons are three.**

1. **It is caught by a later read.** `orchestration.md` is read at session start.
   `definition-of-ready.md` is read _before assessing a candidate, promoting an idea, or ruling a
   disposition_ — at the moment of the act — and it states the correct rule. The narrower, later
   read wins, so a seat about to rule a disposition is corrected before it acts.
2. **It is the only finding that widens the file set**, and the constraint says not unless forced.
   Every other file below entered the set at the spec or at amendment 2.
3. **Half of it is not amendment work at all.** Its stale enumeration of what CLAUDE.md's board
   section carries is a **file list**, which CLAUDE.md's own Conventions bullet leaves to the seat
   as recorded staleness, with the user's approval and no pipeline. Splitting one paragraph across
   two authorities inside a sixth amendment is worse than handing the whole file to one item.

**What AUDIT found sound is taken as given and not re-derived** — the claim-discipline sweep, the
dating discipline, the lifecycle's cross-file agreement, the two new role-file boundaries not
colliding, and the four allow-markers each carrying a reason.

## What this supersedes

| Item | Supersedes                                  | File                                   |
| ---- | ------------------------------------------- | -------------------------------------- |
| 10   | Amendment 5's item 9, in part               | `definition-of-ready.meta.md`          |
| 11a  | C4's Replace block as amended, in part      | `pipelines.md`                         |
| 11b  | nothing — two paragraphs no spec item names | `pipelines.md`                         |
| 12   | A2, in part                                 | `.claude/skills/idea-assess/SKILL.md`  |
| 13   | B1, in part                                 | `.claude/skills/idea-approve/SKILL.md` |
| 14   | Amendment 2's item 4c, in part              | `.claude/skills/idea-promote/SKILL.md` |

**The file set does not widen.** All five files entered it at the spec.

## Item 10 — the derivation and the contract, both inside my own item 9

**Supersedes amendment 5's item 9 in part.** Two defects in one paragraph I wrote.

**A. The paragraph performs one subtraction twice and lands on two strings.** "The same basename
without the placeholder" drops `<name>` and leaves a dot-leading string — precisely the string the
same paragraph's closing sentence names as the one the extractor discards. The instruction half
states the folder form without a leading dot. **The fix names the dot explicitly, and the closing
sentence now reads as the same mechanism from the other side** rather than as a contradiction.

**B. The stated contract is narrower than the checker and narrower than the defect it repairs.**
"Wherever an instruction file names it" excludes evidence files. `reference-check` scans every
`.md` outside the board, and **the file that reddened the gate was this sidecar** — an evidence
file. Read literally, my contract licensed the exact state item 9 existed to remove.

**Find** (one whole paragraph body, unique in the file):

```text
`backlog/ideas/<name>.assessment.md` in the ideas lane, and the same basename without the
placeholder in the item's folder. The folder form is a bare filename token
`npm run reference-check` resolves by basename, so it needs an allow-marker wherever an
instruction file names it, until the first item carries one. That is the shape the board's other
unlanded artifact name already carries — the multi-unit task list. Each marker carries its own
reason, and the checker's own stale-marker check is what retires it. The first form costs nothing:
the extractor discards a token whose basename starts with a dot, which is what the placeholder
form reduces to.
```

**Replace with:**

```text
`backlog/ideas/<name>.assessment.md` in the ideas lane, and the same name with the placeholder
and its following dot dropped in the item's folder. Dropping the placeholder alone would leave a
dot-leading string, which is a different token with the opposite mechanical consequence. The
folder form is a bare filename token `npm run reference-check` resolves by basename, so it needs
an allow-marker wherever it appears outside the board — in an evidence file as much as an
instruction file — until the first item carries one. That is the shape the board's other unlanded
artifact name already carries — the multi-unit task list. Each marker carries its own reason, and
the checker's own stale-marker check is what retires it. The placeholder form costs nothing, and
that is the same mechanism read the other way: the extractor discards a token whose basename
starts with a dot.
```

**The bare token still never appears**, so item 9's ruling is executed rather than reopened. The
reference count is unchanged at 3,216, measured, so the reword adds and removes no token.

## Item 11 — three corrections in `pipelines.md`

### 11a — the exception is granted narrower than the record it licenses, and it carries a census

**Supersedes C4's Replace block as amended, in part.** Two defects in one paragraph.

**D. The general rule above refuses `name:` and `created:` by name, and the exception licenses
only one ground** — a blob id no position supplies. But the record mandates three fields, two of
them the ones just refused. **A reader of `pipelines.md` who writes a record drops two fields and
is correct by that file.** The argument that saves them lives only in the sidecar, which carries
no read trigger.

**The fix states the ground that covers all three**: the artifact begins before its folder exists,
so position supplies none of its identity at the moment it is written. The blob id then becomes
the strongest instance rather than the only ground.

**C. "names the three fields" is a census of another file's structure**, standing with no
enumeration beside it. `claim-discipline.md` rules it dropped rather than corrected. The drift is
not hypothetical: the sidecar predicts it, saying `name` is the weakest of the three and a later
ruling may drop it.

**Find** (three whole lines, unique in the file):

```text
`assessment.md` begins beside the idea, before the folder exists, and it stores the assessed idea
file's git blob id. A blob id is a fact no position supplies, so it stays in frontmatter after the
move. `.claude/references/definition-of-ready.md` names the three fields.
```

**Replace with:**

```text
`assessment.md` begins beside the idea, before the folder exists, so no position identifies it
until the promotion moves it. That is the ground for every field it carries, not only for the git
blob id it stores. That blob id belongs to the assessed idea file, and no position supplies it at
any point. `.claude/references/definition-of-ready.md` names the fields.
```

**Nothing is dropped.** The exception's rule, the blob id's provenance, the fact that it stays in
frontmatter after the move, and the pointer all survive. Only the numeral goes, and the ground
widens.

### 11b — two paragraphs the new artifact falsifies

**Supersedes nothing; no spec item names these lines.** `editor` probed rather than read: it wrote
a real record to the ideas lane and ran the hook, which returned **5 findings, delivered**, because
the classifier's candidate test is positional and reads any two-segment board path as an idea
file.

**Scoping both claims to an item's folder makes each true and keeps it true.** The folder form
refuses correctly, so the claims were never wrong about their own subject — my own C4 insertion
widened the section's subject to the ideas-lane phase, and the claims did not follow.

**A scoped claim alone would invite the false inference**, which is B's lesson applied one
paragraph later. So the ideas-lane behaviour gets its own dated paragraph naming the owner, rather
than a silence a reader fills in wrongly.

**Find 1** (two whole lines):

```text
position rather than by basename, so an artifact kind nobody has named yet is covered on the day
it lands.
```

**Replace with:**

```text
position rather than by basename. So an artifact kind nobody has named yet is covered in an item's
folder on the day it lands.
```

**The split keeps the causal connective rather than losing it**, which is the shape `prose.md`
warns a split usually damages. `So` carries what `so` carried.

**Find 2** (one whole paragraph):

```text
**The board hook checks no per-item artifact.** It prints a non-candidate line rather than
findings. Read that line as a refusal to assess, never as a pass. Vale's `Board.NoStatusField`
still reaches every board file, artifacts included.
```

**Replace with:**

```text
**The board hook checks no per-item artifact in an item's folder.** It prints a non-candidate line
rather than findings. Read that line as a refusal to assess, never as a pass. Vale's
`Board.NoStatusField` still reaches every board file, artifacts included.

**An assessment record in the ideas lane is the exception, and it is not yet refused.** Measured
2026-09-20: such a record is two segments, so the same classifier reads it as an idea file and
reports findings. `checkers-do-not-reach-the-assessment-sidecar` owns the fix.
```

**The new paragraph is dated, so it does not rot when the fix lands.** It states what was measured
on a day, not what is permanently true, and it names the slice that owns the change rather than
leaving a reader to wonder whether anybody does.

## Item 12 — `/idea-assess` refuses a record by its own name

**Supersedes A2 in part.** The non-candidate guard is inert against the class the slice added:
per 11b's measurement that line never appears for an ideas-lane record. In the same diff the skill
lost `disable-model-invocation`, so a model now chooses the target. **The hook path is covered and
load-bearing; it is the argv path that is open.**

**The consequence is silent, which is why it lands here.** The write rule says "Write exactly one
file, `backlog/ideas/<name>.assessment.md`, beside the target", which for a record target has no
well-defined placeholder, and the grant would permit a record of a record.

**Ruled: refuse the target by its own basename, before Layer 1's guard rather than instead of
it.** The grant cannot express the exclusion — no glob says "not ending in that suffix" — so the
remedy is a prose stop condition. It sits with the other stop conditions because it must fire
before any assessment, not among the write rules.

**Find** (a whole line, unique in the file):

```text
**A `not a candidate` line means the target is a per-item artifact rather than an idea file — stop and say so, and score nothing.**
```

**Replace with:**

```text
**A `not a candidate` line means the target is a per-item artifact rather than an idea file — stop and say so, and score nothing.**

**A target whose basename ends `.assessment.md` is a record rather than an idea — stop and say so, and score nothing.** Layer 1 does not refuse it, since the classifier reads position rather than basename.
```

**The suffix is written dot-leading deliberately**, so it costs no allow-marker by the same
mechanism item 10's paragraph states. Measured: the reference count does not move.

## Item 13 — `/idea-approve` checks the lane first

**Supersedes B1 in part.** For a promoted item the record has already moved, so precondition 1
fires and reports that `/idea-assess` writes it — sending the user to re-assess a frozen item.
Precondition 4 carries the true cause and is reached only if a stray ideas-lane record survives a
promotion, which `/idea-promote`'s second move prevents.

**Ruled: a pure reorder, no wording change.** The list says "checked in order", so order is the
instruction. Moving the lane check to first makes precondition 1 unreachable for a promoted target
and its message correct for every target that does reach it. `/idea-assess` already handles the
same case in its own write rules.

**Find** (the first list item, hand-wrapped across two lines):

```text
- **The record must exist**, at `backlog/ideas/<name>.assessment.md`. Absent one, stop and report that `/idea-assess`
  writes it.
```

**Replace with:**

```text
- **The target must sit in the ideas lane.** A promoted record is frozen. Stop and say so.
- **The record must exist**, at `backlog/ideas/<name>.assessment.md`. Absent one, stop and report that `/idea-assess`
  writes it.
```

**Then find** (the last list item with the line above it, unique in the file):

```text
  and stop.
- **The target must sit in the ideas lane.** A promoted record is frozen. Stop and say so.
```

**Replace with:**

```text
  and stop.
```

**Nothing is dropped and nothing is reworded.** `git diff --stat` on the candidate reports one
insertion and one deletion, which is what a pure move measures as.

## Item 14 — the mandatory `kind:` write leaves the optional step

**Supersedes amendment 2's item 4c in part. This is my own item 4, one step short of landing.**
Step 4 is conditional — "if the file needs it" — and the `kind:` instruction nests inside it.
CLAUDE.md states the write unconditionally, and the slice removed the precondition that used to
catch a missing line. **So a proposal needing no fleshing out never gets its `kind:` line, and
nothing catches it.**

**Ruled: `kind:` gets its own step, and the commit gets one too.** Three steps rather than one
keeps each under `Procedure.ProcedureLength`'s cap and makes the conditional attach to the one
action that is actually conditional.

**Find** (a numbered step and the paragraph below it):

```text
4. Flesh out the proposal afterwards, as its own commit, if the file needs it.

**`kind:` is written after the move, never before it.** Take it from the record in step 4, absent one in the proposal already. Any earlier edit to the idea file changes its blob id and makes the record stale.
```

**Replace with:**

```text
4. Add the `kind:` line from the record to the proposal's frontmatter, absent one already.
5. Flesh out the proposal, if the file needs it.
6. Commit steps 4 and 5 together, separately from the move commit.

**`kind:` is written after the move, never before it.** Step 4 is unconditional, and runs whether or not step 5 has anything to do. Any earlier edit to the idea file changes its blob id and makes the record stale.
```

**Every clause of the replaced text survives.** "Afterwards" is the step order. "As its own commit"
becomes step 6, stated rather than implied. "If the file needs it" attaches to step 5 alone. "Take
it from the record" and "absent one already" move into step 4. The blob-id warning is verbatim.

## Which pass the items run in

**One pass, five files, one commit**, with `editor` CLEAN after it. No item depends on another and
no file is touched by two items, so the pass has no internal ordering.

## Measured readings — every candidate probed, every probe discriminating

**Measured 2026-09-20 in this worktree at tip `50cff34`.** The candidates were applied in place,
every gate was run, and the files were restored from copies taken before the edits.
`git status --porcelain` and `git diff --stat` both reported empty afterwards, so the corpus is
byte-identical to the tip. **In-place measurement was forced again** — `reference-check` scans the
whole tree rather than a named file, so a probe copy would be scanned as an extra file.

| Check                                    | At tip `50cff34`                                 | With items 10 to 14 applied            |
| ---------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| `vale` over the five files               | 1 warning — the sanctioned `HistoricalNarration` | **1 warning, the same one**            |
| `npm run reference-check`                | 538 files, 3,216 refs, no failures               | **538 files, 3,216 refs, no failures** |
| `npm run agent-doc-check`                | 55 docs, 8 agents, 32 rules, clean               | **unchanged, clean**                   |
| `npx prettier --check` on the five files | clean                                            | **clean**                              |
| `vale CLAUDE.md`                         | 19 warnings                                      | **19, untouched**                      |

**The reference count does not move at all**, which is the precise reading for item 10: the reword
neither adds nor removes a token, and the bare form stays absent.

**Three deliberate discriminators, each reporting:**

| Probe                                                     | Reported                                      |
| --------------------------------------------------------- | --------------------------------------------- |
| Item 12's guard written in five sentences rather than two | `Instruction.ParagraphSentences`, 5 sentences |
| Item 14's step 4 written past the 20-word cap             | `Procedure.ProcedureLength`, 29 words         |
| Item 11b's new paragraph written past the 25-word cap     | `STE.SentenceLength`, 37 words                |

**A fourth discrimination happened by accident, and it is the most useful one.** My first draft of
item 11a read "That blob id is the assessed idea file's", and the probe reported
`STE.Contractions` — a rule I had not considered, on a possessive the original text carried
without tripping. **I rewrote to "belongs to the assessed idea file" and re-measured.** Without
the probe that finding would have landed.

**That is the third data point for amendment 4's recommendation**, and it arrived from a rule
nobody was counting rather than from a count done wrong. Amendment 4 named two mechanisms that
defeat a hand count; this one names a third failure — **a hand count checks the rules you thought
of.**

## The standing recommendations, named so none is lost

Three, none restated at length here:

1. **`prose.md`** — a predicted Vale reading is probed rather than counted by hand. Recorded in
   amendment 4, and now carrying a third instance.
2. **`pipelines.md` and `orchestration.md`** — a signed spec or amendment reaches `writer` whole,
   and an amendment declares its item numbers so `writer` can report what it received. Recorded in
   amendment 5.
3. **`orchestration.md`** — finding I. Its board bullet says the seat rules one of the four
   dispositions, which the slice moved to the judging pass, and its enumeration of CLAUDE.md's
   board section omits the assessment record. `editor` measured that no other unedited file
   carries a board-procedure claim, so the item is one file with no sweep behind it. **The
   enumeration half is seat residue under CLAUDE.md's Conventions bullet; the disposition half is
   conduct and needs the pipeline.**

## Sign-off

The user signs this amendment before `writer` runs. **The file set does not widen.** All five
files entered it at the spec, and nothing here reaches `scripts/`, `src/`, `vale-styles/` or
`.vale.ini`.
