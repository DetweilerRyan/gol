# Spec — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `1e9ac63`. **This spec needs the user's sign-off before
`writer` runs.**

Twelve items across six files, dispatched in three steps. The corpus gains one artifact class —
an assessment record beside the idea — and two procedures change to write it and to freeze it.

**Every verbatim block below is fenced as `text`, not as `markdown`, and that is load-bearing.**
Prettier formats embedded code inside a `markdown` fence. **Item A1's block is fenced with four
backticks** because its own content carries a three-backtick fence; copy the inner three-backtick
fence into the file and drop the outer four.

**Each Find block is quoted from the tree at tip `1e9ac63`.** Where a target file wraps its prose
by hand, the block starts and ends on a whole line. Where a target file keeps one line per
paragraph — CLAUDE.md and `definition-of-ready.md` both do — the block is a clause, and every
clause below was counted with `grep -cF` and occurs exactly once in its file.

## What this spec settles, before the items

### The record's name, and why the promoted basename costs a marker

**In the ideas lane the record is `backlog/ideas/<name>.assessment.md`.** In the item's folder it
is `assessment.md`, on the `proposal.md` precedent: the folder names the item and the basename
names the artifact's job.

`assessment.md` is a bare filename token that `npm run reference-check` resolves by basename, and
no such file exists in the tree. The precedent is exact and already in the corpus: `tasks.md`
carries the same marker in both CLAUDE.md and `.claude/references/pipelines.md`, worded to go
stale when the first instance lands. Four files below therefore carry a marker of the same shape
— `idea-promote/SKILL.md`, `definition-of-ready.md`, `pipelines.md` and CLAUDE.md, each being a
file that names the bare token. The ideas-lane form needs none — the extractor discards a token whose basename starts
with a dot, which is what `<name>.assessment.md` reduces to once the placeholder is stripped.

### Open question 1, ruled: the human's half leaves the commit body entirely

The record holds both halves, and the human's half lands as **its own commit**, whose diff is the
calibration record's second half. Four reasons, in order of weight:

1. The pair a retro compares sits in one file, read top to bottom, rather than split across a
   file and a commit body.
2. Git holds that commit immutably, so the integrity the commit body used to supply is not lost
   — it moves from the body's text to the commit's diff.
3. The move commit still carries the judge's summary, so a later edit of the record is
   detectable against it. Bound D is satisfied: the summary carries findings, never bare numbers.
4. A number never travels without its finding text, in either place.

### Open question 2, ruled: no Vale rule is enabled on the record, and `.vale.ini` is not edited

`.vale.ini`'s `[backlog/**/*.md]` section already reaches both lanes and enables exactly
`Board.NoStatusField`. That section's own reasoning — a candidate is raw, so no STE, no
`Instruction`, no `Procedure` — carries to a record unchanged. **The slice edits no config.**

The three `Claim` rules stay off here too, and the argument is stronger than the register one.
**A finding on a frozen record cannot be cleared without breaking the immutability rule.** A
standing lint on this surface therefore accumulates findings nobody may fix.

The measurement the proposal asked for cannot be taken today, and that is itself a reason to
decline. No assessment record exists at tip `1e9ac63`, so any reading over the new surface would
be a confident zero of the matched-no-file class. Enabling a rule against an unwritten surface is
enabling over an unmeasured backlog, which the landing constraint forbids.

What binds instead is `claim-discipline.md`, by hand, and item B1 puts that instruction in front
of the judge at write time — the only moment a record can be fixed. The two conditions that would
reopen this ruling are recorded in item D1.

### The design pass, corrected

The required DESIGN pass belongs to `enabler-technical`. This item is `enabler-process`, so this
spec plus the user's signature is its only pre-implementation gate.

### Nothing here reaches the tested tier

