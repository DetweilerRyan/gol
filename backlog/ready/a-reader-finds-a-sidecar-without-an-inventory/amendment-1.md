# Amendment 1: a-reader-finds-a-sidecar-without-an-inventory

Written by `coach`, REVIEW mode, 2026-09-21. Rewritten the same day, before signature, on two user
rulings. Measured on the slice worktree at `1a868b3`.

**Fourteen items, A1 to A14, in eleven files.** A1 to A8 repair what the review found. A9 to A14
execute the corpus-wide residue the user granted into this slice, overriding the proposal's
"No corpus-wide sweep" No-go.

**This file states intent and constraints, not replacement bytes.** That is the second ruling, and
A8 is why: spec item 8b dictated bytes that carried a Vale finding, `writer` could not deviate from
them, and `editor` could not repair them because they were spec-supplied. Three passes went on one
word. So each item below gives the anchor, what the sentence must say, what it must not say, and
the reading it must land inside. **`writer` chooses the wording. `editor` may repair register in
it, because none of it is spec-supplied text.**

**Where a specific string is kept verbatim, the item says why.** A token a gate matches, a name a
citation resolves, a date a ruling carries, or a phrase another file quotes — those stay exact. The
clause in `coach.md` about verbatim wording is not cancelled; it is scoped to strings that carry
load.

**What this supersedes.** A1 and A3 supersede two paragraphs of spec item 1's inserted text. A2
supersedes spec item 3h in part. A6 supersedes spec item 6's "Out of scope in this file" clause. A8
supersedes spec item 8's closing "change nothing else" instruction. A9 to A14 supersede the
proposal's No-go on a corpus-wide sweep and the spec's Cross-pipeline recommendation 1, which
becomes work in this slice rather than a candidate. Every other spec item stands. The live
instruction set is `spec.md` plus this file, read in that order.

## How to check an item that states intent rather than bytes

A supplied-text item is checked by diffing supplied against landed. These items cannot be. Each one
therefore names its own check, and three obligations apply to all fourteen.

- **Check the anchor, not the wording.** Every anchor below was verified to exist verbatim at
  `1a868b3`. `CLAUDE.meta.md`, `doc-comments.md` and `prose.md` are hard-wrapped, so an anchor
  quoted on one line here spans two lines there.
- **Check the must-say and must-not-say lists.** They are the item's content. A landed sentence that
  satisfies both is executed, whatever its wording.
- **Check the reading.** Every item names what its file must report afterwards. A reading outside
  that range is the finding, and it is `writer`'s to clear by rewording rather than to report.

---

# Part 1 — the eight review findings

## A1 — `CLAUDE.md`: narrow the checker prohibition to the roster

**Supersedes** spec item 1's seventh inserted paragraph.

**Anchor.** The paragraph beginning `**A checker over this rule is a closed decision, ruled
2026-09-21.**`

**The divergence.** The spec's own Cross-pipeline recommendation 2 closes a checker over the
**roster** and recommends a spike on the **placement rule**. The landed paragraph says "a checker
over **this rule**", where "this rule" is the placement rule the section states. Its justification
is the roster argument and its closing clause is about a list, so the subject reaches past both its
own argument and the ruling it cites. A reader who follows it refuses the spike this slice asks for.

**It must say** that a checker over **which files have a sidecar** is closed, that the set is
derivable from the tree so a gate would guard a hand-written copy, and that nobody is to re-propose
one or add a list of instances here.

**It must not say** anything that reads as closing a checker over the **placement** rule, and it
must not state that the placement question is open. Naming it open plants a claim that rots the day
the spike lands. The narrowed subject is the whole fix.

**Verbatim:** the date `2026-09-21`. It is the ruling's date and `prose.md`'s exempt class 2 turns
on a closed decision being dated.

**Check.** The paragraph's subject names a list of files, not a rule. `vale CLAUDE.md` reports
nothing inside the sidecar section.

## A2 — `CLAUDE.md`: branch 5 no longer answers where a sidecar sits

**Supersedes** spec item 3h in part — its instruction to keep the topic-and-register paragraph
byte-identical. The second paragraph item 3h names, beginning `They do **not** answer how prose is
split`, stays byte-identical as the spec ruled.

**Anchor.** The sentence following `**These branches route by topic, and explicitly not by
register.**`, in branch 5.

