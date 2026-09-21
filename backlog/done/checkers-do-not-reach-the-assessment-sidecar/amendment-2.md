# Amendment 2 — `checkers-do-not-reach-the-assessment-sidecar`

`coach` REVIEW, 2026-09-21. Amends the spec signed at the empty commit `454928d` and read with
`amendment-1.md`, signed at `7f35b8c`. **Unsigned.** `writer` has no authority under it until the
line at the end is countersigned.

## Item numbers

**Supersedes item 2 of `spec.md`, in one sentence of its verbatim sidecar body, and nothing else.**
Items 1, 3, 4, 5 and 6 stand as signed and as landed. Amendment 1's edits A and B stand as signed
and as landed, and this amendment reaches neither paragraph.

The edit is lettered **C**, continuing A and B, so the sign-off letters across this slice do not
collide.

**It restates nothing from amendment 1.** The `npm run prose-lint` row ruling stands as signed
there.

## Trigger

`editor` AUDIT found one live contradiction in text the spec supplied and two `coach` passes
cleared. Both gates are green, re-measured by this pass on `e510567`, 2026-09-21:
`agent-doc-check` 56 doc files / 8 agent files / 32 rules / no failures, and `reference-check` 541
files / 3239 references / no failures. Every Vale reading of the signed run list re-measured
unmoved: `SKILL.md` 0, `SKILL.meta.md` 0 in 1 file, `CLAUDE.md` 19, `prose.md` 5, `pipelines.md` 0.

**`.claude/skills/idea-assess/SKILL.meta.md`'s closing sentence of "Why the basename guard is
duplicated in prose" mis-states the rule it cites.** It reads that `claim-discipline.md` prohibits
asserting about the hook's internals. That article prohibits an **undated present-tense** fact about
another file, and its own text licenses the same claim written as history: "You may write a claim in
every form above, line numbers included, provided you write it as history."

**Three readings make it a contradiction rather than a loose phrase.**

1. **It is false about a file every role reads unconditionally.** Not a claim that will rot — wrong
   on the day it landed, and checkable against `claim-discipline.md` today.
2. **It forbids its own file's compliant sentence.** The first paragraph of the same section reads
   "On 2026-09-20 the hook gained a refusal for an assessment record's own path, in
   `board-shape.ts`'s `checkShape`, ahead of the candidate test" — a dated assertion about the
   hook's internals, and the exact repair the article recommends. Under the sentence as written that
   paragraph is prohibited.
3. **It removes the escape hatch from the one reader the file is addressed to.** The stated audience
   is whoever is changing a rule in `SKILL.md`. Such a reader needs two facts: the falsified clause
   form is ruled out, and a dated claim is not. The sentence gives the first as a blanket and hides
   the second.

**The provenance is mine, and narrower than amendment 1 recorded it.** See the correction below.

## The edit — `.claude/skills/idea-assess/SKILL.meta.md`, one sentence

Prettier owns the line wrapping. Match on the words, not on the break.

### C. The closing sentence of the paragraph beginning "The clause was rewritten rather than deleted"

**Replace, verbatim (ignoring line breaks):**

```text
The replacement keeps the duty and asserts nothing about the hook's internals, which `claim-discipline.md` prohibits.
```

**With, verbatim (ignoring line breaks):**

```text
The replacement keeps the duty and states no undated present-tense fact about the hook, which is the form `claim-discipline.md` rules out. A dated claim about the same refusal is not ruled out, and the `checkShape` sentence in this section is one.
```

**Change nothing else in the file.** The four other paragraphs, both amendment-1 paragraphs and the
"What was ruled out" section stay byte-identical.

### Why the fix names the form rather than dropping the citation

**Dropping the citation was the cheaper repair and it loses the load-bearing half.** A reader
amending `SKILL.md` may reasonably want the old consequence clause back. What stops them is that its
form is ruled out, not that its premise was falsified once — a premise can be re-measured, a ruled-out
form cannot be reinstated. So the citation earns its place and has to be right.

**The second sentence is an addition, and it is deliberate.** `prose.md`'s "How a pass damages the
file it cleans" warns that a pass adds obligations as readily as it drops them, so this one is
declared in the table below rather than left for a reader to notice. It adds a **permission**, not an
obligation, and the permission is the article's own.