The six target files are `.claude/skills/idea-assess/SKILL.md`,
`.claude/skills/idea-promote/SKILL.md`, `.claude/references/definition-of-ready.md`,
`.claude/references/definition-of-ready.meta.md`, `.claude/references/pipelines.md`, and
CLAUDE.md. None is under `src/`, `scripts/`, `features/`, `perf/`, `rules/`, `rule-tests/` or
`vale-styles/`, and none is a config a test or a checker parses. `role-cycles.config.json` is
untouched, and no item edits a bare role-cycle string, so `agent-doc-check`'s check 4 cannot
move. The two `scripts/` changes this artifact implies were split out on 2026-09-20 into
`checkers-do-not-reach-the-assessment-sidecar`, which depends on this item.

## The ordering, and what each step leaves standing

| Step | Items  | Files                                                                        | The corpus after it                                                                                  |
| ---- | ------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | A1–A4  | `definition-of-ready.md`, `idea-assess/SKILL.md`, CLAUDE.md                  | The judge writes a durable record. Promotion is unchanged and still copies the record into its body. |
| 2    | B1–B6  | `idea-promote/SKILL.md`, `definition-of-ready.md`, `pipelines.md`, CLAUDE.md | Promotion moves the record, writes the human's half into it, and freezes it.                         |
| 3    | C1, D1 | `definition-of-ready.meta.md`                                                | The evidence behind every ruling above sits in the sidecar.                                          |

**Each step is one `writer` pass and one commit**, with `editor` CLEAN after each, per the
process pipeline's own sequencing.

**Why this order.** Step 1 adds a file the board did not carry, and contradicts nothing: the
promotion procedure it does not touch still reads the judge's record out of the conversation.
Step 2 is the only step that changes two procedures at once, and its four files have to land
together — the moment `/idea-promote` moves the record, CLAUDE.md's artifact list and
`pipelines.md`'s frontmatter rule are false until they follow. Step 3 adds evidence and can
contradict nothing.

**The one intermediate weakness, named rather than hidden.** Between step 1 and step 2 a
promotion would leave the record behind in the ideas lane, because `/idea-promote` does not yet
move it. The mitigation costs nothing: **do not run `/idea-assess` or `/idea-promote` between the
two commits.** The board has one editor and the slice runs in its own worktree, so the window is
closed by not opening it.

## Part A — step 1, the record and its author

### A1 — `.claude/references/definition-of-ready.md`, the new section

**Find** (the whole line, unique in the file):

```text
## Layer 3 — the calibration record
```

**Replace with** (outer fence is four backticks; the inner three-backtick fence belongs in the
file):

````text
## The assessment record

Layer 2's record is a file rather than a conversation turn. The judging pass writes it, and writes nothing else.

- **It sits beside the idea**, as `backlog/ideas/<name>.assessment.md`.
- **Frontmatter carries the three facts a machine reads**: `name`, the idea's slug; `assessed`, the date; and `idea-blob`, the idea file's git blob id at assessment.
- **Kind and disposition sit in prose above the table.** The seat copies the kind ruling into the idea's own frontmatter, so neither belongs in this file's frontmatter.
- **A summary table opens the record**, one row per letter in INVEST order. Three columns: the letter spelled out, its score, and a one-line finding.
- **A detail section per letter follows**, in the same spelling, carrying the finding in full.
- **A letter that declines a score says so in the score column**, and its finding is the declination.
- **The `LAYER1` line is carried into the record verbatim.** A record without it reads as not-run.

**Re-assessment replaces the record while the idea is in the ideas lane.** One idea carries one record, holding the assessment the next promotion would be granted on.

**`idea-blob` is what makes a stale record visible.** Take it with `git hash-object -- backlog/ideas/<name>.md`. Git already assigns the file that id, so the assessed text stays retrievable by it and sync is a comparison rather than a second scheme.

**The record is prose, and `claim-discipline.md` binds it.** No register rule lints the board. Date every figure, name the tree it was taken on, and write the whole record as history.

The shape, with every field named:

```text
---
name: <slug>
assessed: <YYYY-MM-DD>
idea-blob: <blob id>
---

# Assessment — <slug>

`/idea-assess`, <date>. Kind: <kind> (SAFe: <orientation>). Disposition: <disposition>.

`<the LAYER1 line, verbatim>`

| Letter      | Score | Finding |
| ----------- | ----- | ------- |
| Independent |       |         |
| Negotiable  |       |         |
| Valuable    |       |         |
| Estimable   |       |         |
| Small       |       |         |
| Testable    |       |         |

## Independent

## Negotiable

## Valuable

## Estimable

## Small

## Testable

## The human ruling

None recorded.
```

