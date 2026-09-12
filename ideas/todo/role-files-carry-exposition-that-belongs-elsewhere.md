---
name: role-files-carry-exposition-that-belongs-elsewhere
title: Strip the role files to instruction and route every explanation out of them
created: 2026-09-11
---

## Situation

**Ruled by the user on 2026-09-11, and this entry treats it as fact rather than as a hypothesis to
test.** The five role files carry too much exposition, explanation and reasoning. A role file should
be a set of instructions. Anything that is not an instruction belongs somewhere else.

The ruling stands whether or not a measurement agrees with it. A prior spike
(`spike-vale-rules-that-compress-the-agent-files`) reported that no available Vale rule compresses
these files and recorded zero enablements. **That result does not refute this ruling — it answers a
different question**, and the difference is the reason this entry exists.

## Complication

**The prior spike asked "which off-the-shelf rules make these sentences shorter". The real question is
"what kind of content does not belong in this file at all".** Those come apart completely:

- Vale rules measure sentence mechanics — length, voice, gerunds, modals. Every one of them scores a
  sentence that is already in the file.
- The defect is **whole paragraphs of correct, well-argued reasoning sitting in a file whose job is to
  say what to do.** A rule that shortens each of those sentences by two words leaves the paragraph
  there.

The spike's own ENABLE bar makes this concrete: it required a 2 percent word reduction. A problem
measured in paragraphs cannot clear a bar denominated in that way, so the bar guaranteed the answer.

**Measured on `coder.md`, 1,857 words, 2026-09-11.** Of 18 prose paragraphs, **6 run to five or more
sentences**, and the largest are a 24-sentence numbered procedure with justification woven into each
step, a 13-sentence block, and a 12-sentence block. Representative content, quoted rather than
characterised:

- "The orchestrating session has made exactly that mistake, repeatedly, and no coder caught it. An
  explicit instruction felt more authoritative than this file. It is not." — three sentences of
  narrative supporting an instruction that is one clause.
- "Making a step-7 finding disappear by loosening the rule that produced it disarms the check for
  everyone afterward. It does so invisibly, since a dead rule and a satisfied rule look identical." —
  true, well put, and an argument **for** an instruction rather than an instruction.

**The reasoning is good, and that is why it accumulated.** Nobody added a bad paragraph. Each one
defends a rule someone got wrong once. The question is not whether it is correct; it is whether the
file a role reads before acting is where it belongs.

## Question

What is left when every sentence that is not an instruction leaves the role files, and where does each
kind of departing sentence go?

## What this file is, and what it is not

**It holds twelve rules and the specification for four remaining strips.** Rules 3 to 9 were ruled by
the user on 2026-09-11 while `coder.md` was stripped by hand, and they are recorded here rather than
in `prose-linting.md`.

**That placement is deliberate and it has a known cost: `ideas/` has no gate, no checker, and no role
reads it.** So a role authoring prose before the remaining strips run will not see these rules. The
user chose this on 2026-09-11, with the cost stated. **The rules move to `prose-linting.md` when the
strips that apply them run** — until then, whoever runs a strip reads them here.

## Sketch

**This is a routing and rewriting job, not a linting job.** Take that as the ruling's operative half.

### 1. Classify every paragraph, not every sentence

The unit is the paragraph, because that is the unit the defect lives in. For each, decide: instruction,
or not. An instruction tells a role what to do, what not to do, or when. Everything else — the
argument for it, the incident that produced it, the measurement that supports it, the mechanism that
makes it true — is exposition.

**Deliberately a coarser cut than `prose-linting.md`'s sentence-level split.** That article's
instruction-versus-explanation rule is the right idea at the wrong granularity for this job.

### 2. Route what leaves, and do not delete it

Four destinations, and CLAUDE.md's branches already name three:

- **A role's own `.rationale.md` sidecar.** `architect`, `cleaner` and `hardener` have one; `coder` and
  `product` do not and would gain one. This is the default destination and takes the arguments.
- **A shared article**, when the reasoning binds more than one role.
- **A `scripts/` sidecar**, when the explanation is really about a program rather than about a role.
  The user named this destination specifically, and it is the least-used of the four today.
- **Deletion**, where a paragraph defends a rule nobody disputes. Rare, and it needs a reason.

### 3. A role file never points at its own sidecar

