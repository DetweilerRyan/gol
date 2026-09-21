# Amendment 1 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `ca69fe0`. **This amendment needs the user's re-sign-off
before `writer` runs again.** `spec.md` is immutable from its signature at `084c4ea`; the live
instruction set is that file plus this one, read in order, with this text winning where the two
meet.

## The trigger

Step 1 landed at `ca69fe0`. `editor` CLEAN found nothing to change inside the manifest and
returned six findings about what the spec did not reach. The seat verified the first
independently. **Finding 1 is a dropped obligation, and the other five are corrections the spec
under-specified.**

Ten items. Seven re-enter at step 2 now over three already-landed files. One changes what
`writer` writes at step 3, two at step 4, and one edits no file at all.

## What this supersedes

| Item | Supersedes              | File                                                    | In one line                                            |
| ---- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| 1    | A1, in part             | `definition-of-ready.md`                                | The record's shape gains a section for what follows it |
| 2    | A2, in part             | `idea-assess/SKILL.md`                                  | The judge is told to write that section                |
| 3    | nothing                 | `definition-of-ready.md`                                | The kind-row sentence matches the ruled shape          |
| 4    | nothing                 | `definition-of-ready.md`                                | The file's self-description names the record           |
| 5    | nothing                 | CLAUDE.md                                               | The routing pointer names the record                   |
| 6    | A1, in part             | `definition-of-ready.md`                                | The frontmatter bullet stops predicting a consumer     |
| 7    | A1, in part             | `definition-of-ready.md`                                | The kind-and-disposition bullet's reason covers both   |
| 8    | A1 and D1, each in part | `definition-of-ready.md`, `definition-of-ready.meta.md` | The duplicated explanation sits on the sidecar alone   |
| 9    | C4, in part             | `pipelines.md`                                          | One clause drops a predicted consumer                  |
| 10   | the ordering rationale  | none                                                    | Two overstated claims corrected in the record          |

**Items 3, 4 and 5 supersede nothing**, because no spec item reaches the lines they change. They
need the user's signature on the same terms as the rest.

**Nothing else in `spec.md` changes.** Every other item, every ruling under "What this spec
settles", the out-of-scope list and the file set all stand as signed.

## Item 1 — the record's shape gains what happens after it

**Supersedes A1 in part.** A2 replaced `idea-assess/SKILL.md` whole, and the replacement dropped
an obligation the old file carried in its closing line:

```text
Return the record: kind, per-letter findings with scores, the disposition, and — for epic or spike — what the exit names.
```

**The kind, the findings and the disposition all survive**, because the record's ruled shape
carries each and the judge returns the record. **What the exit names has no home in that shape**,
so a judge ruling Epic or Spike is now asked by nobody for the one output those two dispositions
exist to produce.

**Ruled: it goes in the record, not in the closing report line.** The two are not equivalent. A
report line asks the judge to say it once, into a conversation; the record's shape makes it part
of the durable artifact. **This slice exists because the record outlives the conversation**, so
the durable half is the only one that answers the finding.

**Ruled: the section is unconditional.** A section present only for Epic and Spike fails exactly
the way the closing line failed — by depending on the judge remembering a trigger. A heading
missing from a record is visible against the stated shape; a forgotten conditional is not.

**Ruled: the heading is `What happens next`, and `The exit` was declined.** `pipelines.md` uses
**Exit:** for a pipeline's exit criteria, which is a different fact about a different subject, and
this file's own disposition table already heads the column "What happens". Reusing the table's
words ties the section to the table it cites and adds no vocabulary.

### 1a — the bullet list

**Find** (a whole line, unique in the file):

```text
- **The human's ruling closes the record**, under its own heading, and arrives later than the rest.
```

**Replace with:**

```text
- **The judged half closes with what happens next**, under its own heading, naming what the ruled disposition hands on.
  - **Epic** — the child candidates the split would produce.
  - **Spike** — the spike's question, and the letters it would move.
  - **Ready or Not worth doing** — the disposition's own next step from the table, in one line.
- **The human's ruling closes the record**, under its own heading, and arrives later than the rest.
```