**The divergence.** Item 3h kept the paragraph because `prose.md` cites it. Item 8b then repaired
that very citation, so `prose.md` now attributes the placement question to the sidecar section and
the branches together. The kept sentence still claims the branches answer where a sidecar file
sits, which this slice made false. The ground for the keep dissolved inside the same spec.

**It must say** that the branches answer which article a subject belongs to, and that the sidecar
section above answers where the sidecar file sits.

**It must not** attribute the placement question to the branches, and must not delete the
topic-not-register ruling in the bolded lead, which is untouched.

**Check.** Read the landed sentence beside `prose.md`'s "Which article a subject belongs to, and
where a sidecar file sits, are CLAUDE.md's questions" line as A8 leaves it. The two must divide the
same question the same way. `vale CLAUDE.md` reports nothing on the line.

## A3 — `CLAUDE.md`: the Vale claim is wider than its mechanism

**Supersedes** spec item 1's fourth inserted paragraph.

**Anchor.** The paragraph beginning `**The mechanics are the same for every `*.meta.md`.**`, and
within it the sentence about Vale alone. The `reference-check` and contents sentences stay.

**The divergence.** The section opens "Any instruction file in this repo may take a sidecar", then
asserts the mechanics are the same for every `*.meta.md`. **The exemption half is universal** —
`.vale.ini`'s `[**/*.meta.md]` section reaches everything. **The lint half is not.** The register
sections are `.claude/agents/**/*.md`, `.claude/skills/**/*.md`, `.claude/references/**/*.md`,
`CLAUDE.md`, `src/**/*.md` and `backlog/**/*.md`. An instruction file at `adr/`, `README.md`,
`.claude/output-styles/`, `perf/` or `scripts/**/*.md` has an **unlinted** instruction half.

**Verified: no live instance is unlinted today**, which makes this a claim defect rather than a
visible break. All 24 tracked `*.meta.md` files have their instruction half inside a register
section, except `scripts/board-shape-hook/board-shape.meta.md`, whose instruction half is a JSDoc
hover that `[*.{ts,tsx}]` reaches under the `JsDoc` style. The predecessor text enumerated tiers,
every one of them scoped; generalising the enumeration broke the universal. The reader this harms
is whoever puts the next sidecar beside a file outside those globs and assumes the pair is linted.

**It must say** that Vale exempts the sidecar unconditionally, and that it lints the instruction
half only where `.vale.ini` scopes that file's tier.

**It must not** assert the lint half universally, must not enumerate the six sections here, and
must not grow past one sentence. The paragraph stays four sentences.

**Verbatim:** the token `.vale.ini`. It is where a reader checks, `reference-check` resolves it, and
`CLAUDE.md` already carries it in the mode-file paragraph.

**This item does not depend on the configuration gap being closed.** The seat reports that
`architect`'s `.vale.ini` register-section work was not selected. A3 is written to be true of the
config **as it stands**, so nothing here goes stale if that work never happens. It states a
precondition — `prose.md`'s exempt class 1 — rather than describing a config somebody is about to
change.

**Check.** The sentence names a condition on the lint half and no condition on the exemption half.
`vale CLAUDE.md` reports nothing inside the sidecar section, and `npm run reference-check` passes.

## A4 — `CLAUDE.meta.md`: date-close the 2026-09-10 record's prediction

**Supersedes nothing.** Spec item 6 did not reach this passage.

**Anchor.** Under the heading `## Routing branches answer topic, never register — ruled
2026-09-10`, the bullet beginning `- **Where a sidecar physically sits** stayed.`

**The divergence.** The record states the test the ruling used — a branch stays when it answers
which file, and goes when it answers which half of a pair — and then that where a sidecar sits
stayed. This slice moved exactly that rule out of the branches. The heading is dated, so the record
does not rot in the claim-discipline sense, but the test reads live and now mispredicts the corpus.
**The reader it misleads is the next person moving a routing branch**, which is the only reader this
file has. The slice falsified the prediction, so the repair belongs to the cycle that made it.

**Append to that bullet.** It must say that this slice moved the placement rule out of the branches
into `CLAUDE.md`'s sidecar section on its date, and that the which-file test above no longer
predicts where that rule lives.

