# Amendment 2 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `114cb92`. **This amendment needs the user's re-sign-off
before `writer` runs again.** `spec.md` and `amendment-1.md` are both immutable from their
signatures at `084c4ea` and `413acbc`. The live instruction set is the three files read in number
order, with this text winning where they meet.

## The trigger

Steps 1, 2 and 3 have landed, plus amendment 1's pass A. `editor` CLEAN ran after each and changed
nothing in all four. **Six items.** `editor` probed remedies for three and measured them clean;
this amendment takes all three. Three more are rulings the spec did not reach, and one of those is
a substantive contradiction between two landed files.

Step 4 has not run, so two items ride with it rather than needing a pass of their own.

## What this supersedes

| Item | Supersedes                           | Files                                                                                       |
| ---- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1    | C1 in part, B1 in part               | `idea-promote/SKILL.md`, `idea-approve/SKILL.md`                                            |
| 2a   | C6 in part                           | CLAUDE.md                                                                                   |
| 2b   | C5 in part                           | CLAUDE.md                                                                                   |
| 3    | C2 in part                           | `coach.md` — no corpus edit to `definition-of-ready.md`                                     |
| 4    | C1 in part, and C1's accounting note | CLAUDE.md, `definition-of-ready.md`, `idea-promote/SKILL.md`, `definition-of-ready.meta.md` |
| 5    | C4 in part                           | `pipelines.md`                                                                              |
| 6    | nothing                              | none — a ruling, no edit                                                                    |

**Item 4 also reaches CLAUDE.md's `kind` paragraph and `definition-of-ready.md`'s opening
paragraph, which no spec item names.**

**Nothing in `amendment-1.md` is superseded.** Its items 8a, 8b and 9 stand, and 8a and 8b still
ride with step 4.

**The file set widens by one, to `.claude/agents/coach.md`** — item 3's durable half. Every other
file named here is already in the signed set.

## Item 1 — one wording for the sync precondition, in both skills

**Supersedes C1 in part and B1 in part.** The spec wrote the same precondition twice, in two
shapes, and `writer` executed each as given. Neither landed line is right.

**`/idea-promote`'s is four sentences against a cap of three.** Its fourth sentence is a conjunct:
one explanation clause the bold lead already carries, plus one live instruction. `editor` rules the
remedy is compression rather than a split or a sidecar move, and I take that ruling — the stray
clause restates the lead, which is the one legitimate deletion.

**`/idea-approve`'s is three sentences and substantively weaker.** It drops `/idea-approve` from
the remedy. After step 3 a fresh `/idea-assess` alone cannot clear a promotion, because the
replaced record carries no ruling.

**Ruled: both files take the same bytes.** One fact gets one wording, so no paraphrase can drift.
Naming `/idea-approve` inside `/idea-approve` is accurate rather than circular — the invocation
being refused is the one that must run again after the re-assessment.

### 1a — `.claude/skills/idea-promote/SKILL.md`

**Find** (a whole line, unique in the file):

```text
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result against the record's `idea-blob`. On a difference, stop and report it. The record describes text the idea has since changed, and the recommended remedy is a fresh `/idea-assess` followed by a fresh `/idea-approve`.
```

**Replace with** — `editor`'s candidate, measured clean under the full skills rule set, with the
probe confirmed discriminating by reporting one finding on the landed text:

```text
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result against the record's `idea-blob`. On a difference, stop, report it, and recommend a fresh `/idea-assess` followed by a fresh `/idea-approve`.
```

**One thing the replacement drops, and it is ruled out rather than restored.** `The record
describes text the idea has since changed` explains what a blob difference means. The bold lead
already says the record must be in sync, so the clause tells a reader nothing that changes the
next action. `definition-of-ready.meta.md` carries the blob argument once step 4 lands.

**`Procedure.OneInstruction` does not fire on the three-verb tail**, because it needs `, then` or
`and then` before an imperative.

### 1b — `.claude/skills/idea-approve/SKILL.md`

**Find** (one list item, hand-wrapped across two lines):

```text
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result
  against the record's `idea-blob`. On a difference, stop and report it, and recommend a fresh `/idea-assess`.
```

**Replace with the same bytes item 1a lands**, rewrapped to 120 by prettier:

```text
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result against the record's `idea-blob`. On a difference, stop, report it, and recommend a fresh `/idea-assess` followed by a fresh `/idea-approve`.
```

The file's own rules block already says a fresh assessment discards the ruling. That bullet stays;
this precondition now carries the same remedy at the moment the refusal happens.

