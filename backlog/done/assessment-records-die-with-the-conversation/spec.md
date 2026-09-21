# Spec — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `44bbf55`. **Revised 2026-09-20**, before any signature, to
carry the user's rulings on the five flagged items and the approval-decoupling ruling. **This
spec needs the user's sign-off before `writer` runs.**

Fifteen items across seven files, dispatched in four steps. The corpus gains one artifact class —
an assessment record beside the idea — and three procedures that write it, rule on it, and freeze
it.

**Every verbatim block below is fenced as `text`, not as `markdown`, and that is load-bearing.**
Prettier formats embedded code inside a `markdown` fence. **Item A1's block is fenced with four
backticks** because its own content carries a three-backtick fence; copy the inner three-backtick
fence into the file and drop the outer four.

**Each Find block is quoted from the tree at tip `44bbf55`.** Where a target file wraps its prose
by hand, the block starts and ends on a whole line. Where a target file keeps one line per
paragraph — CLAUDE.md and `definition-of-ready.md` both do — the block is a clause, and every
clause below was counted with `grep -cF` and occurs exactly once in its file.

**Some quotations and readings were taken in the primary checkout, at its own tip `1e9ac63`, and
that is sound only because the files are identical.** Verified with `diff` on 2026-09-20: all
seven target files, plus `.vale.ini`, `.claude/settings.json` and the three `scripts/` modules
probed below, are byte-identical between that checkout and this worktree. Where a reading's tree
matters it is named with the reading.

## The lifecycle this spec lands

| Act     | Command                         | Writes                    | When                                     |
| ------- | ------------------------------- | ------------------------- | ---------------------------------------- |
| Judge   | `/idea-assess`, model-invocable | The record, replacing any | Any time an idea is worth judging        |
| Rule    | `/idea-approve`, user-invocable | The record's human half   | Any time after judging, before promotion |
| Promote | `/idea-promote`, user-invocable | Nothing inside the record | Once the record is complete and in sync  |

**Promotion writes nothing into the record.** It moves a record that is already complete, and the
move commit is where the record freezes.

## What this spec settles, before the items

### The record's name — ruled by the user 2026-09-20, and unchanged

`backlog/ideas/<name>.assessment.md` in the ideas lane, `assessment.md` in the item's folder, on
the `proposal.md` precedent.

`assessment.md` is a bare filename token that `npm run reference-check` resolves by basename, and
no such file exists in the tree. The precedent is exact and already in the corpus: `tasks.md`
carries the same marker in both CLAUDE.md and `.claude/references/pipelines.md`, worded to go
stale when the first instance lands. **Four files carry a marker of that shape** — items C1, C2,
C4 and C5, which are the four that name the bare token. The ideas-lane form needs none: the
extractor discards a token whose basename starts with a dot, which is what
`<name>.assessment.md` reduces to once the placeholder is stripped.

### The human's half — confirmed in the record, and decoupled from promotion

Ruled by the user 2026-09-20: the record holds both halves, and the ruling is **its own act**,
recorded when the user makes it rather than when a promotion runs.

Three consequences bind every item below. The ruling lands in the record at the moment it is
made. Promotion refuses a record carrying no ruling, or a ruling missing a letter. The ruling
must be non-stale at promotion, exactly as the record must.

### Sub-decision 1 — a third skill records the ruling

**Ruled: `/idea-approve`, a new user-invocable skill, and not the seat editing the record by
hand.** Four reasons:

1. A hand-edit is the class of act this artifact exists to remove. The record's whole value is
   that it was written by a procedure rather than recalled.
2. The skill computes the staleness comparison mechanically. The seat would otherwise read a
   blob id by eye and compare it by eye.
3. The skill refuses deterministically: no record, a stale record, or a ruling missing a letter.
4. It carries `disable-model-invocation: true`, as `/idea-promote` does. The ruling is a grant,
   so no model may fabricate one.

### Sub-decision 2 — the ruling inherits the record's staleness, with one threat accepted

**Ruled: no second stamp.** The ruling sits inside the record, the record carries `idea-blob`,
and `/idea-assess` replaces the record whole — the ruling with it. Promotion's existing sync
comparison therefore covers both halves, and a stale ruling refuses exactly as a stale record
does.

**The threat this accepts, named rather than hidden:** a judge's half edited by hand after the
ruling, with no re-assessment. A second stamp over the judge's half would catch it; the
inheriting reading cannot.

Three reasons for accepting it. The board has one editor, so the hand-edit is a discipline breach
rather than drift. The never-edit rule already governs the judge's half and predates this spec. A
second stamp has no git-native id to use, since git ids whole files rather than sub-ranges, so it
would be the bespoke scheme the blob-hash ruling exists to avoid.

**What would reopen it:** a second editor of the board, or one observed instance of a hand-edited
judge half. Either is a candidate, not an amendment.

### When the record becomes immutable

