# Amendment 2: the-idea-template-claims-the-whole-board

By `coach` (REVIEW), 2026-09-22.

## Item numbers this amendment names

**Items 10 to 14**, new numbers. Four correct text this slice itself wrote; item 13 corrects
pre-existing text that item 6 falsified.

**Each item states an anchor and the properties the result must have, rather than a replacement
block.** `writer` writes the sentence. Where a fact is load-bearing the item says so and names
where to read it, which is never this file.

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

**This amendment was revised before signature, and the revision is that remedy applied to itself.**
Its first draft dictated five replacement blocks verbatim. The user ruled 2026-09-22 that it state
what must become true and leave `writer` and `editor` the autonomy to do their jobs. `coach.md`
already draws that line — "verbatim where wording is load-bearing", not verbatim throughout — and
four of the five items turn out not to reach it. Each item below says which half it is, and the
"What autonomy costs" section states the trade the signature now carries.

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

**Anchor.** In the Idea board section, the last sentence of the paragraph beginning
`Nothing enforces any of this, and`.

**Wording: not load-bearing. Write the sentence.**

**What must become true:**

1. The sentence still names Vale's `Board` style as a reader of a board file. That fact is the half
   worth keeping.
2. It asserts no universal over the readers of a board file — no "only", no closed roster, no count.
3. The three sentences before it are unchanged, and so is the Prettier paragraph below.

**Do not repair the universal by narrowing it.** "The only other reader that checks a board file's
content" would be a second unchecked claim in the same position. R13 rules that dropping it is the
fix, and the user's signature is on that ruling rather than on a sentence.

Measured 2026-09-22: this paragraph reports no Vale finding today. CLAUDE.md's 18 live findings are
`STE.SentenceLength` and `Procedure.ProcedureLength`, so a sentence at or under 25 words is clear.

## Item 11 — CLAUDE.md, the config field list — `writer`

**Anchor.** In the Idea board section, the last sentence of the paragraph beginning
`` `backlog/IDEA-TEMPLATE.md` is the `ideas/` lane's item shape: ``.

**Wording: not load-bearing, but the field names are. They are facts, and you read them off the
config rather than out of this amendment.**

**What must become true:**

1. The clause "Nothing machine-readable pairs a lane with a template" survives. It is item 2's
   signed text and the claim the sentence exists to make; only the evidence after the dash is wrong.
2. Every field the sentence names appears verbatim as a key in `board-lanes.config.json`. **Open
   that file and take the names from it.** The two words the sentence names today, "item depth" and
   "basename", are both absent from it: depth is derived rather than declared, and no key carries
   the second name.
3. The sentence does not cite `schemas/board-lanes.schema.json` as what forbids a template field.
   R14 says why — that schema's own description disclaims runtime authority.
4. The two sentences before it are unchanged.

Measured 2026-09-22: the paragraph reports no Vale finding, and the sentence it replaces is 18
words against `STE.SentenceLength`'s cap of 25. That leaves room, not licence.

## Item 12 — the assessment sidecar's dated paragraph — `writer`

**Anchor.** In `.claude/skills/idea-assess/SKILL.meta.md`, under
`## Why the basename guard is duplicated in prose`, the whole second paragraph. It opens
`**Measured 2026-09-20, the guard covered a gap` and closes `and no instruction covering the case.`

**Wording: not load-bearing. Re-tense and re-wrap the paragraph in your own words.** The one
exception is the measured output literal it already quotes, which is a hook output and stays as the
file has it.

**What must become true:**

1. Every claim in the paragraph reads as a record of 2026-09-20. No sentence asserts anything about
   the gate as it now stands.
2. The consequence about deleting the basename guard is scoped to that date. It was true then;
   item 6's positive gate has since made the unscoped form false, because an assessment record
   reports zero checks and the gate stops on any count that is not positive.
3. No sentence opens with the same dated phrase as the sentence before it. Two consecutive openers
   of `Measured 2026-09-20,` is the state item 7a left behind.
4. The paragraph's lines sit inside the file's prevailing width. Its first line is 113 characters
   today, in a file wrapping near 95.
5. **No new justification for the guard is added.** R15 names three live passages that already
   carry it, and the falsifier below turns on exactly this point.

## Item 13 — the assessment sidecar's `off the board` claim — `writer`

**Anchor.** In the same file, the last paragraph of that same section. It opens with a bold sentence
about the `off the board` stop clause.

**Wording: not load-bearing.** The command and the output literal the paragraph already quotes are,
and they stay as the file has them.

**What must become true:**

1. No sentence asserts that `.claude/skills/idea-assess/SKILL.md` contains a stop clause it does not
   contain. **Read `SKILL.md` and check**, rather than taking the deletion from this amendment.
2. The 2026-09-20 measurement survives as history, with its command and its quoted output intact.
3. The paragraph holds one tense throughout.
4. A reader meeting the past tense is pointed at the section recording what replaced the clause, so
   the change does not read as an unexplained gap.
5. No filename token is added or removed, so `npm run reference-check` has nothing new to resolve.

## Item 14 — the pipelines paragraph's line breaks — `writer`

**Anchor.** In `.claude/references/pipelines.md`, the single-line paragraph beginning
`**The kinds are not a closed set.**`.

**Wording: nothing here is load-bearing, because nothing here is wording.** This item is whitespace.

**What must become true:** the paragraph carries the same words in the same order, re-wrapped to the
file's prevailing prose width. Measured 2026-09-22: that file's prose lines run 90 to 103
characters with table rows excluded, and this paragraph is one line of 548.