**No token in the replacement is new to the file or to the gates.** `claim-discipline.md` already
appears in the sentence being replaced. `checkShape` is a bare backticked symbol, not a
`<file>'s <symbol>` citation, so `reference-check`'s symbol check does not fire on it — and the
untouched first paragraph carries the checkable `board-shape.ts`'s `checkShape` form already. There
is no `npm run` token, no retired-role name and no bare role-cycle chain.

## Obligations the replaced sentence carried

Read at sentence granularity, per the amendment rule. The replaced text is one sentence; it asserted
no measurement, no date, no sequence and no sufficiency.

| #   | Obligation in the replaced text                                                             | In the replacement  | Ruling                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | The replacement clause in `SKILL.md` keeps the guard's duty                                 | restored            | "keeps the duty", unchanged                                                                                                                                                                                                                  |
| C2  | The replacement clause does not carry the old clause's defect                               | restored, corrected | The defect is now named as the undated present-tense form rather than as any assertion about another file                                                                                                                                    |
| C3  | `claim-discipline.md` rules that form out, so restoring a clause of that shape is ruled out | restored            | "the form `claim-discipline.md` rules out"                                                                                                                                                                                                   |
| C4  | —                                                                                           | **added**           | The article's past-tense escape hatch, with one instance of it named in the same section. Without it the corrected sentence still reads as a blanket to a reader who does not open the article, which is the harm this item exists to remove |

**Nothing was dropped.** C4 is the only delta in the other direction, and it asserts no sequence,
sufficiency or permission beyond the one `claim-discipline.md` states in its own text.

## What C does not do, stated so nobody reads it as done

**C does not make the file comply with the rule it now states correctly.** Two sentences in the
sidecar are in the prohibited form: "Argv mode writes every line to stdout and exits 0, with the
outcome's `deliver` flag unread", and the opening sentence about what `run.ts` prints ahead of the
prompt. Both are true, re-verified against `run.ts` by this pass on `e510567`. That is F3, and its
disposition below is revised rather than reversed.

**A file that states a rule and contains an instance of the prohibited form is non-compliant, not
self-contradictory.** Both sentences hold at once: the article does rule the form out, and the file
does use it. That is the line this amendment stops at. Widening C to date those two sentences would,
in consistency, reach a third, and a three-sentence rewrite of a four-paragraph section is the shape
this slice's own record indicts — four amendments on the parent slice outlived their subject.

## Stopping condition, falsifier and fallback

`pipelines.md` requires all three of a second amendment on one slice. None of them needs a
measurement.

**Stopping condition — three properties a reader checks by reading.**

1. No sentence in `SKILL.meta.md` states a `claim-discipline.md` prohibition wider than the
   undated-present-tense form.
2. Every rule the sidecar attributes to `claim-discipline.md` is quotable from that article's own
   text.
3. No sentence in the sidecar forbids another sentence of the same file.

When all three hold, the cycle closes. F3's two sentences do not disturb property 3: they are
instances of a ruled-out form, not sentences that forbid anything.

**Falsifier — the observation that means the shape is wrong rather than the wording.** A further
finding located **inside this same paragraph** after C lands. Two passes at one sentence is a wording
correction; a third says the paragraph's argument cannot be carried by a cited rule at all, and no
further rewording will fix it.

**Fallback — pre-ruled here, so no third amendment is needed.** On the falsifier, `writer` replaces
the same sentence a second time, verbatim, with:

```text
The replacement keeps the duty and drops the falsified claim rather than restating it.
```

That carries C1 and a weak C2, and drops C3 and C4 outright. **Ruled acceptable only as a
fallback**, because it cannot be wrong: it cites no rule. The reader-facing loss — that the clause
form is ruled out rather than merely falsified — routes to `retro.md` as a candidate for a worked
example in `claim-discipline.md` itself, which is where a rule of that reach belongs.

## Correction to amendment 1's attribution

Amendment 1's trigger reads "That is mine, not `writer`'s: every byte is spec-supplied." **That is
true of paragraph A and false of paragraph B.** A signed amendment is immutable, so the correction
lives here rather than there.