**Ruled by the user on 2026-09-11.** A role file carries no reference to its `.rationale.md` sidecar,
and no instruction about when to read one. A role does not change its own file, so the rationale is
not addressed to it. A pointer is unnecessary at best and dangerous at worst: it invites the role to
read material that argues about rules rather than stating them, which is the exposition this whole
entry exists to remove — reintroduced by the very sentence that routed it away.

**The sidecar's audience is whoever is changing the rule**, and that reader arrives from
`CLAUDE.md`'s sidecar index, not from the role file.

**Measured 2026-09-11, and it is not one line.** Across the four role files with a sidecar there are
**21 pointers**: `architect.md` 8, `hardener.md` 7, `cleaner.md` 5, `coder.md` 1. Most take the form
"the worked example is in `<role>.rationale.md`" or "the measurement is in `<role>.rationale.md`" —
a sentence whose whole content is that an argument exists elsewhere.

`coder.md`'s was removed when this was ruled. **The other 20 are follow-up work**, one per role file,
and each strip clears its own.

**The rule widened on the same day it was made, and the wider form is the one that binds.**

### 4. An article never points at its own sidecar either

**Ruled by the user on 2026-09-11, extending rule 3.** Reading an article is for instruction that guides
execution. An agent in a normal pipeline has no reason to read a `.rationale.md` sidecar for an
article, so the article carries no pointer to one.

**Measured 2026-09-11: 64 pointers across nine articles.** `engineering.md` 11;
`acceptance-mutation.md`, `quality-tooling.md` and `testing-layers.md` 9 each; `doc-comments.md` 8;
`mutation-testing.md` and `state-flow.md` 7 each; `prose-linting.md` 3; `ast-grep-rules.md` 1.

**Module sidecars are the one tier that keeps its pointer**, and the distinction is what a reader is
holding. A role or an article sidecar argues about a rule, and the reader is following the rule
rather than changing it. A module sidecar belongs to whoever is **changing that module** — the
reader has the call site in front of them and the pointer is how they reach the reasoning. So
`CLAUDE.md`'s branches 4 and 5 keep the mandated `@see {@link ./<name>.rationale.md}` form.

### 5. Examine every instruction that has an agent updating an article

**Directed by the user on 2026-09-11.** Agents should not be changing articles. Three places instruct
it today and each needs a ruling rather than a presumption:

- `cleaner.md` and `architect.md`, identically worded: a file-list mention made stale by the change
  "is yours to correct in the same pass ... a factual fix only; never edit another role's scope or
  workflow."
- `CLAUDE.md`'s module-map paragraph: `cleaner` and `architect` "are expected to update both that map
  and the article behind it" after a behaviour-preserving split.

**Note what the existing wording already forbids before judging it.** Both are scoped to keeping a
file list accurate, and both explicitly bar editing scope or workflow. So the question is not whether
agents rewrite guidance — they are already told not to. It is whether a factual file-list correction
is a fourth thing an agent may do to an article, or whether even that belongs to the seat that owns
the document. Answer it; do not leave the presumption standing.

### 6. A role file states no fact about another role's file

**Ruled by the user on 2026-09-11, from a live defect.** `coder.md`'s workflow step 5 said the property
project is skipped because "only `architect`, `hardener` and `product` need" it, and its Boundaries said
"property tests belong to `architect`". **Both were false.** `cleaner.md`'s own Owns list says it adds a
property test where a unit test really checks an invariant over a range of inputs.

**The defect is structural, not a typo.** A role file that describes another role's responsibilities is a
second copy of that role's own text, and nothing checks the two agree. `cleaner.md` carries the same
false claim about itself at its step 4, which is how the error survived: the wrong fact was written in
two files and neither reader was the role it was about.

**The rule.** A role file may say _what is not yours_ — that is a routing fact the role needs. It may not
say _whose it is_, _how they do it_, or _what their threshold is_. Three shapes to remove on sight:

- **A threshold owned elsewhere.** `coder.md` quoted `cleaner`'s "roughly 100+ mutants prompts a split"
  and cited `cleaner.md` beside it. A number with a citation is still a copy.
- **A step number in another file.** "the scoped mutation scan in particular is `cleaner`'s workflow step
  3" breaks when that file renumbers, and this slice renumbered `coder.md` 8 → 11.
- **An attribution where a prohibition would do.** "those are `architect`'s" adds nothing to "never edit
  them" except a fact that can rot.

**Prefer the cycle over the name where one is needed at all.** "They belong to later roles in the cycle"
survives a role rename; "`cleaner`, `architect` and `hardener`" does not.