## Item 2 — CLAUDE.md reads 21 against a budget of 20

Two defects, and only one of them is a count. **A budget expressed as a count is blind to a
finding getting worse**, which is how item 2b reached the auto-loaded file with nothing to surface
it.

### 2a — the new finding, at the promote bullet

**Supersedes C6 in part.** C6's second replacement is 34 words against a 25-word cap; the clause
it replaced was 20.

**Find** (a clause; one occurrence):

```text
The move commit's body carries the judge's summary rather than either record in full, since the assessment record already holds both halves: the judge's at assessment, and the human's per-letter ruling whenever `/idea-approve` recorded it.
```

**Replace with** — `editor`'s candidate, measured clean, keeping the causal link rather than
losing it to a bare split:

```text
The assessment record already holds both halves — the judge's at assessment, and the human's per-letter ruling whenever `/idea-approve` recorded it. So the move commit's body carries the judge's summary rather than either record in full.
```

**CLAUDE.md keeps one line per paragraph**, so this lands as one line inside the existing
indented continuation. The two sentences that follow it are untouched.

### 2b — the degradation, at the ready-lane bullet

**Supersedes C5 in part.** C5 appended `assessment.md` to an enumeration that was already a
finding, taking the sentence from 31 words to 44. The count moved 20 to 21 and attributed none of
that to C5.

**`editor` measured two remedies clean and declined to choose. Ruled: the nested bullet list.**
Three reasons:

1. **`prose.md` prefers it outright** — "Prefer nested bullets to a packed sentence", with one
   instruction per line under a bolded lead. The content is an enumeration of six artifacts with a
   condition on each, which is the shape the rule is written for.
2. **The size objection does not survive being stated in tokens.** Five auto-loaded lines against
   one counts delimiters, not content. The words are the same either way; only the bullet markers
   and the newlines are added. CLAUDE.md's own warning is that its **size** taxes six audiences,
   and newlines are not what that sentence is about.
3. **A routing index is read by scanning.** The flat form buries the sixth artifact behind five
   semicolons in a 44-word sentence, which is the defect rather than the lint finding.

**The reorder is deliberate, and it carries a fact the flat list hid.** `proposal.md` and
`assessment.md` are the two artifacts every promoted item carries — `/idea-promote` refuses
without a record. The other four are conditional. Putting the two unconditional entries first
makes that visible; the flat list had `assessment.md` last, behind four conditionals.

**Find** (the whole line, unique in the file):

```text
- **`backlog/ready/<name>/`** — assessed against `.claude/references/definition-of-ready.md` (advisory, since this board has no gate) and concrete enough to start. A ready item is a **folder**: `proposal.md` (the promoted idea file) always; `design.md` when the design-pass triggers fire; `spec.md` when a process enabler runs `coach` SPEC; `tasks.md` when dispatch is multi-unit; `findings.md` for a spike's recorded answer; `assessment.md` once the item has been promoted, carrying the assessment it was promoted on. **Only `proposal.md` carries the idea-file shape**; `.claude/references/pipelines.md` states what a per-item artifact owes instead. The orchestrating session owns this board: no role reads it, and an item reaches a role as prompt content rather than as a file path. Keep this lane to about three, matching the two-or-three concurrent-slice ceiling below.
```

**Replace with:**

```text
- **`backlog/ready/<name>/`** — assessed against `.claude/references/definition-of-ready.md` (advisory, since this board has no gate) and concrete enough to start. A ready item is a **folder**:
  - `proposal.md` — the promoted idea file. Always.
  - `assessment.md` — the assessment the promotion was granted on. Always, from the move commit.
  - `design.md` — when the design-pass triggers fire.
  - `spec.md` — when a process enabler runs `coach` SPEC.
  - `tasks.md` — when dispatch is multi-unit.
  - `findings.md` — a spike's recorded answer.

  **Only `proposal.md` carries the idea-file shape**; `.claude/references/pipelines.md` states what a per-item artifact owes instead. The orchestrating session owns this board: no role reads it, and an item reaches a role as prompt content rather than as a file path. Keep this lane to about three, matching the two-or-three concurrent-slice ceiling below.
```

**This is the one edit in the amendment that can break list structure silently**, which `prose.md`
names as a lint pass's characteristic damage and `format:check` vouches for. Count before and
after: three top-level bullets in the lane list, two in the "Two rules keep the board honest"
list, and three indented continuation paragraphs under the promote bullet. After, the same three
lane bullets plus six nested, and the other counts unmoved.

## Item 3 — a marker is placed by anchor, and the spec was wrong rather than the file

