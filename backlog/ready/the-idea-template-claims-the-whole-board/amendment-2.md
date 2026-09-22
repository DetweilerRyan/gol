# Amendment 2: the-idea-template-claims-the-whole-board

By `coach` (REVIEW), 2026-09-22.

## Item numbers this amendment names

**Items 10 to 14**, new numbers. Each corrects text this slice itself wrote.

**What it supersedes**, and nothing it does not name:

| Item | Supersedes                                                     | Granularity               |
| ---- | -------------------------------------------------------------- | ------------------------- |
| 10   | One sentence of item 3's verbatim block                        | the block's last sentence |
| 11   | One clause of item 2's verbatim block                          | the block's last sentence |
| 12   | Item 7a's verbatim replacement, plus the two sentences it left | the whole paragraph       |
| 13   | Nothing — pre-existing text item 6 falsified                   | new                       |
| 14   | Item 4's line breaks, and no word of item 4's text             | whitespace only           |

**Item 6 is not superseded, and R7 and R8 stand.** The positive gate in
`.claude/skills/idea-assess/SKILL.md` is correct and is the reason three of the five items below
exist: it falsified older prose that described the enumerated gate it replaced. Correcting that
prose is not a retreat from the ruling.

## Why this amendment exists

`editor` returned findings across three passes. `coach` REVIEW read them against the landed corpus
and ruled each one. **Five findings are defects in text the signed spec supplied verbatim**, and
they landed exactly as signed — `writer`, `editor`, `coder` and `cleaner` executed correctly and
diverged from nothing. The remaining findings are pre-existing or belong to another role, and they
travel as recommendations rather than as items. The full ruling is in "Findings ruled out of this
amendment" below.

**The defect class, named once so the remedy is legible.** A spec's verbatim block is corpus prose
that reaches the tree without an editor ever having read it. `editor` CLEAN reads the landed file,
so the catch arrives after the user's signature, when the text is immutable without an amendment.
That is a structural gap in the enabler-process pipeline rather than an error by any role, and it
goes out as a recommendation below.

## R13 — a universal over readers of a board file is not worth one, and this is the second time

**Finding.** CLAUDE.md's board paragraph ends "Vale's advisory `Board` style is the only other
reader of a board file." The next paragraph opens by naming Prettier, which reads board files. The
universal is false on the page it sits on.

**Measured by `coach` 2026-09-22 on the branch tip:** `npm run format:check` exits 0 over a tree
whose `.prettierignore` excludes no `backlog/` path, so Prettier reads every board file on every
run.

**The ruling: drop the universal rather than repair it.** A repaired universal —
"the only other reader that checks a board file's content" — is a second unchecked claim in the
same sentence position, and nothing gates it. `claim-discipline.md` rules "Name which, not how
many", and a universal is the unbounded form of that count. CLAUDE.md's own Conventions already
record that this file "has carried a false universal twice"; this is the third.

**What is lost, and why that is acceptable.** The sentence carried two obligations: name the
`Board` style as a reader, and close the roster. The first is kept. The second is dropped
deliberately. The reader loses nothing, because the next paragraph names Prettier and the
paragraph above names the hook, so the complete set is on the page without any sentence asserting
it is complete.

## R14 — the config sentence names two fields the config does not have

**Finding.** CLAUDE.md says `board-lanes.config.json` "declares item depth and basename only". Read
by `coach` 2026-09-22: the file declares `shape` per lane, plus `item` for a folder lane. Depth is
derived from `shape`, not declared. A reader who opens the config to check finds neither word.

**The load-bearing half is correct and stays.** "Nothing machine-readable pairs a lane with a
template" is the claim the sentence exists to make, and R4 ruled it. Only the evidence clause after
the dash is wrong, and it is wrong in the direction that invites a reader to go looking for a field
list.

**The schema is not cited as the enforcer, and that was checked rather than assumed.**
`schemas/board-lanes.schema.json` does set `additionalProperties: false`, which would make a
tempting closing clause. Its own `description` says it is an editor affordance and that the runtime
validator in `scripts/board-shape-hook/lane-declarations.ts` never reads it. R1's measured refusal
came from that validator. Citing the schema would publish a wrong mechanism behind a right verdict,
which is the signature `claim-discipline.md` names. No closing clause is added.

**`.claude/references/pipelines.md` needs no matching edit, and this was read rather than assumed.**
Item 4's landed paragraph says "any file at a folder lane's item depth that is neither the declared
item nor an assessment record". It uses depth as a derived property and names "the declared item",
which is what `item` is. Both are accurate. The seat's comparison flagged shared vocabulary; the
shared vocabulary is correct on that side.