**It must not** edit the test sentence itself, or any other sentence under the dated heading.
Rewriting a record to match a later tree is the failure the convention exists to prevent. The
record gains its closing date instead.

**Verbatim:** the slice name `a-reader-finds-a-sidecar-without-an-inventory` and the date
`2026-09-21`. `claim-discipline.md` requires a record to name its slice rather than say "this
slice", and both spellings of the name resolve under `git tag -l 'slice/*'`.

**Check.** The test sentence is unchanged, and the bullet now ends with a dated past-tense sentence
naming the slice. `vale` on this file reports 0 — `[**/*.meta.md]` exempts it, so a non-zero
reading means the exemption broke and the config is the thing to read.

## A5 — `doc-comments.md`: a false claim about branch 5

**Supersedes nothing.** This extends spec item 7's reach by one sentence. **Granted by the user.**

**Anchor.** The sentence beginning `**Which half a fact goes in is branch 5's test, one tier down`.

**Pre-existing, and named as such.** The sentence was falsified on 2026-09-10, before this slice.
What made it visible is that `editor` CLEAN repaired its sibling 38 lines earlier in the same file,
so two parallel citations of one moved rule now disagree.

**The finding.** Branch 5 carries no act-on test. `CLAUDE.meta.md`'s 2026-09-10 record lists "does
this constrain an action" among what **left** branch 5 for `prose.md`. `doc-comments.md` is read on
a trigger, before writing or moving a comment block, so a reader sent to branch 5 for a test that
is not there finds nothing and guesses.

**It must say** that the which-half test is `prose.md`'s, and keep the rest of the sentence's work:
the one-tier-down framing and the act-on question.

**It must not** grow the sentence. `vale` on this file reads 0 and must stay 0, so the replacement
is at most as long as what it replaces.

**Verbatim:** the destination `prose.md`. It is the correct referent and `reference-check` resolves
it.

**Check.** `vale .claude/agents/articles/doc-comments.md` reports **0**. The sentence names
`prose.md` rather than a branch number.

## A6 — `CLAUDE.meta.md`: the last branch-numbered heading

**Supersedes** spec item 6's "Out of scope in this file" clause. **Granted by the user.**

**Anchor.** The heading `### Branch 5's roughly-1 KB floor`.

**Why the ground for the spec's ruling moved.** The spec kept it as pre-existing looseness with a
sibling. `editor` CLEAN then renamed the sibling — `### Branch 5's pair-consistency audit` became
`### The pair-consistency audit` — so this is now the only branch-numbered heading in the file. The
same file's body lists "the ~1 KB floor" among what moved **out** of branch 5, so the heading and
the body contradict each other with nothing between them.

**It must say** what the section holds, without attributing the rule to a routing branch.

**It must** keep the searchable phrase `roughly-1 KB` or `1 KB`. **Verbatim** to that extent: a
reader arrives here by searching the figure, and `prose.md`'s "below roughly 1 KB of genuine
evidence" is the rule this evidence sits behind.

**Verified: no inbound citation names the heading.** `prose.md` cites the file — "`CLAUDE.meta.md`
carries the census of which files cleared that floor" — never the heading text. Measured across
every tracked `.md` outside `backlog/` and the worktrees.

**Check.** No heading in the file names a branch number. The figure is still greppable.

## A7 — `CLAUDE.md`: a stranded direction word

**Supersedes nothing. Granted by the user. Pre-existing** — this slice replaced one token on the
line and did not put the error there.

**Anchor.** In the `prose.md` bullet of the topic-article list, the clause `which the routing
branches above deliberately do not carry`.

**The finding.** The routing branches are in "Where new documentation goes", which is **below** that
bullet. A reader who looks up finds no branches.

**It must say** that the branches are below, or drop the direction word entirely. Either satisfies
the item; dropping it is the more durable answer, since a later reordering cannot falsify it.

**It must not** change anything else in the bullet, which is long and carries several other claims.

**Check.** The clause names no false direction. The line carries no Vale finding before or after.

## A8 — `prose.md`: clear the finding item 8b introduced

**Supersedes** spec item 8's closing instruction, `Change nothing else in `prose.md`.`

**Anchor.** The sentence beginning `**Which article a subject belongs to, and where a sidecar file
physically sits, are CLAUDE.md's questions**`.