**Supersedes C2 in part, and lands no corpus edit to `definition-of-ready.md`.** C2 put the
allow-marker "as the second line of the file, directly under the `# Definition of Ready` heading".
Prettier inserts a blank line after an ATX heading and `workflow.md` mandates `npm run format`
before every commit, so that instruction describes a state **no committed file can hold**.

**Ruled: the landed file is correct and the spec item was not.** `writer` took Prettier's output.
`editor` confirms the landed shape matches what `pipelines.md` already carries, and that marker
liveness does not depend on position — `reference-check` reads the file, not a line.

**The correction generalises, and C4 and C5 are the control.** Both specified their markers by
anchor and both landed unchanged. C2 specified by line number and was the only one Prettier
overrode.

**So the rule gets a durable home in `coach.md`**, since `coach` is the only author of
find-and-replace blocks. This is the one file the amendment adds to the signed set.

**Find** (one list item in the Owns section):

```text
- **The spec artifact.** SPEC mode's deliverable is `spec.md` in the item's
  `backlog/ready/<name>/` folder — file-by-file, verbatim where wording is load-bearing,
  with the check readings the change is expected to move. You stop for explicit user
  sign-off and write no corpus edit yourself.
```

**Replace with:**

```text
- **The spec artifact.** SPEC mode's deliverable is `spec.md` in the item's
  `backlog/ready/<name>/` folder — file-by-file, verbatim where wording is load-bearing,
  with the check readings the change is expected to move. Place every edit by an anchor in
  the file's own text, never by a line number, since Prettier owns blank-line placement.
  You stop for explicit user sign-off and write no corpus edit yourself.
```

Three sentences, which is `Instruction.ListItemSentences`'s cap rather than over it. The new
sentence measures 21 words.

## Item 4 — where `kind:` is written, and the blob check is what decides it

**Supersedes C1 in part, and supersedes C1's accounting note.** That note said the dropped
`/idea-assess` attribution was "dropped as false — CLAUDE.md attributes that write to the seat,
and item A4 does not change it." **That checked who and never checked when.** The attribution
survived; the moment it named did not.

**The contradiction.** CLAUDE.md says `kind` is "written by the orchestrating seat when it records
the ruling", and `definition-of-ready.md` says the same. Before this slice, recording the ruling
meant the seat writing the two-record promotion commit body, holding the idea file. After step 2
the ruling is recorded by `/idea-approve`, whose landed text says "Commit the record alone" and
"Change nothing else in the record." **So no such moment exists.**

**The deciding argument is not the moment. It is the blob.** `idea-blob` is the idea file's git
blob id at assessment, and **any** edit to that file changes it — a `kind:` line included. A
`kind:` written between the assessment and the promotion therefore makes the record stale by
construction, and both `/idea-approve` and `/idea-promote` refuse a stale record. The only safe
moment is after the move commit.

**Ruled: `/idea-promote` writes `kind:` after the move, and that is the rule rather than a
fallback.** The spec framed step 4's write as what happens absent a `kind:` line. It is the only
write that can happen at all.

### 4a — CLAUDE.md, the `kind` paragraph

**Find** (a clause; one occurrence):

```text
ruled by `/idea-assess`'s kind check per `definition-of-ready.md` and written by the orchestrating seat when it records the ruling.
```

**Replace with:**

```text
ruled by `/idea-assess`'s kind check per `definition-of-ready.md` and written into the proposal by `/idea-promote` after the move.
```

### 4b — `.claude/references/definition-of-ready.md`, the opening paragraph

**Find** (a clause; one occurrence):

```text
The judging pass rules the label, the orchestrating seat writes it when recording the ruling, and the seat reads it to plan the role cycle.
```

**Replace with:**

```text
The judging pass rules the label, `/idea-promote` writes it into the proposal, and the seat reads it to plan the role cycle.
```

The _when_ stays out of this sentence deliberately. This paragraph is routing orientation, and the
moment belongs in the file that performs the write.

### 4c — `.claude/skills/idea-promote/SKILL.md`, out of the preconditions and into the steps

**The bullet is not a precondition.** The procedure itself satisfies it, so it sits in a list whose
other four entries can each refuse the run.

**Find and delete** (a whole line, unique in the file):

```text
- **The kind must be in the file's frontmatter.** Absent a `kind:` line, take it from the record and add it in step 4, never in the move commit.
```

**Then find** (a whole line, unique in the file):

```text
4. Flesh out the proposal afterwards, as its own commit, if the file needs it.
```

**Replace with:**