**At the promotion's move commit, and not before.** Until then the record sits in the ideas lane,
where `/idea-assess` may replace it whole and `/idea-approve` may replace the human's half.

**Replacing an approved record needs one sentence beyond what replacement already says, and item
B1 carries it.** A re-assessment discards the ruling, because the ruling was given on findings
that no longer stand. The remedy after a refused promotion is therefore a fresh assessment **and**
a fresh ruling, in that order.

### Open question 2 — the ruling is overturned, and the enable cannot land in this slice

**The user overturned my no-rules ruling on 2026-09-20. Rules are to be enabled on the record
surface.** What follows is the recommendation, the evidence it rests on, and the reason this
slice cannot execute it.

**What I recommend enabling.** The three `Claim` rules — `AudienceRoster`, `WordingIdentity` and
`SentenceInitialMost` — at `warning`, on a new `.vale.ini` section scoped to
`[backlog/ideas/*.assessment.md]`, with explicit per-rule keys and no `BasedOnStyles`.

**How that survives the immutability argument, which has not gone away.** The section glob is
lane-scoped. A record in the ideas lane is mutable, so a finding there is clearable by the judge
or by a fresh assessment. A record in `ready/` or `done/` matches only the existing
`[backlog/**/*.md]` section and keeps `Board.NoStatusField` alone, so a frozen record can never
carry a clearable finding. **That is the whole answer to the immutability objection, and it is
available only because `.vale.ini` sections are path globs.**

**The section must come after `[backlog/**/*.md]`**, since sections stack and the later one wins
per key. It must not set `BasedOnStyles`, because that re-enables the whole named style and
destroys the earlier per-rule keys — `.vale.ini` carries the measurement for that in its
`[src/**/*.md]` comment. With no `BasedOnStyles`, the earlier `Board.NoStatusField = warning`
survives into the new section, which is what keeps the board's one structural rule live on the
record.

**What the recommendation rests on, given that the surface cannot be measured.** No record exists
at tip `44bbf55`, so a reading over the new glob today is a confident zero of the matched-no-file
class. The evidence is therefore indirect, and it is of two kinds:

- **Each rule's own dated precision run**, recorded in its header and measured 2026-09-15 over
  `.claude/agents/**`, `.claude/skills/**`, `.claude/references/**` and CLAUDE.md: three hits
  total across the whole instruction corpus, zero on every enabled surface, and zero clean false
  positives. These are phrase fingerprints with a bounded false-positive surface, not register
  heuristics.
- **The fit between the rules and the artifact.** `claim-discipline.md` is the record's binding
  rulebook, and these three rules mechanise three of its forms. Enabling them adds no second
  standard. `SentenceInitialMost` is the one most likely to fire, since an unmeasured majority is
  a judge's characteristic defect.

**What waits for a corpus, and why.** The register families — `STE`, `Instruction`, `Procedure` —
are not recommended yet. Their false-positive surface is unbounded on an unmeasured surface,
`Instruction.ParagraphSentences` in particular looks likely to fire on a per-letter detail
section, and the landing constraint forbids enabling over a backlog nobody has counted.
**Re-ask at roughly ten records**, when a real reading can be taken.

**Ownership — and this is the finding.** The enable cannot land in this slice, for two
independently sufficient reasons:

1. **`.vale.ini` is `architect`'s by practice, and outside `writer`'s surface.** Measured
   2026-09-20 with `git log -- .vale.ini`: of the commits whose bodies name a role, all but one
   read `By architect.`, and the exception is `By the orchestrating seat.` on the process-pipeline
   staffing commit. `writer.md` enumerates its write surface as `.claude/**`, CLAUDE.md,
   `.claude/references/`, `adr/`, the board docs and `role-cycles.config.json`. `.vale.ini` is in
   neither its grant nor its prohibition, which makes the edit unauthorised rather than merely
   unusual. The `enabler-process` cycle has no `architect` step to route it to.
2. **The enable alone would not reach the judge at the one moment a record is fixable.** Measured
   2026-09-20: `scripts/prose-write-hook/audit.ts`'s `inScope` accepts only paths starting
   `.claude/skills/` or `.claude/references/`, so the write-time prose loop refuses a `backlog/`
   path whatever `.claude/settings.json` sends it. Extending the loop is a `scripts/` change, with
   its own unit test, and `writer` may not write `scripts/` at all.

**What is reachable today, and it is not nothing.** `npm run prose-lint` lints every tracked
`*.md` minus `src/catalyst/`, so the board is already in its file set — measured 2026-09-20:
`npm run prose-lint -- --scope backlog` linted 115 tracked files and reported zero findings. An
enabled rule would therefore show up in the standing run, just not at write time.

**So the recommendation leaves this slice as a cross-pipeline finding**, named in the handoff and
in item D3, for a new `enabler-technical` that carries both halves: the `.vale.ini` section and
the write-time loop's reach. A diff in a config the gates measure is `enabler-technical` by
`definition-of-ready.md`'s own sub-kind discriminator, and that pipeline runs `architect` twice.