**Four edits made to `coder.md` under this ruling**, with the false ones first: step 5's property claim,
the Boundaries property claim, `cleaner`'s mutant threshold, and the step-3 citation.

### 7. Three kinds of cross-role mention, and only one drifts

**Measured 2026-09-11: 110 mentions of another role across the five role files** — `architect.md` 50,
`product.md` 16, `coder.md` and `hardener.md` 15 each, `cleaner.md` 13. Banning them outright is the
wrong fix, because two of the three kinds cannot rot.

| Kind            | Shape                                                  | Drifts?                                                                                                              |
| --------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Prohibition** | "Do not write `features/*.e2e.spec.ts`"                | **No.** It states a fact about _this_ role. It stays true however the other role changes.                            |
| **Handoff**     | "the orchestrating session can then invoke `cleaner`"  | **No.** Fixed by the cycle, and `agent-doc-check`'s check 4 already pins the cycle string byte-identical everywhere. |
| **Description** | "`cleaner` watches mutant count; 100+ prompts a split" | **Yes.** A second copy of another file's text, and nothing compares them.                                            |

**Only the third kind is the defect**, and rule 6 already forbids it. The property-test error was a
description; a prohibition could not have been wrong, because it asserts nothing about the other role.

**So the first line of defence is the rule, not a checker.** Most of the 110 are prohibitions and
handoffs and should stay.

### 8. How to stop the third kind coming back

**Ruled by the user on 2026-09-11: adopt the first two. The third is too much.**

- **ADOPTED — attribute nothing; say "not yours".** A prohibition needs no owner. "Never edit `rules/*.yml`"
  carries the whole instruction; "those are `architect`'s" adds only a fact that can rot. This costs
  nothing, needs no tooling, and removes most of the surface. Where a name is genuinely needed, prefer
  the cycle position to the name — but see rule 9b: once a role file stops stating the cycle, "later
  roles in the cycle" has nothing to refer to, and "not yours" is the better form.
- **ADOPTED — a single source for anything two files must agree on.** The threshold that drifted — mutant count
  for a split — belongs in one place both roles read, which is an article rather than a role file.
  `engineering.md` already carries the shared-concern rule and says duplicates drift out of sync.
- **DECLINED — a checker on `agent-doc-check`'s check 4 precedent.** The shape exists: check 4 does not
  ban the cycle string from many files, it asserts every copy is byte-identical and fails loudly when it
  finds none at all. **The user declined it on 2026-09-11 as too much machinery**, and the technical
  objection agrees: such a check needs a machine-readable way to tell a description from a prohibition,
  and nobody has shown that is decidable. A checker that cannot make that distinction either passes
  everything or flags every legitimate prohibition.

  **Re-open only with new evidence**, and the evidence would be a drifted description that survived both
  rules above — not an argument that one could.

**Why the two adopted rules are sufficient without the third, stated so the decline is defensible.** Rule
one removes the surface rather than policing it: a prohibition that names no owner has nothing to drift
against. Rule two moves what genuinely must agree into one file both roles read, which is the
single-source fix the repo already applies everywhere else. What remains after both is a description that someone wrote deliberately in the wrong place, and that is a review finding rather than a gate.

**What makes the third kind dangerous is worth stating once.** Neither reader of a drifted description
is the role it describes. `coder` reads a claim about `cleaner` and has no way to check it; `cleaner`
reads its own file and does not see `coder`'s copy. The wrong fact sat in both files and each reader
was the wrong person to catch it.

### 9. A pointer and a restatement are not both needed

**Ruled by the user on 2026-09-11, from `coder.md`'s workflow step 9.** That step cited
"Structural rules (ast-grep)" in `engineering.md` **and then restated it** — the warning-severity
mechanism, the zero-exit caveat, and a four-item list of the rules that fire on ordinary slice work.

**The cited section already forbade exactly that.** `engineering.md` says of the rule list: "A list
restated here would go stale the moment a rule is added." The role file restated one anyway, and the
list was a census of `rules/*.yml` on disk — the construct the same article's census rule says to drop.

**The rule.** Where an instruction cites a section, it says what to do and where to read. It does not
also summarise what the reader will find there. A summary beside a pointer is the worst of both: it
can drift from the source, and it tempts a reader to skip the source that would have corrected it.

**The test is whether the sentence survives the source changing.** "Run `npm run ast-grep` and read its
output" survives a new rule landing. "Expect manual `useMemo` findings plus `&&`-in-JSX in the
composition root" does not.