## R15 — item 6 falsified two sentences of `SKILL.meta.md`, and dating them is the whole fix

**Finding 1, the self-contradiction.** `SKILL.meta.md` asserts in the present tense that
"The `off the board` stop clause closes the same gap for one more line shape." Item 6 deleted that
clause. The file records the deletion eleven lines below, in the section item 7b appended, and
contradicts itself in between.

**Finding 2, the stranded consequence.** The same file's basename-guard paragraph closes
"Delete the basename guard and a reader holding that line finds a `LAYER1` line present, no stop
clause that names it, and no instruction covering the case." Under item 6's gate an assessment
record prints `an assessment record, 0 checks`; zero is not non-zero, so the gate stops the pass
and a clause does cover the case. Item 7a dated that paragraph's first two sentences and instructed
the rest be left unchanged, which is what `writer` did.

**The ruling: date both, and add nothing.** Each sentence was true on 2026-09-20 and is a record of
that date. `claim-discipline.md`'s escape hatch applies exactly — "You may write a claim in every
form above ... provided you write it as history."

**The guard's justification does not need rebuilding, and this was checked rather than assumed.**
Two passages below the dated one carry it independently: "The hook reports; it does not enforce",
and the `What was ruled out` section recording the user's 2026-09-20 ruling that a stop clause
keyed on the hook's wording was rejected and the guard stays. Item 7b's own appended section repeats
it. So a reader who finds the dated sentence no longer current still finds three live reasons the
guard is there. **`writer` adds no new justification sentence**, and the falsifier below turns on
exactly that.

## R16 — item 4's paragraph carries a register item 9's does not, in the same file

**Measured by `coach` 2026-09-22 on the branch tip.** `.claude/references/pipelines.md`'s prose
lines run 90 to 103 characters, table rows excluded. Item 4's landed paragraph is one line of 548.
Amendment 1's item 9 supplied its replacement as three wrapped lines in the same file.

**Both registers came from artifacts `coach` authored**, and `writer` reproduced each verbatim as
instructed. The fix is whitespace and changes no word.

**`npm run format:check` cannot catch it.** `.prettierrc.json` sets no `proseWrap`, so the default
`preserve` leaves any paragraph's line breaks alone. Amendment 1 measured this and used it to prove
item 9 could not reflow; the same property is why this one never reported.

**Why it is worth an item rather than a shrug.** A one-line paragraph makes every future edit to it
a whole-paragraph diff, in the file the seat and three roles read before composing an invocation.
The same defect appears in miniature in `SKILL.meta.md`, where item 7a's one-line block left a
113-character line in a file wrapping near 95; item 12 fixes that one as part of its own paragraph.

## Item 10 — CLAUDE.md, the reader universal — `writer`

**Anchor.** In the Idea board section, the paragraph beginning `Nothing enforces any of this, and`.
Its last sentence reads:

```text
Vale's advisory `Board` style is the only other reader of a board file.
```

**Replace that sentence with:**

```text
Vale's advisory `Board` style also reads a board file.
```

Change no other byte of that paragraph. The three sentences before it stay exactly as item 3 wrote
them, and the Prettier paragraph below stays untouched.

Measured 2026-09-22: the replacement is 9 words, and CLAUDE.md's live Vale findings are
`STE.SentenceLength` and `Procedure.ProcedureLength` throughout, neither of which a shorter
sentence can trip.

## Item 11 — CLAUDE.md, the config field list — `writer`

**Anchor.** In the Idea board section, the paragraph beginning `` `backlog/IDEA-TEMPLATE.md` is the
`ideas/` lane's item shape: ``. Its last sentence reads:

```text
Nothing machine-readable pairs a lane with a template — `board-lanes.config.json` declares item depth and basename only.
```

**Replace that sentence with:**

```text
Nothing machine-readable pairs a lane with a template — `board-lanes.config.json` declares a lane's shape and, for a folder lane, its item basename.
```

Change no other byte of that paragraph. The two sentences before it stay exactly as item 2 wrote
them.

Measured 2026-09-22: the replacement is 21 words against the original's 18, and
`STE.SentenceLength` caps descriptive text at 25. The paragraph reports no Vale finding today and
cannot gain one from three words.

## Item 12 — the assessment sidecar's dated paragraph — `writer`