`None recorded.` is a live anchor rather than filler: the promotion procedure replaces that one line, and an idea that is never promoted keeps a true statement.

## Layer 3 — the calibration record
````

The new section sits above Layer 3 deliberately. Layer 3 is about what the record is compared
against; this section is about what the record is.

**This block contains a three-backtick fence.** It is the shape skeleton, and it stays `text`
rather than `markdown` so Prettier leaves its table and its placeholders alone.

### A2 — `.claude/skills/idea-assess/SKILL.md`, replaced whole

Six things change, and the rest of the file is carried across unedited: the frontmatter gains
`when_to_use` and drops `disable-model-invocation`, `allowed-tools` gains `Write`, the numbered
procedure gains two steps, a one-invocation rule lands above it, a claim-discipline rule joins
the record rules, and a new block of write rules closes the file.

**Replace the whole file with:**

```text
---
name: idea-assess
description: Assess one backlog/ board file against the readiness rubric, rule a disposition, and record it beside the idea.
when_to_use: When a candidate needs judging before a promotion decision — a newly captured idea, an idea revised since its last assessment, or a spike closing against its parent.
argument-hint: '[backlog/ideas/<name>.md]'
arguments: [target]
context: fork
agent: general-purpose
allowed-tools: Read, Write, Bash(git *), Grep, Glob
---

# Assess an idea

Target: $target

Layer 1 ran before this text reached you. Its output:

!`node "${CLAUDE_PROJECT_DIR}/scripts/board-shape-hook/run.ts" $target`

**Absent a `LAYER1` count line directly above, Layer 1 did not run — stop and say so. A line reporting the path missing means the target was never measured — stop the same way. Never assess on hand-computed checks.**

**A `not a candidate` line means the target is a per-item artifact rather than an idea file — stop and say so, and score nothing.**

**One invocation assesses one idea.** A request to assess a set is one invocation per member.

Then:

1. Read `.claude/references/definition-of-ready.md` in full.
2. Read the target file in full.
3. Apply the article: the slice check, the kind check, then the six letters.
4. Rule exactly one disposition.
5. Take the target's blob id with `git hash-object -- <target>`.
6. Write the record in the shape the article states.

Rules that bind the record:

- Name the kind with its SAFe orientation label, as the article's kind check writes it.
- Give every scored letter its 1–5 number and its finding text together. A number never travels alone.
- No total, no average, no cross-kind ranking.
- Fold the Layer 1 findings above into the record; they are measurements, not scores.
- The disposition comes from the written findings, never from the numbers.
- Nothing lints this file, so `claim-discipline.md` binds it by hand. Date every figure and write the record as history.

Rules that bind the write:

- Write exactly one file, `backlog/ideas/<name>.assessment.md`, beside the target.
- Change nothing else. The idea file, its frontmatter and its lane are not yours to touch.
- Replace an existing record whole. One idea carries one record.
- A target outside the ideas lane is already promoted, and its record is frozen. Return the record and write no file.
- Ignore any hook line naming the file you just wrote. Only the Layer 1 output above is yours to assess against.
- Match the 120-character width. Formatting is prettier's job.
- The judging pass never promotes. Promotion is a separate human-invoked command.

Return the record and the path you wrote, so the seat can rule on it.
```

**The `Write` grant is unscoped by tooling and scoped by prose.** A path-qualified
`allowed-tools` entry was not verified in this harness, and verifying it is `scripts/`-adjacent
work this slice does not buy. The two write rules above carry the constraint instead, which is
the same discipline every other skill in this directory relies on.

### A3 — CLAUDE.md, the ideas-lane bullet

**Find** (a clause; one occurrence):

```text
raw and unjudged, no limit, one flat file per idea.
```

**Replace with:**

```text
raw and unjudged, no limit, one flat file per idea, plus `<name>.assessment.md` beside it once the idea has been assessed.
```

### A4 — CLAUDE.md, what the judging pass writes