### 9a. Prefer nested bullets to a packed sentence

**Ruled by the user on 2026-09-11, from `coder.md`'s Owns section.** Three bullets there each carried
two or three distinct instructions in one sentence — layer placement, what covers that layer, and
where the module list lives, all run together.

**Split them into nested bullets under a bolded lead.** One instruction per line. The doc-comments
bullet in the same section was already this shape and is the model.

**Why this is not merely formatting.** A packed sentence hides how many instructions it carries, so a
reader who acts on the first clause can believe the bullet is discharged. Splitting makes the count
visible without adding a word — the Owns restructure cost eight words and turned three bullets into
seven lines.

**It also makes the mechanical guard work.** `Instruction.ListItemSentences` counts sentences per list
item, so a three-instruction bullet reads as one item near the threshold while seven one-line items
read as clean. **Structure the file the way the rule measures it**, or the rule scores prose that is
already correct and misses prose that is not.

#### 9a is a review-time rule. Mechanising it is REFUTED, measured 2026-09-11.

**Do not spend a slice on a Vale rule for this.** Three measurements, in the order they were taken:

- **A max-1-sentence list rule moves the wrong way.** Probed against `coder.md` before and after the
  Owns restructure: **20 findings on the packed original, 22 on the split version.** Splitting a packed
  bullet creates _more_ list items, each still one or two sentences, so the counter rewards the defect
  and penalises the fix.
- **`STE.OneInstruction` reports zero on the packed original.** It matches explicit chaining —
  `and then`, `, then`, `after which`, `while …ing`. The packed bullets chained with full stops
  instead, which is the form that reads as clean.
- **`Instruction.ListItemSentences` cannot see it either**, and this is by construction rather than by
  threshold. A packed bullet is _N instructions in one or two sentences_. The defect lives **below**
  sentence granularity, and every counting rule available measures at or above it.

**The structural reason, stated so nobody re-opens this on a hunch.** A rule that flags packing must
count **instructions**, which means deciding what an instruction is. That is the same wall that refuted
the symmetric instruction-versus-explanation detector during the Vale spike. This repo's rules work
when a defect has a **surface form** — a sentence count, a token, a scope. `HistoricalNarration` works
because narration has vocabulary. **Packing has no surface form: the same words in the same order are
correct as three bullets and wrong as one.**

**What a rule could do instead, and why neither is worth landing.** Flag a list item over N words as a
_candidate_ for splitting — a prompt to look, firing on plenty of correct single-instruction bullets.
Or extend `OneInstruction`'s token list, which only ever catches the chaining form that was already
absent here.

**The compensation, and it is real.** The nested form makes `ListItemSentences` _more_ accurate. Seven
one-line items read as clean, where one three-instruction bullet read as a single item sitting near the
threshold. So the guard you already have improves on a well-structured file even though it cannot
demand the structure.

**Re-open only with new evidence**, and the evidence is a rule that discriminates the two `coder.md`
versions in the right direction — not an argument that one could exist.

### 9b. A role file does not state the cycle order

**Ruled by the user on 2026-09-11.** Every role file opens by naming its position in
`product → coder → cleaner → architect → hardener → product`. No role benefits from knowing the
orchestration order, and it is a driftable surface in five files.

**What a role actually needs is narrower and already stated elsewhere in the file.** That a spec
arrived approved, and who to hand to — both live in the Handoff section. A role never chooses what
runs next; the orchestrating session does.

**The string is not merely irrelevant. It is already false, and the user caught this.** `CLAUDE.md`'s
"The optional architect design pass" says the orchestrating session may invoke `architect` **before
`coder`**, to ratify a file set and an interface, and that it still runs its normal post-`cleaner` slot
afterwards. So `architect` appears twice in some slices and the sequence the string asserts does not
hold. **Both slices in the 2026-09-11 session ran that way.**

**`agent-doc-check`'s check 4 does not catch this, and cannot.** It asserts every copy of the cycle
string is byte-identical and fails when it finds none anywhere. Over a false claim, that guarantees only
that the falsehood is uniform in five files. **A consistency check is not a correctness check**, and
this is the worked example: the one cross-role fact carrying a mechanical guard is also the one that was
wrong.

Read the removal on those grounds. It is not a drift fix — the string could not drift. It is wrong, and
it was never addressed to the reader.

**Check 4 keeps working after all five removals.** The string survives in `CLAUDE.md` twice and in
`handoffs.md` once — files whose audience is the seat that sequences the roles. Verified after
`coder.md`'s removal: `npm run agent-doc-check` exits 0.