**What this slice does carry, because the ruling changes what the corpus may claim.** Items A1 and
A2 state that `claim-discipline.md` binds the record, and **neither says that nothing lints it**.
An absolute "no register rule lints the board" would be a present-tense claim about another file
that the follow-up enabler falsifies on the day it lands.

### The `Write` grant — explored rather than deferred

**Ruled: the skill's grant is written as `Write(backlog/ideas/*.assessment.md)`**, the
path-qualified form. Evidence, measured 2026-09-20 against the installed Claude Code binary,
build 2.1.236 at `/opt/homebrew/Caskroom/claude-code/2.1.236/claude`:

- The binary carries the literals `"Edit(docs/**)"` and `"Edit(//etc/*)"`, which are the
  repo-relative and absolute forms of a file-tool path specifier in the permission-rule grammar.
  So the grammar does accept a path-qualified rule for a file tool in this build.
- The `--allowed-tools` flag's own help text reads `Comma or space-separated list of tool names to
allow (e.g. "Bash(git *) Edit")`, so specifier-bearing entries are what that option takes.
- The frontmatter validator's message is `allowed-tools must be a string or array of strings`, so
  frontmatter entries are stored as raw rule strings rather than parsed into bare tool names.
- This repo already depends on the specifier form in the same field: `idea-assess` carries
  `Bash(git *)` today and works.

**What is still unproven, stated as such:** that a skill's `allowed-tools` entries are evaluated
by the same rule matcher as `settings.json`'s `permissions.allow`. The probe read strings from a
stripped binary, not the code path.

**A spike is not needed, because every failure mode of the path-qualified form is acceptable and
one of them is loud.** If the specifier binds, the grant is scoped, which is the goal. If the
entry fails to match, the Write is refused and the skill reports that it could not write the
record — a loud failure at first use, not a silent one. If the specifier is ignored and read as a
bare `Write`, the grant is unscoped, which is exactly where the prose-only version already stood.

**The verification is free and happens at first use.** Run `/idea-assess` on a real idea and see
whether the record lands. **If it is refused, the next narrowest form is
`Write(backlog/ideas/**)`**, with item A2's prose rules carrying the rest. That is a one-line
follow-up, not a slice.

### The design pass, corrected

The required DESIGN pass belongs to `enabler-technical`. This item is `enabler-process`, so this
spec plus the user's signature is its only pre-implementation gate.

### Nothing here reaches the tested tier

The seven target files are `.claude/skills/idea-assess/SKILL.md`,
`.claude/skills/idea-approve/SKILL.md` (new), `.claude/skills/idea-promote/SKILL.md`,
`.claude/references/definition-of-ready.md`, `.claude/references/definition-of-ready.meta.md`,
`.claude/references/pipelines.md`, and CLAUDE.md. None is under `src/`, `scripts/`, `features/`,
`perf/`, `rules/`, `rule-tests/` or `vale-styles/`, and none is a config a test or a checker
parses. `role-cycles.config.json` is untouched and no item edits a bare role-cycle string, so
`agent-doc-check`'s check 4 cannot move. The `scripts/` work this artifact implies is named in
"Out of scope" and leaves the slice as a recommendation.

## The ordering, and what each step leaves standing

| Step | Items | Files                                                                        | The corpus after it                                                                                         |
| ---- | ----- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1    | A1–A4 | `definition-of-ready.md`, `idea-assess/SKILL.md`, CLAUDE.md                  | The judge writes a durable record. Promotion is untouched and still reads the ruling from the conversation. |
| 2    | B1    | `idea-approve/SKILL.md` (new)                                                | The ruling can be recorded as its own act. Promotion is still untouched.                                    |
| 3    | C1–C6 | `idea-promote/SKILL.md`, `definition-of-ready.md`, `pipelines.md`, CLAUDE.md | Promotion requires a complete record, moves it, and freezes it. It writes nothing inside it.                |
| 4    | D1–D4 | `definition-of-ready.meta.md`                                                | The evidence behind every ruling above sits in the sidecar.                                                 |

**Each step is one `writer` pass and one commit**, with `editor` CLEAN after each, per the
process pipeline's own sequencing.

**Why this order.** Step 1 adds a file the board did not carry and contradicts nothing: the
promotion procedure it does not touch still reads the judge's record out of the conversation.
Step 2 adds one new file and changes none, so it can contradict nothing either. Step 3 is the
only step that must land four files together — the moment `/idea-promote` stops writing the
ruling into its commit body, `definition-of-ready.md`'s Layer 3, CLAUDE.md's promote bullet and
artifact list, and `pipelines.md`'s frontmatter rule are all false until they follow. Step 4 adds
evidence and can contradict nothing.

**Two intermediate states, both named.** Between step 1 and step 3 a promotion would leave the
record behind in the ideas lane, because `/idea-promote` does not yet move it — so **do not run
`/idea-promote` until step 3 lands.** Between step 2 and step 3 a ruling would be written in two
places, the record and the promotion commit's body. That is redundancy rather than contradiction,
and step 3 removes it. `/idea-assess` is safe to run from step 1, and `/idea-approve` from step 2.

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
- **The human's ruling closes the record**, under its own heading, and arrives later than the rest.

**Re-assessment replaces the record while the idea is in the ideas lane.** One idea carries one record, holding the assessment the next promotion would be granted on.

**`idea-blob` is what makes a stale record visible.** Take it with `git hash-object -- backlog/ideas/<name>.md`. Git already assigns the file that id, so the assessed text stays retrievable by it and sync is a comparison rather than a second scheme.

**The record is prose, and `claim-discipline.md` binds it.** Date every figure, name the tree it was taken on, and write the whole record as history.

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

`None recorded.` is a live anchor rather than filler: the ruling replaces that one line, and an idea nobody rules on keeps a true statement.

## Layer 3 — the calibration record
````

The new section sits above Layer 3 deliberately. Layer 3 is about what the record is compared
against; this section is about what the record is.

### A2 — `.claude/skills/idea-assess/SKILL.md`, replaced whole

Seven things change, and the rest of the file is carried across unedited: the frontmatter gains
`when_to_use` and drops `disable-model-invocation`, `allowed-tools` gains a path-qualified
`Write`, the numbered procedure gains two steps, a one-invocation rule lands above it, a
claim-discipline rule joins the record rules, a new block of write rules closes the file, and the
description names the record.

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
allowed-tools: Read, Write(backlog/ideas/*.assessment.md), Bash(git *), Grep, Glob
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
- `claim-discipline.md` binds this record. Date every figure, name the tree, and write the record as history.
- Close with the human-ruling heading and `None recorded.` The ruling is a separate act, and `/idea-approve` writes it.

Rules that bind the write:

- Write exactly one file, `backlog/ideas/<name>.assessment.md`, beside the target.
- Change nothing else. The idea file, its frontmatter and its lane are not yours to touch.
- Replace an existing record whole. One idea carries one record.
- Say in your report that a replacement discards the ruling the old record carried, when it carried one.
- A target outside the ideas lane is already promoted, and its record is frozen. Return the record and write no file.
- Ignore any hook line naming the file you just wrote. Only the Layer 1 output above is yours to assess against.
- Match the 120-character width. Formatting is prettier's job.
- The judging pass never rules and never promotes. Both are separate human-invoked commands.

Return the record and the path you wrote, so the seat can rule on it.
```

**If the write is refused at first use, the grant is the cause.** The path-qualified form is
argued above. The fallback is `Write(backlog/ideas/**)`, and the write rules carry the rest.

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

**Find** (a clause; one occurrence — the leading space and the em dash are part of it):

```text
 — the judging pass itself writes nothing.
```

**Replace with:**

```text
. The judging pass writes its own assessment record and nothing else.
```

The replacement opens with a full stop that closes the preceding sentence. Splitting the sentence
here is deliberate: the 26-word `STE.SentenceLength` finding on this line is pre-existing, and the
split may clear it. Clearing it is acceptable; introducing a new finding is not.

## Part B — step 2, the ruling as its own act

### B1 — `.claude/skills/idea-approve/SKILL.md`, a new file

**Create with:**

```text
---
name: idea-approve
description: Record the human's per-letter ruling into an idea's assessment record, as its own act before any promotion.
argument-hint: '[backlog/ideas/<name>.md]'
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git *)
---

# Rule on an assessment

Record the user's ruling on the assessment for $ARGUMENTS. The human invocation of this command is the ruling, and nothing else may write that section.

Preconditions, checked in order:

- **The record must exist**, at `backlog/ideas/<name>.assessment.md`. Absent one, stop and report that `/idea-assess` writes it.
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result against the record's `idea-blob`. On a difference, stop and report it, and recommend a fresh `/idea-assess`.
- **The ruling must be in this conversation**, per letter: agree, or differ with the reason. Absent a letter, ask for it and stop.
- **The target must sit in the ideas lane.** A promoted record is frozen. Stop and say so.

Then:

1. Replace the record's `None recorded.` line with the ruling.
2. Commit the record alone, naming the idea in the subject.

The ruling's shape, in place of that one line:

- Open with `Ruled <YYYY-MM-DD>.` on its own line.
- Then one line per letter, all six, in the order the summary table holds them.
- Each line names the letter as the table spells it, then `agree` or `differ`.
- A differing letter carries the user's reason on the same line. An agreement carries none.

Rules that bind the write:

- Rule on every letter, a declined score included. A missing letter refuses the next promotion.
- Change nothing else in the record. The judge's half is never edited, at any point.
- A record already ruled on may be ruled on again while the idea is in the ideas lane, replacing the ruling whole.
- A fresh `/idea-assess` discards the ruling, since the ruling was given on findings that no longer stand. Rule again after a re-assessment.
- Match the 120-character width. Formatting is prettier's job.

Report the commit hash.
```

**Why this file carries the ruling's shape and `definition-of-ready.md` does not.** The skill is
the shape's only writer, and the reference carries the lifecycle rule. One home each, and no
restatement to drift.

## Part C — step 3, promotion

### C1 — `.claude/skills/idea-promote/SKILL.md`, replaced whole

Five things change: the preconditions read the record rather than the conversation and gain both
the completeness and the sync check, the numbered procedure gains the second move and loses the
ruling write, the commit body carries a summary rather than the record in full, the immutability
rule lands, and an allow-marker covers the `assessment.md` token.

**Replace the whole file with:**

```text
---
name: idea-promote
description: Promote a ruled-on candidate to backlog/ready, carrying its assessment record and freezing it.
argument-hint: '[backlog/ideas/<name>.md]'
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git *)
---

<!-- reference-check: allow assessment.md -- the per-item artifact name this procedure creates; no item carries one yet, and the marker goes stale (delete it) when the first does -->

# Promote an idea

Move the candidate in $ARGUMENTS to its `backlog/ready/<name>/` folder, carrying its assessment record. The human invocation of this command is the grant; neither the judging pass nor the ruling promotes.

Preconditions, checked in order:

- **The assessment record must exist**, at `backlog/ideas/<name>.assessment.md`, carrying a Ready disposition. Absent one, stop and report that `/idea-assess` writes it.
- **The record must carry a ruling on every letter.** A record with none, or one missing a letter, refuses the promotion. Stop and report that `/idea-approve` records it.
- **The record must be in sync with the idea.** Run `git hash-object -- backlog/ideas/<name>.md` and compare the result against the record's `idea-blob`. On a difference, stop and report it. The record describes text the idea has since changed, and the recommended remedy is a fresh `/idea-assess` followed by a fresh `/idea-approve`.
- **Report the lane count.** Run `git ls-files 'backlog/ready/*/proposal.md'` and count. Above three, report the cap and proceed only on the user's word, since a hard refusal would be the board's first gate.
- **The kind must be in the file's frontmatter.** Absent a `kind:` line, take it from the record and add it in step 4, never in the move commit.

Then, in this order:

1. Run `git mv backlog/ideas/<name>.md backlog/ready/<name>/proposal.md`.
2. Run `git mv backlog/ideas/<name>.assessment.md backlog/ready/<name>/assessment.md`.
3. Commit both moves alone, with the body below. Rename detection is content-based, so neither basename change defeats it.
4. Flesh out the proposal afterwards, as its own commit, if the file needs it.

The move commit's body carries the judge's summary: the kind, the disposition, and each of the six scores beside its one-line finding. It names the date the record was ruled on, so a reader of `git log` can see the ruling preceded the grant. The record in full stays in the file, and no total travels in either place.

**This command writes nothing inside the record.** Both halves are already there, and the sync check above covers both — a ruling cannot outlive the record that holds it.

**The record is immutable from the move commit.** A retro compares what happened against the assessment the promotion was granted on, so the frozen text is the point. The stored `idea-blob` stops matching once the proposal is fleshed out, and that divergence is expected history rather than a defect.

Report the commit hash and the new paths.
```

**Three obligations leave this file, and each is accounted for.** The precondition that a judge's
record sit in the conversation is replaced by the stronger file-existence check, and the Ready
disposition it also checked survives in the replacement. The precondition that the human's ruling
sit in the conversation is replaced by the completeness check on the record, which is stronger
again: a conversation cannot be re-read at a retro. The clause attributing the `kind:` write to
`/idea-assess` is dropped as false — CLAUDE.md attributes that write to the seat, and item A4 does
not change it. The parenthetical explaining rename detection moves into step 3, shortened.

### C2 — `.claude/references/definition-of-ready.md`, the promoted lane

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

### C3 — `.claude/references/definition-of-ready.md`, Layer 3

**Find** (two whole lines, each its own paragraph):

```text
The record lives in git, with no new artifact class.

A promotion commit carries **two records in order**. First the judge's six letters as rendered, each number with its finding text. Then the human's ruling per letter — agree or differ, with the reason on each differing letter. Write the judge's half first, and never edit it afterwards. Without the second record the human's verdict is a contaminated label, and calibration would measure agreement with itself.
```

**Replace with:**

```text
Both halves live in the assessment record, and git holds the history of each.

An assessment carries **two records in order**. First the judge's six letters as written at assessment, each number with its finding text. Then the human's ruling per letter — agree or differ, with the reason on each differing letter. The judge's half is written first and is never edited afterwards. Without the second record the human's verdict is a contaminated label, and calibration would measure agreement with itself.

**The ruling is its own act.** `/idea-approve` records it into the record whenever the user makes it, at any point after the judging pass. Promotion writes nothing inside the record.

**Promotion requires a complete, non-stale record.** It refuses a record carrying no ruling, a ruling missing a letter, or an `idea-blob` that differs from the idea file's current blob id. The ruling inherits the record's staleness, since a re-assessment replaces the record whole and takes the ruling with it. The procedure halts and recommends a fresh assessment, which needs a fresh ruling after it.

**The record is immutable from the promotion's move commit.** Until then it sits in the ideas lane, where a re-assessment may replace it whole and a second ruling may replace the human's half. A retro compares what happened against the record the promotion was granted on, which is the frozen text. The move commit carries the judge's summary instead of the record in full: the kind, the disposition, and each score beside its one-line finding.
```

Leave the declines paragraph, the calibration-pass paragraph and the stated risk untouched.

### C4 — `.claude/references/pipelines.md`, the frontmatter exception

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

### C5 — CLAUDE.md, the ready-lane artifact list

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

**That marker is in CLAUDE.md's Idea board section**, on the line above the three-lane paragraph.
The identical `tasks.md` line in `pipelines.md` is item C4's, and the two edits are the same shape
in two files.

### C6 — CLAUDE.md, the promote bullet

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
The move commit's body carries the judge's summary rather than either record in full, since the assessment record already holds both halves: the judge's at assessment, and the human's per-letter ruling whenever `/idea-approve` recorded it.
```

Leave the two sentences that follow — the pointer to `definition-of-ready.md` and the
`/idea-promote` attribution — exactly as they stand.

## Part D — step 4, the evidence

All four items append to `.claude/references/definition-of-ready.meta.md`, in the order given,
each separated from its neighbour by one blank line. The file is exempt from every Vale rule, so
its register is the dated-record register throughout.

### D1 — the artifact's rulings

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
- **2026-09-20, the human's half.** It lives in the record, judge's half first. The calibration
  design turns on the human label being ruled against the judge's rather than merged into it, and
  the order is what keeps the two readable as two.

**The name, ruled by `coach` at SPEC and confirmed by the user 2026-09-20.**
`backlog/ideas/<name>.assessment.md` in the ideas lane, `assessment.md` in the item's folder. The
second form is a bare filename token `npm run reference-check` resolves by basename, so four files
carry an allow-marker of the shape the board's other unlanded artifact name already carries — the
multi-unit task list, named in CLAUDE.md and in the pipelines reference with exactly that marker.
The first form costs nothing: the
extractor discards a token whose basename starts with a dot, which is what the placeholder form
reduces to.

**Frontmatter, and which field is weakest.** `idea-blob` is the fact that forced the exception —
no position supplies it. `assessed` is a claim about when the judging ran, which `git log` can
corroborate but not state. `name` is the weakest of the three: it restates the basename in the
ideas lane and the folder after promotion. It stays because it is the slug that survives both
moves and binds the record to its idea independently of position. A later ruling may drop it
without touching the other two.

**`assessed:` deliberately does not reuse `created:`.** The board's `created:` field means the
day a candidate was filed. Reusing the spelling would let a reader take one date for the other.
```

### D2 — the ruling as its own act

**Append, after D1:**

```text
## The ruling decouples from promotion (ruled by the user 2026-09-20)

The first draft of this design had `/idea-promote` write the human's half into the record as a
second commit. The user ruled that the ruling is its own act, made at any time after the judging
pass and before promotion. Promotion then moves a record that is already complete, and writes
nothing inside it.

**Open question 1, as the proposal posed it, is settled by that ruling plus one `coach` ruling.**
The human's half leaves the promotion commit's body entirely. It lives in the record, and the
commit that records it is its own. The objection considered and answered: a commit body is
immutable and a file is not, so moving the human's half into the file looks like a loss. It is
not. The ruling commit's diff is held by git exactly as a body is, and the promotion's judge
summary gives a second fixed point a tampered record can be checked against.

**Sub-decision 1 — a third skill, `/idea-approve`, rather than the seat editing by hand.** Four
reasons: a hand-edit is the class of act this artifact exists to remove; the skill compares the
blob id mechanically rather than by eye; it refuses deterministically on a missing record, a stale
record or a ruling missing a letter; and `disable-model-invocation: true` keeps the grant human,
as `/idea-promote` already does.

**Sub-decision 2 — the ruling inherits the record's staleness, with no second stamp.** The ruling
sits inside the record, the record carries `idea-blob`, and a re-assessment replaces the record
whole. So a stale ruling is a stale record, and promotion's existing comparison covers both
halves.

The threat this accepts: a judge's half edited by hand after the ruling, with no re-assessment. A
second stamp over the judge's half would catch it; the inheriting reading cannot. Accepted for
three reasons. The board has one editor, so the hand-edit is a discipline breach rather than
drift. The never-edit rule already governs the judge's half. And a second stamp has no git-native
id to use, since git ids whole files rather than sub-ranges — it would be the bespoke scheme the
blob-hash ruling exists to avoid. What would reopen it: a second editor of the board, or one
observed instance.

**Immutability, stated for the decoupled lifecycle.** The record is mutable in the ideas lane, by
re-assessment and by a second ruling, and immutable from the promotion's move commit. One
sentence was needed beyond what replacement already said, and it sits in `/idea-approve`: a fresh
assessment discards the ruling, because the ruling was given on findings that no longer stand.
```

### D3 — the Vale ruling, reversed

**Append, after D2:**

```text
## Rules on the record surface (ruled by the user 2026-09-20, reversing a `coach` ruling)

`coach` ruled at SPEC that no rule should be enabled on the record, on three arguments: the board
is a raw-register surface, a finding on a frozen record cannot be cleared without breaking
immutability, and the surface cannot be measured because no record exists. The user reversed it
and directed that rules be enabled.

**The recommendation.** The three `Claim` rules — `AudienceRoster`, `WordingIdentity` and
`SentenceInitialMost` — at `warning`, on a `.vale.ini` section scoped to
`[backlog/ideas/*.assessment.md]`, with explicit per-rule keys and no `BasedOnStyles`. The section
must sit after `[backlog/**/*.md]`, since sections stack and the later one wins per key, and it
must not name a style in `BasedOnStyles`, which would re-enable the whole style and destroy the
earlier per-rule keys.

**The immutability argument survives the reversal and is answered by the glob, not dropped.** A
record in the ideas lane is mutable, so a finding there is clearable. A promoted record matches
only `[backlog/**/*.md]` and keeps `Board.NoStatusField` alone, so a frozen record never carries a
clearable finding. The lane-scoped section is the whole answer, and it is available only because
Vale's sections are path globs.

**The evidence, given that the surface cannot be read.** Each rule's own header carries a dated
2026-09-15 precision run over the instruction corpus: three hits in total, zero on every enabled
surface, zero clean false positives. These are phrase fingerprints rather than register
heuristics, so their false-positive surface is bounded on an unmeasured corpus. They also
mechanise three forms of `claim-discipline.md`, which is the record's binding rulebook, so
enabling them adds no second standard.

**The register families wait for a corpus.** `STE`, `Instruction` and `Procedure` are not
recommended yet: their false-positive surface is unbounded here,
`Instruction.ParagraphSentences` looks likely to fire on a per-letter detail section, and the
landing constraint forbids enabling over a backlog nobody has counted. Re-ask at roughly ten
records.

**Why the enable did not land in the slice that created the artifact.** Two independently
sufficient reasons, both measured 2026-09-20.

1. `.vale.ini` is `architect`'s by practice and outside `writer`'s surface. `git log -- .vale.ini`
   shows every role-attributed commit reading `By architect.` except one, `By the orchestrating
   seat.` on the process-pipeline staffing commit. `writer.md` enumerates its write surface, and
   `.vale.ini` appears in neither that grant nor its prohibition list. The `enabler-process` cycle
   has no `architect` step to route the edit to.
2. The enable alone would not reach the judge at the one moment a record is fixable.
   `scripts/prose-write-hook/audit.ts`'s `inScope` accepts only paths under `.claude/skills/` or
   `.claude/references/`, so the write-time prose loop refuses a `backlog/` path whatever
   `.claude/settings.json` sends it. Extending it is a `scripts/` change with its own unit test.

**What is reachable without either change.** `npm run prose-lint` lints every tracked `*.md` minus
`src/catalyst/`, so the board is already in its file set. Measured 2026-09-20:
`npm run prose-lint -- --scope backlog` linted 115 tracked files and reported zero findings. An
enabled rule would show up in that standing run, just not at write time.

**What the corpus may therefore not say.** No instruction file states that nothing lints the
record. That would be an undated present-tense claim about another file, falsified on the day the
follow-up enabler lands.
```

### D4 — what the checkers and the harness do with the new file

**Append, after D3:**

```text
## What the board checkers do with the record (read 2026-09-20)

Read off `scripts/board-shape-hook/board-shape.ts` at tip `44bbf55`, rather than run: the
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

## The path-qualified `Write` grant (probed 2026-09-20)

The judging skill's grant is written as `Write(backlog/ideas/*.assessment.md)`. Probed against the
installed Claude Code binary, build 2.1.236: it carries the literals `"Edit(docs/**)"` and
`"Edit(//etc/*)"`, the repo-relative and absolute forms of a file-tool path specifier, so the
permission-rule grammar accepts a path-qualified rule for a file tool in that build. The
`--allowed-tools` flag's help text gives `Bash(git *) Edit` as its example, the frontmatter
validator stores entries as raw strings, and this repo already depends on `Bash(git *)` in the
same field.

Unproven, and stated as such: that a skill's `allowed-tools` entries are evaluated by the same
matcher as `settings.json`'s `permissions.allow`. The probe read strings from a stripped binary
rather than a code path.

No spike was filed, because every failure mode is acceptable and one is loud. A binding specifier
scopes the grant, which is the goal. A non-matching entry refuses the write, and the skill reports
that it could not write the record at first use. An ignored specifier leaves an unscoped `Write`,
which is where a prose-only constraint already stood. The fallback, if the write is refused, is
`Write(backlog/ideas/**)`.
```

## Expected readings — predicted, not measured

**`coach` edits no corpus file in either mode, so no reading below was taken with the items
applied.** Each is a prediction with its mechanism named. A divergence is a finding for `editor`
AUDIT or for `coach` REVIEW, not a licence to edit the spec.

Baselines were taken on 2026-09-20. **The three `npm run` rows were run in this worktree at tip
`44bbf55`, with `.vale/` synced. The per-file `vale` rows were run in the primary checkout at
`1e9ac63`**, where each of those files and `.vale.ini` are byte-identical to this worktree's copy
— verified with `diff` the same day, and the reason the readings transfer.

| Check                                                 | At tip `44bbf55`                   | Predicted with all items applied                    |
| ----------------------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| `npm run agent-doc-check`                             | 54 docs, 8 agents, 32 rules, clean | 55 docs, clean — one new skill file                 |
| `npm run reference-check`                             | 537 files, 3,204 refs, no failures | more files and refs, no failures; four markers live |
| `vale .claude/skills/idea-assess/SKILL.md`            | 0 in 1 file                        | 0 in 1 file                                         |
| `vale .claude/skills/idea-approve/SKILL.md`           | no such file                       | 0 in 1 file                                         |
| `vale .claude/skills/idea-promote/SKILL.md`           | 0 in 1 file                        | 0 in 1 file                                         |
| `vale .claude/references/definition-of-ready.md`      | 0 in 1 file                        | 0 in 1 file                                         |
| `vale .claude/references/pipelines.md`                | 0 in 1 file                        | 0 in 1 file                                         |
| `vale .claude/references/definition-of-ready.meta.md` | 0 in 1 file, by exemption          | 0 in 1 file, by exemption                           |
| `vale CLAUDE.md`                                      | 21 warnings in 1 file              | 20 or 21 — see A4                                   |
| `npm run prose-lint -- --scope backlog`               | 115 files, 0 findings              | 115 files, 0 findings — no board file is added      |
| `npx prettier --check` on the seven files             | clean                              | clean                                               |

**Read the `definition-of-ready.meta.md` row as a confident zero rather than a pass.**
`.vale.ini`'s final `[**/*.meta.md]` section switches every rule off by name, so no sentence in
D1 to D4 is linted. The `in 1 file` count is what separates that exemption from a run that
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

- **The `.vale.ini` enable, and the write-time loop's reach.** Argued above and recorded in D3.
  Both belong to a new `enabler-technical`, recommended through this spec's handoff. This slice
  edits no config and no `scripts/` file.
- **Layer 1's hash check and the `reference-check` board carve-out.** Split out on 2026-09-20
  into `checkers-do-not-reach-the-assessment-sidecar`, which owns `scripts/`.
- **The classifier's misreading of a two-segment record.** Named in item D4 as a finding, and
  recommended to that same technical enabler through the handoff.
- **Retrofitting records for ideas already assessed.** The board's existing calibration record
  stays in the commits that carry it. A retrofitted record would be a reconstruction wearing a
  contemporaneous record's shape, which is the one thing calibration cannot use.
- **`backlog/TEMPLATE.md`.** It is the idea-file shape, and a record is not an idea file.
- **What a retrospective does with the record, and the retrospective's deletion of the folder.**
  The retro's trigger and owner are unruled, and the board already carries a candidate about
  deleted evidence. Nothing here rules either.
- **A second staleness stamp over the judge's half.** Ruled out above, with the accepted threat
  and the two conditions that would reopen it.

## The amendment path

If this spec needs changing after sign-off, it changes through `amendment-1.md` in this item's
folder, authored by `coach` in either mode, and never by editing this file. A `writer` that
cannot execute an item returns it and stops; that return is a trigger for an amendment rather
than an amendment.

**An amendment that replaces a block names every obligation the block carried that the
replacement does not**, per the rule in `.claude/references/pipelines.md`.

## Sign-off

The user signs this spec before `writer` runs. The cycle then runs step 2 of the process pipeline
four times, once per step in the ordering above, scoped to
`.claude/skills/idea-assess/SKILL.md`, `.claude/skills/idea-approve/SKILL.md`,
`.claude/skills/idea-promote/SKILL.md`, `.claude/references/definition-of-ready.md`,
`.claude/references/definition-of-ready.meta.md`, `.claude/references/pipelines.md` and
CLAUDE.md, and nothing else.