```text
4. Flesh out the proposal afterwards, as its own commit, if the file needs it.

**`kind:` is written after the move, never before it.** Take it from the record in step 4, absent one in the proposal already. Any earlier edit to the idea file changes its blob id and makes the record stale.
```

**The new text is a paragraph, not a numbered step**, so `Procedure.ProcedureLength`'s 20-word cap
does not reach it. Confirm that after the edit: an unindented paragraph after a blank line ends
the list, and a reading that reports a fifth step means the blank line or the indentation moved.

### 4d — `.claude/references/definition-of-ready.meta.md`, with step 4

**Append, after amendment 1's item 8b text and after D4:**

```text
## `kind:` is written after the move (ruled by `coach` at amendment 2, 2026-09-20)

The board's earlier rule had the orchestrating seat write `kind:` into the idea file when it
recorded the ruling. That moment stopped existing when `/idea-approve` took the ruling over,
since that command commits the record alone.

The deciding argument is not the moment. It is the blob. `idea-blob` is the idea file's git blob
id at assessment, and any edit to that file changes it, `kind:` included. So a `kind:` line
written between the assessment and the promotion makes the record stale by construction, and both
`/idea-approve` and `/idea-promote` refuse a stale record. The only safe moment is after the move
commit.

`/idea-promote`'s step 4 already did that write, framed as a fallback for a proposal that arrived
without a `kind:` line. The amendment promotes the fallback to the rule, because no earlier write
is possible.
```

## Item 5 — an insertion stranded the word pointing back over it

**Supersedes C4 in part.** `pipelines.md` now reads: the no-frontmatter paragraph, C4's new
exception paragraph, then "**Open with a heading and an attribution line instead.**" That
`instead` meant _instead of frontmatter_ and pointed two paragraphs up. It now sits directly
beneath the paragraph granting one artifact frontmatter, where it reads as telling `assessment.md`
to drop what C4 just gave it.

**Ruled: the exception moves below the heading paragraph**, which leaves the no-frontmatter rule
and its `instead` adjacent. `editor` declined to reorder because C4's insertion point was
spec-dictated; correcting that point is this amendment's job.

**The attribution rule widens in the same block, and this is the lower finding `editor` raised.**
The record's attribution line is "`/idea-assess`, `<date>`. Kind: …" — a command and a date, where
the rule asks for "the authoring role, its mode, and the date". The rule was true of every per-item
artifact that existed when it was written; `assessment.md` is the first written by a command rather
than a role. **The rule widens rather than the record changing**, because a command is a real
author class the file had not met.

**Find** (two whole paragraphs, in this order):

```text
**One artifact carries frontmatter, and that exception is ruled rather than inherited.**
`assessment.md` begins beside the idea, before the folder exists, and it stores the assessed idea
file's git blob id. A blob id is a fact no position supplies, so it stays in frontmatter after the
move. `.claude/references/definition-of-ready.md` names the three fields.

**Open with a heading and an attribution line instead.** The heading names the artifact and its
item. The attribution line names the authoring role, its mode, and the date.
```

**Replace with:**

```text
**Open with a heading and an attribution line instead.** The heading names the artifact and its
item. The attribution line names the author and the date — a role with its mode, or the command
that wrote the file.

**One artifact carries frontmatter, and that exception is ruled rather than inherited.**
`assessment.md` begins beside the idea, before the folder exists, and it stores the assessed idea
file's git blob id. A blob id is a fact no position supplies, so it stays in frontmatter after the
move. `.claude/references/definition-of-ready.md` names the three fields.
```

**Nothing is dropped.** The exception's rule, the blob-id argument, the `definition-of-ready.md`
pointer and the heading rule all survive verbatim. Only the attribution clause changes, and it
widens.

## Item 6 — the `HistoricalNarration` finding is accepted

**Supersedes nothing, and lands no edit.** `idea-approve/SKILL.md` draws
`Instruction.HistoricalNarration` on "findings that **no longer** stand".

**Ruled: accept it.** It is the exempt class `prose.md` names — `no longer` inside a live
conditional. The clause describes the state of one record at the moment a user re-assesses, not
this repo's own history. `prose.md`'s own instruction for that class is "Leave it, and name it in
the handoff as arguable." I take `editor`'s three supporting arguments as sound: the landing
constraint is about triage rather than a numeral, one finding with a recorded disposition is
triaged, and the obvious reword drops a load-bearing precondition clause.