**Anchor.** In `.claude/skills/idea-assess/SKILL.meta.md`, under
`## Why the basename guard is duplicated in prose`, the whole second paragraph. It opens
`**Measured 2026-09-20, the guard covered a gap` and closes `and no instruction covering the case.`

**Replace that whole paragraph with:**

```text
**Measured 2026-09-20, the guard covered a gap every stop clause keyed on the `LAYER1` output
left open.** Those clauses keyed on a line shape in that output, or on its absence. The record
refusal printed a shape none of them named — `an assessment record, 0 checks` — so deleting the
basename guard on that date would have left a reader holding that line with a `LAYER1` line
present, no stop clause naming it, and no instruction covering the case.
```

Keep the line breaks exactly as written above. `proseWrap` is `preserve`, so Prettier returns them
unchanged.

**What this block drops, sentence by sentence, and where each obligation lands:**

| Dropped                                            | Where it lands                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| The second `Measured 2026-09-20,` sentence opener  | the paragraph's own opening date now carries both claims            |
| "the record refusal prints", present tense         | "printed", inside the same dated frame                              |
| "Delete the basename guard and a reader ... finds" | "deleting the basename guard on that date would have left a reader" |
| The three-clause list after "finds"                | kept whole, re-tensed                                               |
| The 113-character first line                       | re-wrapped to the file's own width; no word changes                 |

**Add no sentence to this paragraph.** The guard's live justification sits in the two passages below
it and in item 7b's appended section, per R15.

## Item 13 — the assessment sidecar's `off the board` claim — `writer`

**Anchor.** In the same file, the last paragraph of that same section. It opens with the bold
sentence "The `off the board` stop clause closes the same gap for one more line shape."

**Replace that whole paragraph with:**

```text
**Until 2026-09-22 an `off the board` stop clause closed the same gap for one more line shape.**
Measured live 2026-09-20, `node scripts/board-shape-hook/run.ts src/camera.ts` printed a
`LAYER1` line reading `off the board, 0 checks`, which no stop clause named until
`checkers-do-not-reach-the-assessment-sidecar` added one — the same gap as the basename
guard's, one line shape later. The 2026-09-22 positive gate section below records what
replaced that clause.
```

Two changes beyond the tense of the opening sentence: `prints` becomes `printed`, so the paragraph
holds one tense throughout; and a closing sentence points at the section that records the
replacement, so a reader meeting the past tense does not have to hunt for what happened.

The filename tokens are unchanged from the current paragraph, so `npm run reference-check` has no
new token to resolve.

## Item 14 — the pipelines paragraph's line breaks — `writer`

**Anchor.** In `.claude/references/pipelines.md`, the single-line paragraph beginning
`**The kinds are not a closed set.**`.

**Replace that line with these six lines:**

```text
**The kinds are not a closed set.** `scripts/board-shape-hook/board-shape.ts` classifies on two
axes, and only one of them is a name lookup. The hook looks a lane up in
`board-lanes.config.json`, so an undeclared lane draws its own refusal. A per-item artifact
stays positional: any file at a folder lane's item depth that is neither the declared item nor
an assessment record. So an artifact kind nobody has named yet is covered in an item's folder
on the day it lands. `scripts/board-shape-hook/board-shape.meta.md` carries the axis-split ruling.
```

**No word changes.** Compare the two forms word by word before committing: this item is whitespace
only, and a word slipping in here would be an unsigned corpus edit wearing a formatting item's
name.

## Check readings

**Taken by `coach` 2026-09-22 on this slice's branch tip, before any item above landed.**
Re-derive rather than inherit them.

| Check                                              | Before                                         | After                       |
| -------------------------------------------------- | ---------------------------------------------- | --------------------------- |
| `npm run prose-lint`, CLAUDE.md findings           | 18, none on the two lines items 10 and 11 edit | 18, and none on those lines |
| `npm run prose-lint -- --scope .claude/references` | 8 files, 1 finding: `merge-protocol.md:21`     | the same 1                  |
| `npm run prose-lint -- --scope .claude/skills`     | 6 files, 1 finding: `idea-approve/SKILL.md:40` | the same 1                  |
| `npm run format:check`                             | exits 0                                        | exits 0                     |

**`.claude/skills/idea-assess/SKILL.meta.md` is outside Vale entirely**, measured rather than
assumed: `.vale.ini`'s `[**/*.meta.md]` section sets an empty `BasedOnStyles` and disables every
named rule. Items 12 and 13 therefore cannot move any prose-lint reading.