**The divergence.** Item 8b's mandated clause pushed a 23-word sentence to 26, three past the
`STE.SentenceLength` cap. The spec's check table predicted 5 findings and the file reads 6. **The
sixth is the spec's, not `writer`'s** — `writer` made exactly the mandated change. `prose.md`'s own
rule for that finding is "act on every finding", so leaving it makes the article carry the one
defect it tells every reader to clear. **This item is the reason the rest of this file states intent
rather than bytes.**

**`editor` CLEAN was right to decline and wrong about the available fix.** It ruled no edit because
every **split** re-registers a subordinate appositive as a standalone claim, which is that file's
own damage shape 3. The available fix is a **deletion**, so that reasoning does not reach it.

**It must** bring the sentence to 25 words or fewer while keeping both questions it routes and the
destination it names.

**It must not** split the sentence. Measured: deleting the word `physically` clears the finding on
its own, and at an in-scope path the sentence without it reports nothing while the sentence as
landed reports its own 26-word finding. `writer` may take that deletion or any other wording inside
the cap.

**Check.** `vale .claude/agents/articles/prose.md` reports **5** — the spec's predicted reading —
and no finding on this sentence.

---

# Part 2 — the corpus-wide residue, ruled

The user granted this into the slice: _"i recommend strongly to cleanup the corpus-wide residue
within this slice. if i had been presented with these sidecar references before approving the
proposal i'd have included them."_ That overrides the proposal's No-go. This part is ruled scope.

## What the residue actually is — re-derived at `1a868b3`

**The eighty-mention figure is real and it is not eighty instances of one shape.** Measured over
every tracked `.md` outside `backlog/` and the worktrees:

| Where                        | Named `*.meta.md` mentions |
| ---------------------------- | -------------------------- |
| Instruction files (13 files) | **96**                     |
| Sidecars (14 files)          | 31                         |

Of the 96, **63 are an instruction file naming its own sidecar**, across nine articles —
`acceptance-mutation` 9, `ast-grep-rules` 1, `doc-comments` 8, `engineering` 4, `mutation-testing`
8, `prose` 8, `quality-tooling` 9, `state-flow` 7, `testing-layers` 9. That is the shape
`prose.md` prohibits on sight. **It is four shapes wearing one prohibition**, and that is the
finding that shapes this part.

## The ruling — which shapes go and which stay

**GO. The header self-pointer, eight instances in eight files.** Each of the eight articles with a
sidecar opens with a blockquote naming it, listing what it holds, and stating the read trigger.
`prose.md` prohibits two things here at once: a pointer to a file's own sidecar, and a restatement
of a section it cites. The trigger is now stated **once**, in `CLAUDE.md`'s sidecar section — "Read
one when you are changing the rule it stands behind, never in order to follow one" — so eight
per-file copies of it are the drift the section was built to end. The contents list is worse: it is
a census of another file's state, which `claim-discipline.md` bans and which the sidecar's own first
line already carries. `engineering.md` has no such blockquote and needs no edit.

**STAY. The in-place evidence citation, 55 instances.** Thirty-five are
`<!-- Closed decision: … are in `X.meta.md`. -->` comments; the rest are body prose of the same
shape. Each routes **named** content at the point the rule is stated. The filename is part of a
citation, not a read trigger. Deleting it orphans the description, and deleting both loses the
routing. `prose.md`'s exempt class 2 (a closed decision) and class 4 (a dated record a live claim
rests on) cover them, and the new sidecar section's rule does not reach them.

**STAY. The cross-file pointer.** `claim-discipline.md` naming `engineering.meta.md` is **mandated**
by this slice's own text: "A file whose evidence sits in another file's sidecar says so in its own
header."

**STAY. Generic placeholders and the module `@see` form.** A placeholder names no instance.
`prose.md` carves out the module `@see` pointer explicitly, because that reader is changing the
module.

**STAY. All 31 mentions inside a sidecar.** The prohibition binds instruction files. A sidecar is
not one.

**STAY, and this one is a ruling rather than a deferral: the pair-consistency measurement keeps its
home.** `editor` CLEAN asked whether it belongs in `prose.meta.md` now that the rule is
`prose.md`'s. `CLAUDE.md`'s own tie-break answers it — subject wins. The measurement's subject is
the 2026-09-10 routing ruling, which is `CLAUDE.meta.md`'s. It stays, and no file is added to the
set for it.