**Ruled: the sanction needs no home more durable than this file, and an instance roster would be
wrong.** `prose.md` already carries the exempt class as a **rule**. A future reader who hits the
same finding reapplies the rule and reaches the same disposition without knowing this instance
existed. A roster of sanctioned instances is the shape `claim-discipline.md` forbids: it rots, and
nothing re-checks it.

**A per-file Vale suppression is declined and not recommended.** It is `architect`'s `.vale.ini`
question, and it would switch the rule off for the whole file rather than for the one clause.

## How the cycle re-enters

**Pass D — step 2, now.** Items 1a, 1b, 2a, 2b, 3, 4a, 4b and 4c, over six files:
`.claude/skills/idea-promote/SKILL.md`, `.claude/skills/idea-approve/SKILL.md`, `CLAUDE.md`,
`.claude/references/definition-of-ready.md`, `.claude/references/pipelines.md` and
`.claude/agents/coach.md`. One commit, `editor` CLEAN after it.

**The spec's step 4.** Item 4d rides with D1 to D4, alongside amendment 1's items 8a and 8b.

**No pass.** Items 3's `definition-of-ready.md` half, which is a correction to the spec rather than
to the file, and item 6.

## Expected readings — predicted, not measured

**Baselines measured 2026-09-20 in this worktree at tip `114cb92`, with `.vale/` synced.** `coach`
edits no corpus file, so no reading below was taken with the items applied.

| Check                                            | At tip `114cb92`                    | Predicted after pass D              |
| ------------------------------------------------ | ----------------------------------- | ----------------------------------- |
| `vale CLAUDE.md`                                 | 21 warnings                         | 19 — items 2a and 2b each clear one |
| `vale .claude/skills/idea-promote/SKILL.md`      | 1 `Instruction.ListItemSentences`   | 0                                   |
| `vale .claude/skills/idea-approve/SKILL.md`      | 1 `Instruction.HistoricalNarration` | 1 — accepted under item 6           |
| `vale .claude/references/definition-of-ready.md` | 0 in 1 file                         | 0 in 1 file                         |
| `vale .claude/references/pipelines.md`           | 0 in 1 file                         | 0 in 1 file                         |
| `vale .claude/agents/coach.md`                   | 0 in 1 file                         | 0 in 1 file                         |
| `npm run agent-doc-check`                        | clean                               | unchanged, clean                    |
| `npm run reference-check`                        | no failures                         | unchanged, clean                    |
| `npx prettier --check` on the six files          | clean                               | clean                               |

**A CLAUDE.md count above 19 is a finding, and so is a count below 19.** A lower count means an
edit cleared a pre-existing finding this amendment did not name, which is an unattributed change
in the auto-loaded file.

**Read the `idea-approve` row as a sanctioned finding rather than a failure.** Item 6 rules it,
and a future reading of zero there means somebody reworded the clause without a ruling.

## Two things that are not amendment items

- **`.vale.ini`'s references-tier comment, for `architect`.** It records "6 findings … 4
  ParagraphSentences, 2 ListItemSentences" and instructs "enable after a slice triages those 6".
  `editor` measured 7 today, 4/3/0, on `main`, on `114cb92^` and on the tip — so the drift
  predates this slice. **Recommended fix: drop the numeral rather than correct it.**
  `claim-discipline.md` rules that a numeral which is a census of external state should be dropped
  and the command kept, because a corrected count drifts again on the next finding. The same
  comment also calls `definition-of-ready.md` "the tier's one authored file", which the tier
  outgrew. **Fold both into the `.vale.ini` `enabler-technical` this spec's item D3 already
  recommends**, rather than filing a third.
- **`editor`'s question about its own empty CLEAN diffs.** Four passes, four empty diffs, and
  `editor` asks whether it should hold a narrow licence over register defects in spec-verbatim
  text. **Ruled: no licence, and the division of labour is intended.** The user signed those
  bytes; "changes no instruction" is a judgement, and the signature exists to keep that judgement
  with the user through `coach`. The amendment path caught all twelve findings and ruled each, so
  it works. **CLEAN's deliverable in a verbatim slice is its findings, not its diff**, and an
  empty diff there is a success mode. **What is worth fixing is that nothing tells `editor`
  that** — recommended as its own `enabler-process` over `editor.md`, not folded in here. This
  amendment fixes what this slice broke; a pre-existing general gap is a separate item with its
  own signature.

## Sign-off

The user signs this amendment before `writer` runs pass D. The file set is the seven files
`spec.md` names plus `.claude/agents/coach.md`, and nothing here reaches `scripts/`, `src/`,
`vale-styles/` or `.vale.ini`.