**What cannot move, and why saying so matters.** `npm run reference-check` and
`npm run agent-doc-check` are untouched by every item above: no item adds, removes or renames a
filename token, an `npm run` reference, agent frontmatter or a declared role cycle. Item 14 changes
whitespace only. `npm run test:scripts` cannot move either — no item reaches `scripts/`.
**This amendment is guarded by reading, not by a gate**, exactly as the spec said of the slice.

## The three properties a second amendment owes

`.claude/references/pipelines.md` requires a stopping condition, a falsifier and a fallback before
the seat runs a further round. All three are below.

### Stopping condition

Checkable by reading the landed files, with no re-measurement:

1. `.claude/skills/idea-assess/SKILL.meta.md` contains no present-tense sentence asserting a stop
   clause that `.claude/skills/idea-assess/SKILL.md` does not contain. Read the sidecar's bold lead
   sentences against `SKILL.md`'s four bold paragraphs.
2. CLAUDE.md's Idea board section asserts no universal over the readers of a board file. Search the
   section for "only other" and "the only".
3. CLAUDE.md names no field of `board-lanes.config.json` that does not appear in that file. Two
   names appear: `shape` and `item`.
4. `.claude/references/pipelines.md` carries no prose line longer than 103 characters. Table rows
   and the `reference-check` allow marker on line 3 are excluded; both predate this slice.
5. Items 12, 13 and 14 added no sentence that was not in this amendment's verbatim blocks.

### Falsifier

**If executing any item above requires adding a new claim about the hook, the classifier or the
gate — rather than dating, narrowing, re-tensing or re-wrapping text this slice already wrote —
then the defect is in item 6's design rather than in its prose.** In that case stop, do not write a
third amendment, and re-open R7 and R8 with the user. The observation to watch for is `writer`
reporting that a dated sentence leaves the basename guard unjustified: R15 rules that three live
passages already carry it, and a report to the contrary means that ruling is wrong rather than the
wording.

### Fallback

**Amendment 2 is the last round on this slice.** If `editor` CLEAN returns any finding in text this
amendment supplies, `writer` does not re-edit it and the seat does not hire `coach` again. The
finding is recorded in this item's `retro.md`, beside P1 and P2, and travels to `backlog/ideas/` as
a candidate. The cycle then closes with the finding on record. A fourth round on five sentences
costs more attention than the sentences are worth, and the recommendation below is the durable fix
for the class rather than for these instances.

## Execution

**One `writer` pass, items 10 to 14 together**, then one `editor` CLEAN over its manifest. Three
files: `CLAUDE.md`, `.claude/skills/idea-assess/SKILL.meta.md`,
`.claude/references/pipelines.md`.

There is no ordering dependency between the five. `editor` AUDIT does not re-run: it ran as the
closing gate on the corpus these items correct, and its findings are what produced them.

`coach` REVIEW then closes the cycle against `spec.md`, `amendment-1.md` and this file together.

## Findings ruled out of this amendment

Each was read against the tree by `coach` on 2026-09-22 and ruled here rather than deferred.