## Cost, stated before the items

**Eleven distinct files across the whole amendment**, and the residue adds seven of them. A1 to A8
touch `CLAUDE.md`, `CLAUDE.meta.md`, `doc-comments.md`, `prose.md`. A9 to A14 add
`acceptance-mutation.md`, `ast-grep-rules.md`, `mutation-testing.md`, `quality-tooling.md`,
`state-flow.md`, `testing-layers.md`, `ast-grep-rules.meta.md`.

**Two `writer` passes, and the split is not arbitrary.** A9's eight edits are one judgement applied
eight times, so they belong together and reviewing them together is what catches an outlier. A1 to
A8 are eight distinct judgements in four files. `editor` CLEAN runs after each pass, per
`pipelines.md`.

**What re-runs.** `npm run agent-doc-check` and `npm run reference-check`, both whole-tree and both
seconds. `vale` per edited file. `npm run prose-lint` once. **No `src/` gate moves** — the diff
reaches no file any of them read.

**This is larger than the spec, and it is not larger than one amendment can carry.** A9 is
mechanical after its ruling; A10 to A14 are one edit each. I am not proposing to stage it. **The
one thing I would stage if the cost reads too high is A9**, which is separable from every other
item and is the only item touching more than two files.

## A9 — eight articles: delete the header self-pointer

**Supersedes** the spec's Cross-pipeline recommendation 1 in part, which named this shape as a
candidate.

**Anchor, per file.** The header blockquote naming that article's own sidecar:
`acceptance-mutation.md`, `ast-grep-rules.md`, `doc-comments.md`, `mutation-testing.md`,
`prose.md`, `quality-tooling.md`, `state-flow.md`, `testing-layers.md`.

**Delete, in each:** the sentence naming the article's own sidecar, and the clause listing what that
sidecar holds.

**Keep, in each: every instruction the blockquote carries that is not the pointer or the census.**
This is the item's whole risk and it is per file. Three carry such content, verified:

- **`ast-grep-rules.md`** — "It also holds the two rules documented outside the main enumeration"
  is a fact a reader looking for every rule needs. "Narrowing or widening a rule **is** changing
  one" disambiguates the trigger. Both stay, re-homed in the article's own text.
- **`doc-comments.md`** — "Every rule here is actionable without it" tells a reader they need not
  open the sidecar. It stays.
- **`prose.md`** — the blockquote's **first** paragraph is a two-questions routing statement, not a
  self-pointer, and stays untouched. Only the second paragraph is in scope, and its
  "**Do not fold a reason back into this** …" instruction stays.

**It must not** delete a blockquote wholesale in any of the three above, and must not delete any
`<!-- Closed decision: … -->` comment or body-prose evidence citation anywhere. Those are ruled
STAY.

**After each deletion, re-read the sentences that survived around it** for a `the`, `that`, `those`
or `it` whose referent left. `prose.md`'s own damage shape names this as the one part of a pass a
tool cannot do.

**Check.** Per file: `grep -c '<basename>\.meta\.md'` falls by exactly the number of tokens the
blockquote carried, and no other count in the file moves. `vale` on each file reports no more than
its pre-edit reading — a deletion cannot add a finding, so an increase means a paragraph was
re-split. `npm run reference-check` passes with a lower reference total.

## A10 — `prose.md`: narrow the prohibition to the shape it means

**Supersedes nothing.** Without this item A9 is unrepeatable, and the next article to earn a sidecar
grows a ninth blockquote.

**Anchor.** In "What an instruction file may not carry", the bullet beginning `- **A pointer to its
own `.meta.md` sidecar.**`

**The finding.** Read literally the bullet prohibits all 63 self-pointers, including the 55 this
amendment rules STAY. A prohibition that the corpus violates 55 times is not a rule anybody can
follow, and its literal reading is what made the residue look like eighty deletions.

**It must say** that what is prohibited is a pointer offered as a **read trigger** or as a census of
the sidecar's contents, and that a citation routing **named** evidence at the point a rule is
stated is not that. It must keep the existing carve-out for the module `@see` pointer.

**It must not** grow into an account of the residue, and must not list instances. The bullet is one
of four in a list `Instruction.ListItemSentences` guards — off for articles today, so the constraint
is `STE` alone.