**Find** (a clause; one occurrence):

```text
 — the judging pass itself writes nothing.
```

**Replace with:**

```text
. The judging pass writes its own assessment record and nothing else.
```

The leading space and the em dash both belong to the Find block, and the replacement opens with a
full stop that closes the preceding sentence. Splitting the sentence here is deliberate: the
26-word `STE.SentenceLength` finding on this line is pre-existing, and the split may clear it.
Clearing it is acceptable; introducing a new finding is not.

## Part B — step 2, promotion

### B1 — `.claude/skills/idea-promote/SKILL.md`, replaced whole

Five things change: the preconditions read the record rather than the conversation and gain the
sync check, the numbered procedure gains the second move and the ruling commit, the commit body
carries a summary rather than the record in full, the immutability rule lands, and an
allow-marker covers the `assessment.md` token.

**Replace the whole file with:**

```text
---
name: idea-promote
description: Promote an assessed candidate to backlog/ready with its assessment record and the ruling commit.
argument-hint: '[backlog/ideas/<name>.md]'
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git *)
---

<!-- reference-check: allow assessment.md -- the per-item artifact name this procedure creates; no item carries one yet, and the marker goes stale (delete it) when the first does -->

# Promote an idea

Move the candidate in $ARGUMENTS to its `backlog/ready/<name>/` folder, carrying its assessment record. The human invocation of this command is the grant; the judging pass never promotes.

Preconditions, checked in order:

- **The assessment record must exist**, at `backlog/ideas/<name>.assessment.md`, carrying a Ready disposition. Absent one, stop and say so — `/idea-assess` writes it.
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result against the record's `idea-blob`. On a difference, stop: the record describes text the idea has since lost, and the one exit is a fresh `/idea-assess`.
- **The human's ruling must be in this conversation** — agree or differ, per letter, with reasons on the differing letters. Absent one, ask for it and stop.
- **Report the lane count.** Run `git ls-files 'backlog/ready/*/proposal.md'` and count. Above three, report the cap and proceed only on the user's word, since a hard refusal would be the board's first gate.
- **The kind must be in the file's frontmatter.** Absent a `kind:` line, take it from the record and add it in step 5, never in a move commit.

Then, in this order:

1. Run `git mv backlog/ideas/<name>.md backlog/ready/<name>/proposal.md`.
2. Run `git mv backlog/ideas/<name>.assessment.md backlog/ready/<name>/assessment.md`.
3. Commit both moves alone, with the body below. Rename detection is content-based, so neither basename change defeats it.
4. Replace the record's `None recorded.` line with the human's ruling, as its own commit.
5. Flesh out the proposal afterwards, as its own commit, if the file needs it.

The move commit's body carries the judge's summary: the kind, the disposition, and each of the six scores beside its one-line finding. The record in full stays in the file, and no total travels in either place.

The ruling commit carries the human's ruling per letter — agree, or differ with the reason. Its diff is the calibration record's second half, which is why the judge's half stays unedited and the two stay readable as two.

**The record is immutable from that commit.** A retro compares what happened against the assessment the promotion was granted on, so the frozen text is the point. The stored `idea-blob` stops matching once the proposal is fleshed out, and that divergence is expected history rather than a defect.

Report both commit hashes and the new paths.
```

**Three obligations leave this file, and each is accounted for.** The precondition that a judge's
record sit in the conversation is replaced by the stronger file-existence check, and the Ready
disposition it also checked survives in the replacement. The clause attributing the `kind:` write
to `/idea-assess` is dropped as false — CLAUDE.md attributes that write to the seat, and item A4
does not change it. The parenthetical explaining rename detection moves into step 3, shortened.

### B2 — `.claude/references/definition-of-ready.md`, the promoted lane

**Find** (a clause landed by item A1; one occurrence after step 1):

```text
- **It sits beside the idea**, as `backlog/ideas/<name>.assessment.md`.
```

**Replace with:**

```text
- **It sits beside the idea**, as `backlog/ideas/<name>.assessment.md`, and moves into the item's folder at promotion as `assessment.md`.
```