**`.claude/references/pipelines.md`'s wording-keyed paragraphs stay — ruled, not overlooked.** Two
paragraphs key on the hook's `non-candidate` wording, in the file that documents the classifier,
and R7 ruled enumeration fails open. R7 does not reach them. R7's subject was `SKILL.md`'s stop
clauses, which **were** the gate: an unenumerated wording passed straight through. These two
paragraphs gate nothing and describe two named situations, and for those two situations the wording
is correct — verified against `board-shape.ts`'s outcome literals. A reader holding `undeclared
lane` finds nothing here and is then stopped by `SKILL.md`'s positive gate, so the path fails safe.
The residual defect is coupling to the hook's wording, which is a different question from R7's and
deserves its own spec. **Recommendation, not an item.**

**`scripts/board-shape-hook/board-shape.meta.md`'s four remaining "this slice" indexicals stay.**
8E was signed as a one-off on a defect the spec named as pre-existing, and the class is corpus-wide:
17 instances across 8 sidecars. Fixing four of five here would expand scope past the signature and
still leave the class open. One mitigation makes the partial state tolerable rather than worse: the
file now names `one-item-shape-serves-every-lane` on its own page, so the referent the other four
elide is recoverable without a `git log -S`. **This is the one ruling where the gate-scoping rule
cuts the other way** — `engineering.md` says a finding on a file in your manifest is yours to fix,
and these four are in the manifest. That rule is written for gate findings, where the file's current
state causes the reading. Here the text is untouched, unfalsified and out of the signed scope.
**Recommendation, not an item**, and named so the tension is on record rather than hidden.

**CLAUDE.md's "Ten programs" is twelve on disk, and stays.** `scripts/` holds twelve program
directories; `board-shape-hook` and `prose-write-hook` are absent from the roster and run via `node`
from `.claude/settings.json` rather than an npm script, so "All ten run via `tsx`" is true of the
ten it lists. This is `claim-discipline.md`'s "The enumeration validates the count, not the claim"
exactly, and `engineering.md` already instructs readers to count the directories rather than trust
the figure. Pre-existing drift, made legible by item 3 naming one of the two absent programs in the
same file. It belongs with `apply-the-census-count-rule-everywhere`. **Recommendation, not an item.**

**`.vale.ini` has no `scripts/**/*.md` section, and it is not `coach`'s to author.**
`board-shape.meta.md` is the module-sidecar tier's first instance outside `src/`, and nothing is
lost today because `[**/*.meta.md]` exempts it. The first `scripts/<module>.md` instruction half to
land would match no section and report a clean zero. `vale-styles/**` and `.vale.ini` are
`architect`'s. **Recommendation, not an item.**

**CLAUDE.md's board-rendering-script paragraph stays, and `editor` was right to decline it.** It
claims a _rendering_ script would pay CRAP ≤ 6, a vitest suite, `dry4ts` and mutation testing. That
is true, and item 3 did not falsify it. A reader may now notice a board script already lives in
`scripts/`, which is a tension rather than a contradiction. **No change, and no recommendation.**

## Recommendations — for the seat's handoff, never edits here

- **An `enabler-process`: no reviewer sits between a spec's verbatim text and the user's
  signature.** Five of this slice's findings are defects in prose `coach` wrote into `spec.md` and
  `writer` reproduced correctly. `editor` reads the landed file, so the catch always arrives after
  the signature, when the text is immutable without an amendment. Two candidate remedies to weigh in
  that item's own spec: an `editor` pass over a spec's verbatim blocks before sign-off, or a
  `coach`-side self-audit obligation naming `claim-discipline.md`'s six forms as the checklist for
  every verbatim block. This slice is the measured instance — two amendments, five corrective items,
  zero role divergences.
- **An `enabler-process`: `pipelines.md`'s two hook paragraphs are keyed on the classifier's
  wording.** R7's positive-gate reasoning applies to the coupling, though not to R7's own fail-open
  argument. Scope it to that file and rule whether a description may key on a wording the
  description does not own.
- **An `enabler-process`: sweep "this slice" from the sidecar tier.** 17 instances across 8
  sidecars, counted by `editor` AUDIT 2026-09-22. `claim-discipline.md` already rules the form; only
  the sweep is missing, and a partial sweep is what this slice ended up performing.
- **A candidate for `architect`: add a `scripts/**/*.md` section to `.vale.ini`.** Latent until the
  first `scripts/<module>.md` instruction half lands, and silent when it does.
- **A candidate: CLAUDE.md's "Ten programs" is a census of twelve directories.** Pairs with
  `apply-the-census-count-rule-everywhere`.
- **A spike, carried forward from `spec.md` unchanged and now on its third measured instance: can
  an ambiguous basename be reported without a false-positive flood?** `reference-check` resolves by
  basename, `adr/TEMPLATE.md` absorbed `backlog/TEMPLATE.md`, and two stale citations of a renamed
  file read green — the one amendment 1 found in `pipelines.md`, and the two under `scripts/` the
  spec found by hand. The conditional `enabler-technical` behind it stands as the spec wrote it.

## Sign-off

**Unsigned.** `coach` stops here. Items 10 to 14 carry no authority until the user signs this file,
and `writer` runs nothing from it before then.

Items 1 to 9 keep the authority `spec.md` and `amendment-1.md` gave them. Nothing in this file
reopens a signed ruling: R1, R4, R6, R7, R8 and R11 all stand.

**The ruling most worth overturning is R13's second half** — dropping the roster-closing "only"
rather than repairing it. Repairing it is one word and keeps a stronger sentence; the cost is a
third unchecked universal in a file that has carried two. The user may take the repair instead with
one word, and item 10's replacement sentence is the only byte that changes either way.

Nothing below this line changes without a further amendment `coach` authors and the user signs
again. Per the fallback above, `coach` does not expect to author one.