**Check.** `vale .claude/agents/articles/prose.md` stays at A8's reading of 5. Read the landed
bullet against three landed cases: an `<!-- Closed decision: … -->` comment must be permitted, a
header blockquote of the kind A9 deletes must be prohibited, and a module `@see` must be permitted.

## A11 — `ast-grep-rules.meta.md`: a false claim about branch 5

**Supersedes nothing.** Named in the review as residue subject F2.

**Anchor.** The sentence beginning `**Why the per-rule arguments belong here rather than in the
article.**`, and within it the clause attributing a question to `CLAUDE.md`'s routing branch 5.

**The finding.** Branch 5 asks no such thing. The constrains-an-action question is `prose.md`'s
three dispositions, and `CLAUDE.meta.md` records it as having left branch 5 on 2026-09-10. Same
class as A5, one tier down.

**It must say** that the constrains-an-action question is `prose.md`'s, and keep the argument that
follows it, which is sound and unaffected: a rule's scope argument is read when narrowing or
widening the rule, which is changing it.

**It must not** change the argument or the paragraph's conclusion.

**Check.** The sentence names `prose.md` rather than a branch number. `vale` on this file reports 0
by exemption.

## A12 — `CLAUDE.md`: one shape for both tiers in the doc map

**Supersedes nothing.** Named in the review as F7, and predicted by the spec.

**Anchor.** The four bullets of the `.claude/references/` tier, each carrying a clause of the form
`Its sidecar carries …`.

**The finding.** Spec items 2b to 2j deleted the equivalent clause from every article bullet, so the
map now tells a reader what one tier's sidecars hold and nothing about the other's. The spec left
the reference bullets alone because they name no filename, and named the resulting asymmetry in its
own recommendation. **Both clauses are the same shape: a census of another file's contents.** A9
deletes that census from eight article headers on the same ground, so leaving it in the map
contradicts A9 within one slice.

**Delete the `Its sidecar carries …` clause from each of the four bullets.** Everything else in each
bullet — the contents of the reference file itself, the audience sentence, the read trigger —
stays.

**It must not** touch the tier's lead paragraph, which spec item 2k already edited, and must not add
a replacement clause. The sidecar section states that any instruction file may take a sidecar, which
is what a map reader needs.

**Check.** No bullet in the Documentation map claims what a sidecar holds, in either tier.
`vale CLAUDE.md` reports no more than 18 findings, and none new on those four lines.

## A13 — `CLAUDE.meta.md`: restore the tie-break's worked precedent

**Supersedes nothing.** Named in the review as F9.

**Anchor.** The `## Documentation map` section, as a new subsection beside the existing ones.

**The finding.** Spec item 3k removed `src/scrollbars.meta.md` under `architecture.md`'s provenance
rule as the tie-break's live precedent, and it landed nowhere. `prose.md` names that exact shape:
"The failure mode is dropping an illustration entirely rather than moving it across." The spec ruled
the **name** out of `CLAUDE.md` under ruling G, and rulings A, E and G do not reach the sidecar.
The rule the precedent illustrates — subject wins — is still in `CLAUDE.md` with nothing worked.

**It must say** that `src/scrollbars.meta.md` under `architecture.md`'s provenance rule is the case
the subject-wins tie-break was ruled on: a measurement about one module went beside that module
even though it was also evidence behind an article's rule.

**It must not** restate the tie-break rule, which stays in `CLAUDE.md`, and must not become an
inventory of module sidecars.

**Verbatim:** `src/scrollbars.meta.md` and `architecture.md`. They are the precedent's identity and
`reference-check` resolves both.

**Check.** The subsection names one case and states no rule. `vale` on this file reports 0 by
exemption.

## A14 — `prose.md`: disambiguate `sidecar section`

**Supersedes nothing.** Named in the review as CLEAN's finding F.

**Anchor.** In "Enabling, disabling or re-levelling a rule", the sentence beginning `**Whenever you
enable a rule, switch it off in the sidecar section in the same edit.**`

**The finding.** After items 8a and 8b, `sidecar section` names two different things in one file:
`CLAUDE.md`'s new section, twice, and `.vale.ini`'s `[**/*.meta.md]` section here. Context
disambiguates both, so this is cheap insurance rather than a defect — and the collision bites
whoever greps.