### 1b — the skeleton

**Find** (three whole lines inside the `text` fence, unique in the file):

```text
## Testable

## The human ruling
```

**Replace with:**

```text
## Testable

## What happens next

## The human ruling
```

## Item 2 — the judge is told to write that section

**Supersedes A2 in part**, in the "Rules that bind the record" block.

**Find** (a whole line, unique in the file):

```text
- Close with the human-ruling heading and `None recorded.` The ruling is a separate act, and `/idea-approve` writes it.
```

**Replace with:**

```text
- Name what happens next under its own heading. An Epic or a Spike names its children or its spike there, and nowhere else.
- Close with the human-ruling heading and `None recorded.` The ruling is a separate act, and `/idea-approve` writes it.
```

**The closing report line stays exactly as it landed.** `Return the record and the path you
wrote, so the seat can rule on it.` The judge returns the record in full, and the record now
carries the exit, so the old line's obligation arrives through the artifact rather than beside
it.

**Two sentences, both under the caps the skills surface takes.** `Instruction.ListItemSentences`
allows three, and neither sentence reaches `STE.SentenceLength`'s 25 words.

## Item 3 — the kind-row sentence matches the ruled shape

**Supersedes nothing.** The sentence predates this slice and no spec item reaches it. It now
mis-describes a shape the same file rules further down: the record's summary table holds one row
per letter, and the kind sits in the prose line above.

**Ruled: reword the sentence; do not give the skeleton a kind row.** The table's own rule is one
row per letter in INVEST order, so a non-letter row there would contradict the shape ruled
2026-09-20. The 2026-09-14 ruling the sentence records is about the label being present, not about
which element carries it, and the prose line honours it.

**Find** (a clause; one occurrence):

```text
An assessment record's kind row carries the label, so a reader oriented by SAFe never has to look the mapping up.
```

**Replace with:**

```text
An assessment record carries the label beside the kind, so a reader oriented by SAFe never has to look the mapping up.
```

The `Ruled by the user 2026-09-14.` sentence that follows is untouched, and stays the dated record
the claim rests on.

## Item 4 — the file's self-description names the record

**Supersedes nothing.** No spec item reaches this line.

**Find** (a clause; one occurrence):

```text
This file carries the assessment: two pre-questions, six predicates, anchored scores, and four dispositions.
```

**Replace with:**

```text
This file carries the assessment: two pre-questions, six predicates, anchored scores, four dispositions, and the record that holds the result.
```

**Observed and left: the same sentence does not name Layer 3's calibration record either.** That
predates this slice, and calibration is what the assessment is measured by rather than a part of
it. Out of scope, named here so a later reader does not take the omission for an oversight this
amendment introduced.

## Item 5 — the routing pointer names the record

**Supersedes nothing**, and it is the one item that reaches a file for a reason outside the
record's own shape. CLAUDE.md routes a reader to `definition-of-ready.md` by naming what the file
covers, and the record's shape is now the biggest thing that list omits.

**Ruled: a second sentence, not a longer first one.** The first sentence measures 22 words today
and carries no `STE.SentenceLength` finding. Extending its list would cross 25 and add a finding
the spec's reading table forbids.

**Find** (a clause; one occurrence):

```text
the idea board's readiness assessment: the kind discriminator, the six anchored predicates, the four dispositions, and the calibration record.
```

**Replace with:**

```text
the idea board's readiness assessment: the kind discriminator, the six anchored predicates, the four dispositions, and the calibration record. It also states the assessment record's shape.
```

## Item 6 — the frontmatter bullet stops predicting a consumer

**Supersedes A1 in part.** `Frontmatter carries the three facts a machine reads` asserts a
consumer that does not exist: nothing parses the record's frontmatter today, and the checker that
would belongs to `checkers-do-not-reach-the-assessment-sidecar`. That is
`claim-discipline.md`'s predicted-caller shape, which never falsifies itself — on the day the
checker lands the sentence still reads as a plan rather than as a claim that was wrong for
months.

**Find** (a whole line, unique in the file):