**Also add**, as the second line of the file, directly under the `# Definition of Ready` heading
and followed by one blank line:

```text
<!-- reference-check: allow assessment.md -- the per-item artifact name this reference defines; no item carries one yet, and the marker goes stale (delete it) when the first does -->
```

### B3 — `.claude/references/definition-of-ready.md`, Layer 3

**Find** (two whole lines; the first is the heading, the second the paragraph under it):

```text
The record lives in git, with no new artifact class.

A promotion commit carries **two records in order**. First the judge's six letters as rendered, each number with its finding text. Then the human's ruling per letter — agree or differ, with the reason on each differing letter. Write the judge's half first, and never edit it afterwards. Without the second record the human's verdict is a contaminated label, and calibration would measure agreement with itself.
```

**Replace with:**

```text
Both halves live in the assessment record, and git holds the history of each.

A promotion carries **two records in order**. First the judge's six letters as written at assessment, each number with its finding text. Then the human's ruling per letter — agree or differ, with the reason on each differing letter. The judge's half is written first and is never edited afterwards. Without the second record the human's verdict is a contaminated label, and calibration would measure agreement with itself.

**The human's half lands in the record as its own commit**, written by `/idea-promote`. The record is immutable from there, since a retro compares what happened against the assessment the promotion was granted on. The move commit carries the judge's summary instead of the record in full: the kind, the disposition, and each score beside its one-line finding.

**Promotion verifies sync before granting.** A record whose `idea-blob` differs from the idea file's current blob id describes text the promotion is not being asked for. That is a correctness precondition of the procedure rather than a gate on the board, and the remedy is a fresh assessment.
```

Leave the declines paragraph, the calibration-pass paragraph and the stated risk untouched.

### B4 — `.claude/references/pipelines.md`, the frontmatter exception

**Find** (four whole lines):

```text
**A per-item artifact carries no frontmatter.** Its identity is positional. The folder names the
item and the basename names the artifact's job. A `name:` field would restate the folder and a
`title:` field the heading. `created:` restates what `git log --diff-filter=A` answers, and
`kind:` belongs to `proposal.md` alone.
```

**Replace with:**

```text
**A per-item artifact carries no frontmatter.** Its identity is positional. The folder names the
item and the basename names the artifact's job. A `name:` field would restate the folder and a
`title:` field the heading. `created:` restates what `git log --diff-filter=A` answers, and
`kind:` belongs to `proposal.md` alone.

**One artifact carries frontmatter, and that exception is ruled rather than inherited.**
`assessment.md` begins beside the idea, before the folder exists, and it stores the assessed idea
file's git blob id. A blob id is a machine-read fact no position supplies, so it stays in
frontmatter after the move. `.claude/references/definition-of-ready.md` names the three fields.
```

**Also change** the allow-marker line at the top of the file. **Find:**

```text
<!-- reference-check: allow tasks.md -- a per-item artifact-name convention; no ready item carries one yet, and the marker goes stale (delete it) when the first does -->
```

**Replace with:**

```text
<!-- reference-check: allow tasks.md -- a per-item artifact-name convention; no ready item carries one yet, and the marker goes stale (delete it) when the first does -->
<!-- reference-check: allow assessment.md -- the same convention, one artifact later; the marker goes stale (delete it) when the first item carries one -->
```

### B5 — CLAUDE.md, the ready-lane artifact list

**Find** (a clause; one occurrence):

```text
`findings.md` for a spike's recorded answer.
```

**Replace with:**

```text
`findings.md` for a spike's recorded answer; `assessment.md` once the item has been promoted, carrying the assessment it was promoted on.
```

**Also change** the allow-marker line in the Idea board section. **Find:**

```text
<!-- reference-check: allow tasks.md -- a per-item artifact-name convention; no ready item carries one yet, and the marker goes stale (delete it) when the first does -->
```

**Replace with:**

```text
<!-- reference-check: allow tasks.md -- a per-item artifact-name convention; no ready item carries one yet, and the marker goes stale (delete it) when the first does -->
<!-- reference-check: allow assessment.md -- the same convention, one artifact later; the marker goes stale (delete it) when the first item carries one -->
```