**It must say** which config the section is in, so the phrase is unambiguous at the point of use.

**It must not** change the instruction, its pairing rule, or anything else in the paragraph.

**Verbatim:** the token `.vale.ini`, which is the disambiguator and resolves.

**Check.** Every occurrence of `sidecar section` in the file either names `CLAUDE.md` or names
`.vale.ini`. `vale .claude/agents/articles/prose.md` stays at 5.

---

# Method `writer` owes on this amendment

- **Anchor every edit in the target file's own text**, never by line number. Prettier owns
  blank-line placement.
- **Choose your own wording inside each item's constraints, then measure.** A reading outside the
  named range is yours to clear by rewording, not to report. Report a point only when no wording
  satisfies the constraints.
- **Take each edited file's token frequency before its first edit and diff the set after.** Include
  the causal connectives `because`, `since` and `so`. Diff `CLAUDE.md` and `CLAUDE.meta.md` as a
  pair, since A4, A6 and A13 move content between them.
- **After every deletion, re-read the surviving sentences around it** for a stranded referent. A9
  and A12 are deletions in eleven places between them.
- **Count top-level list items and indented continuations** in `CLAUDE.md`'s routing test and
  Documentation map before and after. A2, A3, A7 and A12 all edit inside lists, and `format:check`
  stays green over a broken one.
- **Run `npm run format` before reporting**, and report the item numbers executed plus any point
  returned.

# Check readings, before and after

| Command                                        | Before (`1a868b3`)    | After                             | A different reading means                                       |
| ---------------------------------------------- | --------------------- | --------------------------------- | --------------------------------------------------------------- |
| `npm run agent-doc-check`                      | pass                  | pass, same counts                 | an edit moved an `npm run` reference or a role-cycle string     |
| `npm run reference-check`                      | 3230 references, pass | pass, **fewer** references        | a citation stopped resolving — read the failure, not the total  |
| `npm run prose-lint`                           | 584 tracked files     | 584 tracked files                 | a file was added or removed; this amendment adds none           |
| `vale CLAUDE.md`                               | 18 warnings in 1 file | **18 or fewer**, 0 in the section | A1, A2, A3 or A12 re-split a paragraph                          |
| `vale .claude/agents/articles/prose.md`        | 6 warnings in 1 file  | **5**                             | A8 did not clear its sentence, or A10/A14 added a finding       |
| `vale .claude/agents/articles/doc-comments.md` | 0 warnings in 1 file  | **0**                             | A5 or A9 grew a sentence past a cap                             |
| `vale .claude/agents/articles/CLAUDE.meta.md`  | 0 warnings in 1 file  | **0**                             | the `[**/*.meta.md]` exemption broke — read the config first    |
| `vale` on each other A9 file                   | its own pre-edit read | **no higher**                     | a deletion re-split a paragraph, which a deletion should not do |

**The reference total falls, and the size of the fall is not the check.** A9 removes eight named
tokens and A12 four unnamed clauses, while A3, A5, A11, A13 and A14 each add a resolving token.
**Read the pass.** A fall to zero failures is the reading; the total is not.

**Take each A9 file's pre-edit Vale reading before its first edit.** Eight of the nine articles are
untriaged surfaces with their own backlogs, so "no higher" needs a baseline measured on the pre-edit
file, not recalled. `prose.md`'s damage shape 7 is the reason.

# What would falsify this amendment

Report these rather than working around them.

- **An A9 blockquote carries an instruction this file did not name.** Three were verified to carry
  one. A fourth means the survey missed a class, and the item needs re-ruling rather than a
  judgement call in the moment.
- **A10's narrowed bullet cannot permit the `<!-- Closed decision: … -->` shape without naming it.**
  Then the two shapes are not separable by a rule, and the 55 STAY instances need their own ruling.
- **A2's replacement cannot be read without opening the sidecar section.** Then spec ruling 1's cut
  is wrong, and the branch needs its own answer rather than a pointer.
- **A3's condition sends a reader to a config they cannot act on.** Then the fix is the
  configuration rather than the prose, and A3 should be declined.
- **No wording satisfies an item's must-say and must-not-say inside its reading.** Return the item.
  `writer` does not amend an amendment, and that is the failure mode A8 records.