Measured against `834e2ca` and the signed spec, 2026-09-21: the spec's item 2 supplied paragraph A's
bytes verbatim, including "other two". **D6 supplied no bytes at all** — it read "one sentence is
added to item 2's sidecar naming the second instance". `writer` composed two sentences to fill that
grant, and the count error amendment 1 corrected in paragraph B ("a fourth line shape", "none of the
three prior stop clauses") was `writer`'s wording under an unspecified grant, not spec text.

**Two things follow, and neither is a reopening.** The landed bytes of paragraph B are the ones the
user signed in amendment 1, so nothing in the corpus is wrong. And the lesson amendment 1 recorded —
that `writer` types spec bytes and so can never be a defect's source — is false as stated, which
would have mis-directed the retrospective. P12 below carries the durable half.

## Dispositions — every finding this review holds

The stopping condition for the cycle: only a live contradiction or a red gate reopens. No gate is
red. Applied in both directions.

| Finding                                                              | Live contradiction? | Red gate? | Disposition                      |
| -------------------------------------------------------------------- | ------------------- | --------- | -------------------------------- |
| `SKILL.meta.md`'s mis-citation of `claim-discipline.md`              | **yes**             | no        | **this amendment, item C**       |
| `SKILL.meta.md`'s undated `deliver`-flag paragraph (F3)              | no                  | no        | `retro.md`, disposition revised  |
| `SKILL.meta.md`'s opening sentence about what `run.ts` prints        | no                  | no        | `retro.md`, with F3              |
| `pipelines.md`'s "ahead of the candidate test" (F2)                  | no                  | no        | `retro.md`, as amendment 1 ruled |
| `pipelines.md`'s "reports the refusal and scores nothing"            | no                  | no        | `retro.md`, with F2              |
| `prose.md`'s "it carries no backlog" (F4)                            | no                  | no        | `retro.md` + recommendation 3    |
| "the same gap" doing double duty across paragraphs A and B           | no                  | no        | **ruled coherent, no record**    |
| `CLAUDE.md`'s "Articles that do not" roster omits `claim-discipline` | no                  | no        | seat's staleness residue         |
| `CLAUDE.md` "Ten are topic articles" versus "nine topic articles"    | yes, pre-existing   | no        | seat's staleness residue         |
| The pair-index bullet's "and no other skill does"                    | no                  | no        | `retro.md`                       |
| `.vale.ini`'s "carries no backlog" section header                    | no                  | no        | `architect`'s, already routed    |
| F2 and F3 never arrived in `retro.md`                                | no                  | no        | `retro.md`, as P15               |

### The four that need their reasoning on the record

**"The same gap" — ruled coherent, and no retro entry follows.** Paragraph A's property is anchored
to its own quoted shape, `an assessment record, 0 checks`, in the same sentence. Paragraph B is
anchored to its own, `off the board, 0 checks`, and disambiguates with "the same gap as the basename
guard's". A reader holding both sentences holds both anchors, so "same" reads as the class in B and
as the instance in A without either going false. Verified against the four stop clauses of
`SKILL.md` as landed: the three output-keyed clauses name neither the record shape nor each other's,
and the basename guard keys on the target's basename rather than on the output, so A's property
correctly excludes it. **A finding that resolves to no defect is noise in an intake**, so this one
ends here rather than in `retro.md`.

**The two `CLAUDE.md` defects go to the seat's residue lane, not to a process item.** Both are
exactly what `CLAUDE.md`'s Conventions bullet reserves to that seat — a file list missing a name,
and a count contradicting its own enumeration. Neither was created by this pass, and the spec barred
`writer` from `CLAUDE.md` beyond item 3's bullet. **P6 binds the route**: put both to the user as
route and text together, and take silence on either as consent to neither. I recommend it as one
approval, since both are one-line corrections in one file and the count defect is a live
self-contradiction that a reader can act on wrongly today.

**The pair-index bullet's negative universal rides to `retro.md`, and it is this pass's own.** "and
no other skill does" is a claim over a tier nothing checks — true today, five skills and one
sidecar, verified 2026-09-21. It is not forced: it is true, so there is no contradiction to fix, and
the honest repair drops the claim rather than updating it. The sharp half is that the same signed
spec removed a tier roster in item 4 on exactly this reasoning and added a tier universal in item 3.
P13 carries it.

**F3's disposition is revised, not reversed.** Amendment 1 ruled it non-blocking on the ground that a
claim true today which rots later is not a contradiction. That ground holds and I re-verified the
claim against `run.ts` today. What changes is its priority: once C lands, the file names the rule
correctly nine lines below a sentence in the prohibited form, so the repair is now legible to any
reader of the section. The repair is a date, not a deletion — `claim-discipline.md`'s own escape
hatch — and that is a wording change of the kind `retro.md` exists for.

## The re-entered pass

`writer` runs C. Scope is one file, `.claude/skills/idea-assess/SKILL.meta.md`, one sentence.

**Then `editor` CLEAN, then `editor` AUDIT, then `coach` REVIEW — in that order.** P11 records the
seat running the first `coach` REVIEW with no AUDIT before it, and P14 below is why that ordering is
load-bearing rather than tidy: AUDIT is the only pass in this pipeline with a reading of a cited
rule independent of the spec's.

| Command                                         | Expected reading                                 | A finding means                                |
| ----------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `vale .claude/skills/idea-assess/SKILL.meta.md` | 0 in 1 file — the tier is exempt, unmoved        | the `[**/*.meta.md]` exemption stopped winning |
| `npm run prose-lint -- --scope .claude/skills`  | the `idea-approve/SKILL.md` finding and no other | C introduced one, or F4's finding moved        |
| `npm run reference-check`                       | pass                                             | a filename or symbol citation broke            |
| `npm run agent-doc-check`                       | pass                                             | unexpected — C carries no such token           |
| `npm run format`                                | clean, last                                      | —                                              |

**Read "0 in 1 file", never "0".** A glob miss on the exempt tier reports "in 0 files", and the two
read alike at a glance. Measured this pass: "in 1 file".

## P1 to P11 carried forward

P1 through P10 stand as `spec.md` and `amendment-1.md` wrote them, and as `retro.md` records them.
P11 stands with both its instances. Four are added below. All go to `retro.md`, which the seat
writes; nothing here edits it.

- **P1 — the pipeline plans an artifact its producer may not write. Unchanged.**
- **P2 — a rule and its mandatory article entry have two owners and no green intermediate state.
  Unchanged.**
- **P3 — a role file's standing duty and a legitimate prompt can contradict each other. Unchanged.**
- **P4 — the board read carve-out is a two-file allowlist and the pipeline needs three artifacts
  through it. Unchanged.** This REVIEW needed no third artifact and adds no instance.
- **P5 — a measurement's input is a premise to re-measure. Unchanged, and it paid out a third
  time.** Every premise this review was handed was re-run rather than accepted: both gates, all five
  Vale readings, both quoted hook strings against `board-shape.ts` and the live run, the `deliver`
  flag against `run.ts`, F4's finding, the sidecar count at 23, and the five-skills tier claim. One
  handed premise was **refuted** — amendment 1's "every byte is spec-supplied", corrected above.
- **P6 — the seat's staleness residue needs the route approved as well as the text. Unchanged, and
  it is the live instance again.** The two `CLAUDE.md` defects are routed to that lane rather than
  edited, with both halves named.
- **P7 — nothing binds a sidecar to `CLAUDE.md`'s pair index. Unchanged.** Re-measured 2026-09-21 on
  `e510567`: 23 tracked `*.meta.md`, 23 named, 0 missing.
- **P8 — a conditional spec item can falsify verbatim text elsewhere in the same spec. Unchanged,
  and P12 is the half of it that was mis-attributed.**
- **P9 — a counted census inside a sidecar has no loud audience. Unchanged, and the hand audit ran
  again.** `editor` CLEAN applied it across the whole file and found no residual
  count-beside-enumeration shape. This pass found none either.
- **P10 — a sign-off block instructs the signer to edit an immutable file. Unchanged, and this file
  reproduces the shape deliberately.** Changing the block's shape is a process change needing its
  own signed spec, and doing it unilaterally inside an amendment is the boundary this pipeline
  holds. The block below says where the signature lives.
- **P11 — the seat dropped a sequencing rule, twice in one slice. Unchanged, and it paid out.** The
  skipped `editor` AUDIT is the pass that found this amendment's subject. The cost was not
  theoretical.

### Added by this review

- **P12 — a spec that grants an edit without supplying its bytes hands authorship to `writer` while
  reading as verbatim throughout. New.** Every item of this spec supplied verbatim text except D6,
  which granted "one sentence is added to item 2's sidecar". `writer` composed two sentences, and
  the count error corrected in paragraph B was that composition rather than spec text. Nothing in
  the artifact marks which paragraph the spec did not write, which is how amendment 1's attribution
  went over-broad. **The durable form: a spec supplies bytes for every edit it names, a conditional
  item included; a grant with no bytes is a `writer` decision the spec is pretending to have made.**
  The cheap version is one line — a decision point that cannot supply bytes says so, and says who
  authors them.

- **P13 — a spec cites a rule at two widths and violates the same article in a third item, and
  nothing reads a spec against the rules it invokes. New, two instances.** Item 1's binding note 3
  states `claim-discipline.md`'s rule correctly in its second sentence and over-broadly in its
  bolded lead; item 2's verbatim body kept only the bolded half, which is the sentence C replaces.
  Separately, item 4 removed a tier roster from `prose.md` on the ground that a roster of external
  state rots, and item 3 added a negative universal over a tier in the same pass. **The durable
  form: where a spec invokes a house rule, the rule's own text is the authority and the spec's
  paraphrase is not — quote it or cite it, never compress it.** No role reads a spec against
  `claim-discipline.md` today, and `coach` is the only party positioned to.

- **P14 — `coach` REVIEW reviews text `coach` SPEC authored, so a defect that needs disagreement
  with the spec's own reading is not findable there. New.** Amendment 1's F1 was a numeral against
  its own enumeration — mechanical, and REVIEW found it. This amendment's subject is a judgement
  about what a cited article says, where the reviewer shares the author's mistaken reading, and one
  REVIEW pass cleared it. `editor` AUDIT found it on its first run. **The durable form: `editor`
  AUDIT is not optional for a process enabler, because it is the pipeline's only independent reading
  of a cited rule.** This strengthens P11's remedy rather than competing with it — the sequencing
  rule that was dropped is the one that protects against this class.

- **P15 — a disposition routed to `retro.md` is executed by a different party than the one that
  ruled it, and nothing reconciles the list. New.** Amendment 1 dispositioned four findings to
  `retro.md`. Measured 2026-09-21 on `e510567`: F4 arrived as board recommendation 3, and **F2, F3
  and the heading observation did not arrive at all.** The seat wrote a thorough intake of eleven
  findings and three recommendations; the three that came through an amendment's table rather than
  through a handoff's finding list are the three that fell out. **The durable form: an amendment's
  disposition table is an instruction to the seat, and the closing REVIEW is the only pass that can
  check it arrived.** This review did, which is how the gap surfaced.

## Cross-pipeline recommendations

Recommendations 1, 2 and 3 stand as `spec.md` and `amendment-1.md` wrote them, with 1's figure at 23
of 23 as of 2026-09-21. Nothing is added: none of this review's findings is mechanisable, and the two
`CLAUDE.md` defects route to the seat's residue lane rather than to the board.

## Sign-off

**This amendment is unsigned.** Neither the spec's signature nor amendment 1's carries across it.
`writer` has no authority to touch `SKILL.meta.md` until it is signed, and the cycle does not
re-enter at step 2 before then.

Rule C, and rule the fallback so no third amendment is needed for it. **The signature is an empty
commit and these lines are not a form to fill in** — they state what is being signed, and `git log`
records the ruling. See P10.

- C — the closing sentence of "Why the basename guard is duplicated in prose", stating the rule as
  the undated-present-tense form and naming the escape hatch: **not yet ruled**
- The fallback, pre-authorized against the stated falsifier: **not yet ruled**

Signed: _pending_