```text
- **Frontmatter carries the three facts a machine reads**: `name`, the idea's slug; `assessed`, the date; and `idea-blob`, the idea file's git blob id at assessment.
```

**Replace with:**

```text
- **Frontmatter carries three fields**: `name`, the idea's slug; `assessed`, the date; and `idea-blob`, the idea file's git blob id at assessment.
```

**One thing the replacement drops, and it is ruled out rather than restored.** The old bullet
justified the frontmatter exception in four words. No single justification is true of all three
fields — D1's own "which field is weakest" paragraph says `name` restates the basename that
position already supplies. So the justification moves nowhere and the field list stands alone,
which is what the bullet is for. `definition-of-ready.meta.md` carries the per-field argument once
D1 lands.

## Item 7 — the kind-and-disposition bullet's reason covers both

**Supersedes A1 in part.** Two defects in one sentence. The stated reason covers kind alone, since
nothing copies the disposition anywhere, and `this file's frontmatter` reads first as
`definition-of-ready.md`'s own frontmatter rather than the record's.

**Find** (a whole line, unique in the file):

```text
- **Kind and disposition sit in prose above the table.** The seat copies the kind ruling into the idea's own frontmatter, so neither belongs in this file's frontmatter.
```

**Replace with:**

```text
- **Kind and disposition sit in prose above the table**, not in the record's frontmatter. Both are judged rulings that a reader takes with the findings beside them, and the idea file's frontmatter is the kind's one home.
```

**One thing the replacement drops, and it is ruled out rather than restored.** `The seat copies
the kind ruling into the idea's own frontmatter` states another actor's duty, and this same file
already states it in the opening section: "The judging pass rules the label, the orchestrating
seat writes it when recording the ruling, and the seat reads it to plan the role cycle." A second
copy further down the same file is the restatement `prose.md` names as the one legitimate
deletion, and CLAUDE.md remains the routing home for who writes `kind:`.

## Item 8 — the duplicated explanation sits on the sidecar alone

**Supersedes A1 and D1, each in part.** A1 landed a sentence in the instruction file that D1
appends to the sidecar in near-identical wording. Under `prose.md`'s split the explanation moves
rather than living on both sides: the reader's next action is the same with or without it, and
nobody following the rule needs it.

**Both halves execute in the same `writer` pass, at step 4.** Deleting the instruction copy before
its destination lands would leave the argument nowhere, which is the shape `prose.md` names as a
lint pass's characteristic damage. Paired, the corpus is never short of it.

### 8a — `definition-of-ready.md`, the third sentence goes

**Find** (a whole line, unique in the file):

```text
**`idea-blob` is what makes a stale record visible.** Take it with `git hash-object -- backlog/ideas/<name>.md`. Git already assigns the file that id, so the assessed text stays retrievable by it and sync is a comparison rather than a second scheme.
```

**Replace with:**

```text
**`idea-blob` is what makes a stale record visible.** Take it with `git hash-object -- backlog/ideas/<name>.md`.
```

The first sentence states what the field is for and the second is the command. Both are
instruction and both stay.

### 8b — D1 gains the clause its destination is missing

D1's wording drops `rather than a second scheme`, which is the rejected alternative and the most
sidecar-shaped part of the sentence. Carrying the deletion without carrying that clause would lose
it from the corpus entirely.

**In item D1's Append block, one sentence changes. Find:**

```text
It is the id git already assigns the file, so the assessed text stays retrievable by that id and sync is checkable against the committed tree.
```

**Replace with:**

```text
It is the id git already assigns the file, so the assessed text stays retrievable by that id and sync is a comparison against the committed tree rather than a second scheme.
```

Every other sentence in D1 stands as signed. The sidecar is exempt from every Vale rule, so no
word cap binds the longer sentence.

## Item 9 — one clause drops a predicted consumer

**Supersedes C4 in part**, and reaches text that has not landed. Item 6's shape occurs once more
in the signed spec, narrower and in a block `writer` writes at step 3.

**In item C4's Replace block, one sentence changes. Find:**