### B6 — CLAUDE.md, the promote bullet

**Find** (a clause; one occurrence):

```text
and commit _that alone_, before fleshing the file out.
```

**Replace with:**

```text
, move `<name>.assessment.md` to `assessment.md` in the same folder, and commit _those alone_, before fleshing the file out.
```

**Then find** (a clause; one occurrence):

```text
The move commit's body carries the promotion's two records, in order: the judge's assessment, then the human's per-letter ruling.
```

**Replace with:**

```text
The move commit's body carries the judge's summary rather than either record in full, and the human's per-letter ruling lands in the assessment record as the next commit, which is where the assessment freezes.
```

Leave the two sentences that follow — the pointer to `definition-of-ready.md` and the
`/idea-promote` attribution — exactly as they stand.

## Part C and D — step 3, the evidence

Both items append to `.claude/references/definition-of-ready.meta.md`, in the order given, each
separated from its neighbour by one blank line. The file is exempt from every Vale rule, so its
register is the dated-record register throughout.

### C1 — the artifact's rulings

**Append:**

```text
## The assessment record (ruled by the user 2026-09-19 and 2026-09-20)

The record was a conversation turn whose only durable trace was a promotion commit's body. An
idea assessed and never promoted left nothing at all. The user ruled the judging skill
model-invocable, and ruled that it writes its own record beside the idea.

The rulings, by date:

- **2026-09-19.** The record persists beside the idea and survives promotion. A re-assessment
  replaces it while the idea sits in the ideas lane; after promotion it is immutable. Promotion
  verifies sync before granting, as a correctness precondition rather than as a board gate.
- **2026-09-20, the hash.** The stored id is the git blob hash. It is the id git already assigns
  the file, so the assessed text stays retrievable by that id and sync is checkable against the
  committed tree. Measured the same day: the id survives rebase and squash unchanged, since
  content alone determines it. Only retrieval is at risk, and only where a squash swallows the
  commit that captured the assessed state and the unreachable object is later pruned. The sync
  verdict holds in that case regardless.
- **2026-09-20, four mechanics.** The judge fork writes the record itself. The skill stays one
  invocation per idea. The record is the single home of the detailed assessment. The frontmatter
  carries the hash, and Layer 1 enforces no further shape.
- **2026-09-20, the record's shape.** A summary table opens the record, one row per letter with
  the letter spelled out, and a detail section per letter follows in the same spelling. Three
  columns, because a score column alone would break the bound that a number never travels
  without its finding text at the altitude a reader skims. Rows hold INVEST order, since sorting
  by score is a ranking device the bounds forbid.
- **2026-09-20, the human's half.** It joins the record at promotion, judge's half first. The
  calibration design turns on the human label being ruled against the judge's rather than merged
  into it, and the order is what keeps the two readable as two.

**The name, ruled by `coach` at SPEC.** `backlog/ideas/<name>.assessment.md` in the ideas lane,
`assessment.md` in the item's folder. The second form is a bare filename token
`npm run reference-check` resolves by basename, so three files carry an allow-marker of the same
shape `tasks.md` already carries. The first form costs nothing: the extractor discards a token
whose basename starts with a dot, which is what the placeholder form reduces to.

**Frontmatter, and which field is weakest.** `idea-blob` is the fact that forced the exception —
no position supplies it. `assessed` is a claim about when the judging ran, which `git log` can
corroborate but not state. `name` is the weakest of the three: it restates the basename in the
ideas lane and the folder after promotion. It stays because it is the slug that survives both
moves and binds the record to its idea independently of position. A later ruling may drop it
without touching the other two.

**`assessed:` deliberately does not reuse `created:`.** The board's `created:` field means the
day a candidate was filed. Reusing the spelling would let a reader take one date for the other.

## Open question 1, ruled by `coach` at SPEC (2026-09-20)

The proposal asked whether the human's half also reduces to a summary in the commit body, or
leaves it entirely. Ruled: it leaves the commit body, and lands as its own commit whose diff is
the record.

The objection considered and answered: the commit body was immutable and a file is not, so
moving the human's half into the file appears to weaken calibration integrity. It does not. The
ruling commit's diff is held by git exactly as a body is, and the move commit's judge summary
gives a second fixed point a tampered record can be checked against.

## Open question 2, ruled by `coach` at SPEC (2026-09-20)

Which prose rules reach the record. Ruled: none beyond what the board already carries, and
`.vale.ini` is not edited. `[backlog/**/*.md]` enables `Board.NoStatusField` alone and reaches
both lanes.

Three arguments, the second decisive:

1. **Register.** The board section's own reasoning holds: a candidate is raw, so no STE, no
   `Instruction`, no `Procedure`. A record is not an instruction file either.
2. **Immutability.** A finding on a frozen record cannot be cleared without breaking the
   immutability rule. A standing lint on this surface accumulates findings nobody may fix.
3. **The measurement cannot be taken.** No record existed at tip `1e9ac63`, so a reading over
   the new surface would be a confident zero of the matched-no-file class. Enabling a rule
   against an unwritten surface is enabling over an unmeasured backlog.

`claim-discipline.md` binds the record instead, by hand, and the skill's own rules put that in
front of the judge at write time. Six forms bind it: date the figure and name the tree, write the
whole record as history, keep a claim at the scope of the command that produced it, date any
claim about another board file, name which rather than how many, and name the slug rather than
the bare indexical. The blob hash mechanises the name-the-tree half of the first form.

**Two conditions would reopen this.** A corpus of roughly ten records exists and can be measured,
and a rule is proposed whose findings a judge could act on at write time. `Claim.SentenceInitialMost`
is the likeliest candidate, since an unmeasured majority is a judge's characteristic defect. The
enabling path is the existing write-time hook rather than a standing lint, for reason 2.

## What the sidecar changes about a recorded rejected alternative (2026-09-20)

The rejected-alternatives entry above, on one skill with a named mode, gave three reasons, one of
which was that the assess path must not hold Write. That clause is now narrower rather than
retracted. The assess path holds Write to its own record and to nothing else, and the boundary it
protected — a judging seat that acts on its own grade — is held by the promotion command staying
human-invoked and by the judge never touching the idea file. The other two reasons are untouched,
so the alternative stays rejected.
```