**Those three survivors carry the same false sequence, and this entry does not settle that.**
`CLAUDE.md` states both the cycle and the design-pass exception, so a reader there has the correction in
front of them. Whether the string should say what actually happens, or whether check 4 should retire
with it, belongs to the seat that owns the orchestration docs. **Filed so the removal does not read as
having handled it.**

**The other four carry it and each strip removes its own.** Verbatim, so a later reader does not have
to re-find them — all on line 8, and the replacement is to delete the clause between the project name
and the role's own statement of what it does:

| File           | The clause to remove                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `architect.md` | ", the fourth role in the five-role cycle: `product → coder → cleaner → architect → hardener → product`"    |
| `cleaner.md`   | ", the third role in the five-role cycle: `product → coder → cleaner → architect → hardener → product`"     |
| `hardener.md`  | ", the fifth role in the five-role cycle: `product → coder → cleaner → architect → hardener → product`"     |
| `product.md`   | "You open and close the five-role cycle: **`product → coder → cleaner → architect → hardener → product`**." |

**`product.md` is the one that needs judgement rather than deletion.** Opening and closing the cycle in
SPECIFY and VERIFY is a fact about `product`'s own two modes, not about sequence — so the mode
distinction stays and only the chain goes.

**Audit each file for phrases that depended on the line**, the way `coder.md`'s "later roles in the
cycle" did. `architect.md` carries "that is `hardener`'s job, next after you" in the same sentence;
rules 6 and 8 already cover it, and "not yours" is the replacement.

### 9c. One file is the source of truth for execution order

**Ruled by the user on 2026-09-11, extending 9b to the frontmatter.** `CLAUDE.md` is that file: line
301 states the cycle and the section below it states the design-pass exception. Every other statement
of execution order is a copy of half of it.

**The `description:` fields were exempted a paragraph ago and the user overruled that.** The argument
for exempting them was real — that field's reader is the orchestrating session choosing which agent to
invoke, so sequence is what it needs. The argument against is stronger: **it is a driftable surface and
it is probably already wrong**, in the same way the body line was. `architect.md`'s description says
REVIEW is "invoke after the cleaner's pass, once coder and cleaner have both finished", which the
design pass contradicts by construction.

All five carry a sequence claim today:

| File           | The claim in `description:`                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `architect.md` | "invoke after the cleaner's pass, once coder and cleaner have both finished"; "next in the cycle" |
| `cleaner.md`   | "the step between the coder and the architect"                                                    |
| `coder.md`     | "Invoke it after `product` (SPECIFY mode) has produced an approved, committed .feature file"      |
| `hardener.md`  | "after the architect's structural review"; "once the architect has finished and tests are green"  |
| `product.md`   | "at both ends of the cycle"                                                                       |

**The complication, and it is why this is not a plain deletion.** A `description:` has a real job: it
tells the invoking seat _when this agent is the right one_. That is a **trigger**, and a trigger is not
an order. The two are easy to conflate because most triggers here are phrased as sequence.

So rewrite each to state its **precondition** instead of its **position**:

- `coder.md` — "after an approved, committed `.feature` file exists" rather than "after `product`
  (SPECIFY mode) has produced one". Same trigger; no claim about who ran when.
- `hardener.md` — "when a slice is ready for final verification" rather than "after the architect's
  structural review".
- `architect.md`'s REVIEW — "to review landed code once tests are green" rather than "after the
  cleaner's pass".

**A precondition is checkable by the reader; a position is a claim about a sequence the reader may not
be following.** That is the whole distinction, and it survives the design pass, a re-invocation after
an adjudicated fix, and any future reordering.

**Check 4 is now a live question rather than a note.** After 9b and 9c the cycle string survives only in
`CLAUDE.md` (twice) and `handoffs.md` (once). Check 4 fails when it finds none anywhere, so it does not
break — but it will be pinning three copies of a sequence that `CLAUDE.md` itself immediately qualifies.
**Decide whether it should instead assert the cycle string appears in `CLAUDE.md` and nowhere else.**
That is the shape that would enforce this ruling rather than merely tolerate it.

**One consequence to handle in the same edit.** Rule 8 prefers "later roles in the cycle" to naming
roles — and that phrase is unmoored once the file stops stating the cycle. `coder.md`'s became
"They are not yours", which is rule 8's first option and better anyway. **Removing the cycle line
means auditing the file for phrases that depended on it.**