**Check the word-for-word property before you commit**, with `git diff --word-diff` over that file.
A word slipping in here would be an unsigned corpus edit wearing a formatting item's name.

## What autonomy costs, stated so the signature is informed

The five items above name an anchor and the properties the result must have. `writer` writes the
sentences and `editor` CLEAN reads them. **That is a trade rather than a free improvement**, and the
user signs the trade rather than discovering it at the next `editor` pass.

**What is given up.** The user cannot read the exact bytes at sign-off. `writer` may satisfy an
invariant with a sentence `coach` would not have written, and that is the mechanism working rather
than a side effect. What the signature covers is what must become true.

**What is bought.** The two roles positioned to catch a defect now have standing to fix one.
Every finding this review is correcting reached the tree because correctness was defined as
faithful reproduction: `writer` reproduced five defective sentences exactly as asked, and `editor`
found several and could not touch them. Under these items, `editor` CLEAN is where such a defect
gets caught, which is before the merge rather than after the signature.

**`coach` REVIEW checks each sentence against its item's properties, and does not object on
taste.** A sentence satisfying every property stands even where `coach` would have phrased it
differently. Anything else would re-dictate at review time and give back what this revision buys.

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

**What cannot move, and why saying so matters.** `npm run agent-doc-check` is untouched by every
item above: none reaches an `npm run` reference, agent frontmatter, a retired role or a declared
role cycle. `npm run test:scripts` cannot move either — no item reaches `scripts/`. Item 14 changes
whitespace only.

**`npm run reference-check` is the one gate with any reach here, and that is a gain of this
revision.** Items 11, 12 and 13 leave `writer` writing sentences, and a sentence can name a file.
Every item that could is bounded — item 13 forbids adding or removing a token outright, and item 11
forbids the one citation R14 ruled out — and the gate catches an unresolvable token if one arrives.
Run it after the pass rather than reasoning about it.

**Everything else here is guarded by reading, not by a gate**, exactly as the spec said of the
slice. That is why the stopping condition below is worded to be read rather than run.

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
5. Both `SKILL.meta.md` paragraphs read as records. Every sentence in them is scoped to 2026-09-20
   or points at the section recording the 2026-09-22 replacement, and neither paragraph gained a
   justification for the basename guard.
6. Item 14's paragraph carries the same words in the same order as before, readable off
   `git diff --word-diff` for that file.

**Properties 5 and 6 replaced a sixth that this revision retired.** The draft's version read that
items 12 to 14 added no sentence outside the amendment's verbatim blocks, and those blocks no
longer exist. The other four properties were already invariants checkable by reading, and they
carry across untouched — which is the clearest evidence that stating properties rather than bytes
loses nothing a reader needed.

### Falsifier

**If executing any item above requires adding a new claim about the hook, the classifier or the
gate — rather than dating, narrowing, re-tensing or re-wrapping text this slice already wrote —
then the defect is in item 6's design rather than in its prose.** In that case stop, do not write a
third amendment, and re-open R7 and R8 with the user. The observation to watch for is `writer`
reporting that a dated sentence leaves the basename guard unjustified: R15 rules that three live
passages already carry it, and a report to the contrary means that ruling is wrong rather than the
wording.

### Fallback

**Amendment 2 is the last round on this slice.** There is no amendment 3.

**`editor` CLEAN finding a defect in `writer`'s sentences is not the trigger — it is the loop
working.** `writer` fixes it under the item's own properties, which already authorize the edit.
This revision is what made that possible: a verbatim block was the thing neither role could
correct, and no item above supplies one.

**The trigger is a finding that a property above is itself wrong or unsatisfiable.** Then stop. The
seat does not hire `coach` again. Record the finding in this item's `retro.md`, beside P1 and P2,
close the cycle, and send it to `backlog/ideas/` as a candidate. A fourth round on five sentences
costs more attention than the sentences are worth, and the first recommendation below is the
durable fix for the class rather than for these instances.

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
  the signature, when the text is immutable without an amendment. This slice is the measured
  instance — two amendments, five corrective items, zero role divergences.

  **The near-term half is already applied and needs no item: this amendment states properties
  rather than bytes**, on the user's 2026-09-22 ruling. The durable question is what binds the next
  spec. Three candidates to weigh in that item's own spec: a `coach.md` obligation to justify each
  verbatim block against the load-bearing test its own file already states; an `editor` pass over a
  spec's remaining verbatim blocks before sign-off; and a `pipelines.md` clause making a spec's
  properties, not its bytes, what the signature covers. **Weigh the cost honestly** — verbatim is
  the right register where wording genuinely is load-bearing, and a rule that forbids it outright
  would be the opposite error.

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

**What the signature now covers is each item's properties, not a sentence.** Items 10 to 14 name an
anchor and what must become true at it. `writer` writes the prose and `editor` CLEAN reads it, per
"What autonomy costs" above. Signing this file authorizes that, and the bytes that land will not be
bytes the user read here.

**The ruling most worth overturning is R13's second half** — item 10's property 2, which drops the
roster-closing "only" rather than repairing it. Repairing it keeps a stronger sentence for one
word; the cost is a third unchecked universal in a file that has carried two. Overturning it
changes property 2 alone and leaves the other four items untouched.

Nothing below this line changes without a further amendment `coach` authors and the user signs
again. Per the fallback above, `coach` does not expect to author one.