```text
A blob id is a machine-read fact no position supplies, so it stays in frontmatter after the move.
```

**Replace with:**

```text
A blob id is a fact no position supplies, so it stays in frontmatter after the move.
```

`no position supplies` is the whole argument for the exception, and it is checkable today.
`machine-read` adds a consumer to it and nothing else. The rest of C4's Replace block, and its
allow-marker edit, stand as signed.

## Item 10 — two claims in the ordering rationale, corrected

**Supersedes the ordering section's rationale in part, and edits no file.** `spec.md` is
immutable, so the corrected claims live here and this text wins.

**The spec says step 1 "contradicts nothing".** It overstates. Step 1 leaves the promotion
procedure it does not touch still reading the judge's record out of the conversation, and that
half is true. But between step 1 and step 3 `definition-of-ready.md` contradicts **itself**: the
landed section says the ruling is its own act that `/idea-approve` records, while Layer 3 still
says the promotion commit carries both records. CLAUDE.md's promote bullet carries the same stale
half.

**Both halves close at step 3, and nothing about the contradiction escapes items C3 and C6.**
`editor` confirmed that reading at CLEAN: C3's Find block is two paragraphs and reaches both
halves of the Layer 3 text, and C6 takes CLAUDE.md's promote bullet.

**The spec says `/idea-assess` is safe to run from step 1.** It overstates in two ways the word
"safe" hides. A record written before step 2 names `/idea-approve`, which does not exist until
then. And a judge told to read `definition-of-ready.md` in full reads the self-contradiction above
until step 3 lands.

**Neither changes what the judge writes**, since the record's whole shape lands with step 1. Both
argue for running the remaining steps without a pause, rather than for reordering anything. **The
ordering itself stands as signed.**

## How the cycle re-enters

**Pass A — step 2, now.** Items 1, 2, 3, 4, 5, 6 and 7, over three files:
`.claude/references/definition-of-ready.md`, `.claude/skills/idea-assess/SKILL.md` and
`CLAUDE.md`. One commit, `editor` CLEAN after it.

**Pass B — the spec's step 3.** Item 9 changes one sentence of what `writer` writes for item C4.
No extra pass.

**Pass C — the spec's step 4.** Items 8a and 8b together, in the same commit as D1 to D4.

**No pass.** Item 10.

## Expected readings — predicted, not measured

**Baselines measured 2026-09-20 in this worktree at tip `ca69fe0`, with `.vale/` synced.** `coach`
edits no corpus file, so no reading below was taken with the items applied. A divergence is a
finding for `editor` CLEAN or `coach` REVIEW, never a licence to edit this file.

| Check                                            | At tip `ca69fe0`                   | Predicted after pass A               |
| ------------------------------------------------ | ---------------------------------- | ------------------------------------ |
| `vale .claude/references/definition-of-ready.md` | 0 in 1 file                        | 0 in 1 file                          |
| `vale .claude/skills/idea-assess/SKILL.md`       | 0 in 1 file                        | 0 in 1 file                          |
| `vale CLAUDE.md`                                 | 20 warnings in 1 file              | 20 warnings — item 5 adds no finding |
| `npm run agent-doc-check`                        | 54 docs, 8 agents, 32 rules, clean | unchanged, clean                     |
| `npm run reference-check`                        | 537 files, 3,206 refs, no failures | unchanged or one ref more, clean     |
| `npx prettier --check` on the three files        | clean                              | clean                                |

**A CLAUDE.md count above 20 is a finding.** The spec's own table allowed 20 or 21 before step 1
landed; `writer` measured 20 at `ca69fe0`, and item 5 must not move it.

**Read item 1a's list structure after the edit.** It nests three sub-bullets under a new top-level
bullet, which is the shape `prose.md` names as invisible to `format:check`. Count top-level
bullets in that list before and after: eight before, nine after, plus three nested.

## Sign-off

The user signs this amendment before `writer` runs pass A. The file set stays the seven files
`spec.md` names, and nothing here reaches `scripts/`, `src/`, `vale-styles/` or `.vale.ini`.