### 9d. No role edits a role file, an article, or `CLAUDE.md`

**Ruled by the user on 2026-09-11. It lives in `CLAUDE.md`'s Conventions, not here** — this section
records the retirements it forced and the collisions to expect.

The law: those files belong to the orchestrating session, which edits them only with the user's
explicit approval **for that edit**. A role that finds one wrong, stale, or contradicted by its own
work reports it and hands off. It holds however small the correction looks and however certain the
role is.

**The user's own framing, and it governs how this gets maintained.** Issues with this law will come
up. **Address them as they arise rather than anticipating them now**, because pre-carving exceptions
is how a line blurs before it has been tested. So this section lists what the law _retired_, and does
not list what it might need to permit.

**Four authorisations contradicted it and were retired in the same edit** — leaving one standing would
have let a role cite it against the law:

| Where                                           | Was                                                                                        | Now                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `cleaner.md`, `architect.md` (identical clause) | a stale file-list mention "is yours to correct in the same pass ... a factual fix only"    | report it at handoff                                                                 |
| `architect.md`, `vale-styles/**` ownership      | unqualified                                                                                | still owns the rules; **a rule change never carries an edit to the file it polices** |
| `CLAUDE.md`'s module map                        | `cleaner` and `architect` "are expected to update both that map and the article behind it" | the splitting role reports what went stale; this session edits                       |

**`vale-styles/**` stays with `architect` deliberately.** A Vale style is a rule file, not an
instruction file — the same tier as `rules/*.yml`. The qualification added is the one that matters:
authoring a rule does not license editing the prose that rule then flags.

**The known cost, stated rather than solved.** A behaviour-preserving split now leaves the module map
stale until this session edits it. That is a real regression in freshness, and the census rule
(`apply-the-census-count-rule-everywhere`) is the thing that would remove the need — a map that
enumerates without counting goes stale in fewer ways. The two entries are worth sequencing together.

### 10. Keep the one-clause why

**The floor, and it is not "no reasoning".** CLAUDE.md's comment convention already states the rule for
code: a comment says why, and the why stays beside the thing. The same holds here. What moves is the
multi-sentence account. What stays is the clause that changes what a reader does next.

"Never edit `rules/*.yml` — a dead rule and a satisfied rule look identical" keeps its why and loses
four sentences.

### 11. Pin what may not be lost

The prior spike built the right instrument for this and it should be reused: **a pre-registered
constraint census, pinned to the pre-edit file's git blob hash** — every obligation, prohibition,
precondition, exemption and named wrong answer, numbered before any edit, then cited line by line in
the after-file or in its new home. An uncited line is a recorded loss.

That census is what makes an aggressive cut safe, and it is the reason this can be aggressive.

### 12. Then ask what mechanises

**Only after the rewrite**, and on the evidence it produces. A rule that detects an eight-sentence
paragraph in a role file, or a past-tense narrative sentence, is a plausible guard against
re-accumulation. `HistoricalNarration` — deferred by the prior spike at precision 8/9 — is the
existing candidate and its YAML and fixtures are recorded in `prose-linting.rationale.md`.

**A guard against regrowth is worth more here than a compression tool**, because the files did not
arrive verbose. They grew that way one good paragraph at a time.

## Touches

`.claude/agents/*.md` — all five. New `coder.rationale.md` and `product.rationale.md` in
`articles/`, which is where a role sidecar is forced to live. Possibly `scripts/*/` sidecars.
`prose-linting.md`, whose instruction-versus-explanation section this refines at a coarser
granularity. `CLAUDE.md`'s documentation map, if a sidecar is added.

## Open questions

- **Does `architect.md` need a split rather than a strip?** The prior spike measured its length as
  scope rather than loose prose — four modes in one file, at lower finding density than `coder.md`.
  That is a CLAUDE.md branch question and may be a separate slice. It does not exempt the file from
  this one.
- **Which role goes first?** `coder.md` is the smallest at 1,857 words and the densest in findings,
  which made it the prior spike's starting point on the user's ruling. The same argument holds here.
- **Does a role file keep its prose voice at all?** An instruction-only file may read as a checklist.
  The one-clause-why floor is the answer this entry proposes; whether it is enough is a judgement the
  first rewritten file will settle better than an argument will.
- **What stops the sidecar becoming the new dumping ground?** Nothing proposed here. The sidecars are
  already large. Worth naming before the first move, because "route it to the sidecar" is exactly how
  a file grows one good paragraph at a time.