### D1 — what the checkers do with the new file

**Append, after C1:**

```text
## What the board checkers do with the record (read 2026-09-20)

Read off `scripts/board-shape-hook/board-shape.ts` at tip `1e9ac63`, rather than run: the
classifier's candidate test is positional, and treats any two-segment board path as a flat idea
file. `backlog/ideas/<name>.assessment.md` has two segments, so a record written into the ideas
lane is measured as an idea file and reports findings against a shape it does not have — a name
that does not match the basename, a missing title, a missing created date, and the two missing
section headings. `.claude/settings.json` wires the hook to every `backlog/**` write, and the
outcome delivers, so the envelope reaches the judge that wrote the file.

The skill's write rules therefore tell the judge to assess only against the Layer 1 output
injected above its own text. The classifier fix belongs to
`checkers-do-not-reach-the-assessment-sidecar`, which owns `scripts/` and already carries the
question of which board files are records rather than proposals.

In the item's folder the same classifier reads three segments and a basename other than
`proposal.md`, so it prints its non-candidate refusal and delivers nothing. That half needs no
change.

**One constraint this artifact hands the dependent enabler: the hash check is lane-sensitive.** A
mismatch in the ideas lane is staleness. A mismatch in `ready/` or `done/` is expected history,
because the promotion procedure freezes the record and then fleshes out the proposal in the next
commit. A predicate that reads the two lanes alike would report every promoted item as stale.
```

## Expected readings — predicted, not measured

**`coach` edits no corpus file in either mode, so no reading below was taken with the items
applied.** Each is a prediction with its mechanism named. A divergence is a finding for `editor`
AUDIT or for `coach` REVIEW, not a licence to edit the spec.

Baselines were taken on 2026-09-20 at tip `1e9ac63` in this worktree, with `.vale/` synced:

| Check                                                 | At tip `1e9ac63`                   | Predicted with all items applied                      |
| ----------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `npm run agent-doc-check`                             | 54 docs, 8 agents, 32 rules, clean | unchanged, clean                                      |
| `npm run reference-check`                             | 537 files, 3,204 refs, no failures | more refs, no failures — four new allow-markers, live |
| `vale .claude/skills/idea-assess/SKILL.md`            | 0 in 1 file                        | 0 in 1 file                                           |
| `vale .claude/skills/idea-promote/SKILL.md`           | 0 in 1 file                        | 0 in 1 file                                           |
| `vale .claude/references/definition-of-ready.md`      | 0 in 1 file                        | 0 in 1 file                                           |
| `vale .claude/references/pipelines.md`                | 0 in 1 file                        | 0 in 1 file                                           |
| `vale .claude/references/definition-of-ready.meta.md` | 0 in 1 file, by exemption          | 0 in 1 file, by exemption                             |
| `vale CLAUDE.md`                                      | 21 warnings in 1 file              | 20 or 21 — see A4                                     |
| `npx prettier --check` on the six files               | clean                              | clean                                                 |

**Read the `definition-of-ready.meta.md` row as a confident zero rather than a pass.**
`.vale.ini`'s final `[**/*.meta.md]` section switches every rule off by name, so no sentence in
C1 or D1 is linted. The `in 1 file` count is what separates that exemption from a run that
reached no file at all.

**CLAUDE.md's 21 warnings are pre-existing and are not this slice's to clear.** Three of them sit
on lines the items edit — one on the ready-lane bullet and two on the `kind` paragraph. Item A4
may clear one of the two by splitting a sentence. **A count above 21 is a finding; a count of 20
is accepted.**

**The word caps that bind each surface.** The skills and the references take
`STE.SentenceLength` at 25 words, `STE.ParagraphLength` at six sentences, and
`Procedure.ProcedureLength` at 20 words per numbered step. The skills additionally take the three
`Instruction` rules — three sentences per list item, four per paragraph, and no
historical-narration token. Every block above was written to those caps.

## Out of scope, and each is a refusal rather than an omission

- **Layer 1's hash check and the `reference-check` board carve-out.** Split out on 2026-09-20
  into `checkers-do-not-reach-the-assessment-sidecar`, which owns `scripts/`.
- **The classifier's misreading of a two-segment record.** Named in item D1 as a finding, and
  recommended to that same technical enabler through this spec's handoff. No `scripts/` file
  changes here.
- **A mechanical scope on the judge's `Write` grant.** The path-qualified `allowed-tools` form
  was not verified. Prose carries the constraint; a spike could settle the mechanism later.
- **Enabling any Vale rule on the board surface.** Ruled above, with the two conditions that
  would reopen it.
- **Retrofitting records for ideas already assessed.** The board's existing calibration record
  stays in the commits that carry it. A retrofitted record would be a reconstruction wearing a
  contemporaneous record's shape, which is the one thing calibration cannot use.
- **`backlog/TEMPLATE.md`.** It is the idea-file shape, and a record is not an idea file.
- **What a retrospective does with the record, and the retrospective's deletion of the folder.**
  The retro's trigger and owner are unruled, and the board already carries a candidate about
  deleted evidence. Nothing here rules either.
- **`.vale.ini` and `vale-styles/**`.** `architect` owns them, and this slice needs neither.

## The amendment path

If this spec needs changing after sign-off, it changes through `amendment-1.md` in this item's
folder, authored by `coach` in either mode, and never by editing this file. A `writer` that
cannot execute an item returns it and stops; that return is a trigger for an amendment rather
than an amendment.

**An amendment that replaces a block names every obligation the block carried that the
replacement does not**, per the rule in `.claude/references/pipelines.md`.

## Sign-off

The user signs this spec before `writer` runs. The cycle then runs step 2 of the process
pipeline three times, once per step in the ordering above, scoped to
`.claude/skills/idea-assess/SKILL.md`, `.claude/skills/idea-promote/SKILL.md`,
`.claude/references/definition-of-ready.md`, `.claude/references/definition-of-ready.meta.md`,
`.claude/references/pipelines.md` and `CLAUDE.md`, and nothing else.
