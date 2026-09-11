# Rationale: Prose Linting

**Audience:** whoever is changing a ruling in `prose-linting.md`. **Read when:** you are enabling,
disabling or re-levelling a Vale rule, or arguing with one of that article's exemptions — never in order
to follow one.

No role carries a read trigger for this file. `prose-linting.md` is written to be actionable alone; this
holds the measurements behind it, so a ruling can be argued with rather than only obeyed. Everything
below is history: what was measured, when, and what was rejected.

## Where this came from

`rationale-sidecar-pilot` stood Vale up as the pilot's tooling half. `ste-shape-rules-on-doc-comments`
then applied the rules to `doc-comments.md` one at a time and measured each. Every count below was taken
on that file, on 2026-09-08, against vale 3.20.0 and `Syntaf/vale-llm-slop` v0.1.0.

The guidance lived as 140 lines of comment inside `.vale.ini` before this article existed — a config
file that was 86% prose. That was the wrong home by CLAUDE.md's routing test, and the move here is the
correction.

## The style ships twelve rules. Six are on.

| rule              | on? | findings on `doc-comments.md` | why                                                    |
| ----------------- | --- | ----------------------------: | ------------------------------------------------------ |
| `SentenceLength`  | yes |                        29 → 0 | mechanical, no judgement needed                        |
| `ProcedureLength` | yes |                        12 → 6 | ~2 of 12 genuine; the rest are its declared over-count |
| `OneInstruction`  | yes |                         2 → 0 | ~50% precision corpus-wide; one class is dangerous     |
| `PassiveVoice`    | yes |                       26 → 22 | ~4 of 26 genuine; five exempt classes are enumerable   |
| `Gerunds`         | no  |                            65 | idiomatic prepositional gerunds — see below            |
| `Dictionary`      | no  |                             7 | not ASD's wordset — see below                          |
| `Modals`          | no  |                             4 | would do damage — see below                            |
| `NounClusters`    | no  |                             2 | fails its own example — see below                      |
| `Contractions`    | yes |                         2 → 0 | mechanical; the residue is in `prose-linting.md`       |
| `Ambiguity`       | no  |                             2 | slash token false-positives — see below                |
| `Articles`        | no  |                             0 | aerospace verb list; 0 of 4 corpus-wide — see below    |
| `ParagraphLength` | yes |                             0 | mechanical, no tagger; 41 corpus-wide are all real     |

Corpus-wide counts across the 14 articles at the time of measurement: Gerunds 941, SentenceLength 799,
PassiveVoice 592, ProcedureLength 166, Contractions 135, Dictionary 129, Modals 96, NounClusters 59,
Ambiguity 58, ParagraphLength 41, OneInstruction 10, Articles 4.

## The two tried on 2026-09-08 after the article landed

**`STE.Contractions` — adopted.** Three findings across `doc-comments.md` and `prose-linting.md`. Two
were headings and both improved on expansion: "A hover that doesn't suffice" and "Don't spend a hover"
became "does not" and "Do not", which reads as more weight rather than more words at the head of an
instruction. The third is a **quotation** of `engineering.md`'s text, where expanding would misquote the
source; it stands unfixed and is written up as the rule's one exempt class. Note this is the same
false-positive class that sank `STE.Modals` — a rule firing on prose this repo is citing rather than
authoring.

**`STE.NounClusters` — rejected, and the evidence is unusually clean.** It fired twice on
`doc-comments.md`, on "Interface half → JSDoc above the declaration" and "TypeScript reads a JSDoc tag",
neither of which contains a noun cluster a reader would stumble over. It then **failed to fire on the
example in its own header**: a probe file containing "Replace the main landing gear door actuator before
flight" produced no `NounClusters` finding, while `SentenceLength` and `PassiveVoice` both fired on the
same file — so the file was genuinely linted and the silence is the rule's answer, not a skipped run.

A rule that misses its own documented classic case while flagging sequences that are not clusters has
inverted precision. Its four-consecutive-noun-tag matcher depends entirely on the POS tagger, which reads
"landing" as a verb form and "reads" as a plural noun. Nothing about this corpus makes it work better.

## The two mechanical rules interact, measured on this article

Recorded 2026-09-08, during the corrective pass that followed `architect`'s REVIEW of
`ste-shape-rules-on-doc-comments`. A 35-word sentence in `prose-linting.md` was split to clear
`STE.SentenceLength`; the paragraph it sat in then reported **7 sentences** against
`STE.ParagraphLength`'s cap of six. Splitting the paragraph cleared both, and no wording was reverted.

**One instance, not two.** Commit `7bc35fa`'s message says the trade happened twice in that pass. It
happened once. The second apparent instance was the same finding surviving a failed edit, not a new one.

The interaction is why `prose-linting.md` states an order — sentences first, then paragraphs — and why it
says to re-run rather than trusting a single pass. Two rules that are individually mechanical are not
jointly mechanical, which is a narrower claim than "three rules apply mechanically" makes on its own.

## The three tried last, completing the sweep

**`STE.ParagraphLength` — adopted.** Zero findings on both worked files, 41 corpus-wide on paragraphs of
7 to 13 sentences. It counts sentence terminators and consults no tagger, so there is no precision
question to answer: a paragraph either has more than six sentences or it does not. Enabling it costs the
worked files nothing and catches regression in them.

**`STE.Articles` — rejected.** Its matcher is a closed list of 34 aerospace procedural verbs — Remove,
Install, Tighten, Lubricate, Drain — and none of this repo's procedural verbs (`Run`, `Read`, `Commit`,
`Split`) appears in it. All four corpus-wide findings were false: three were the JavaScript `Set` type
read as the imperative "Set" (`Set multiset`, `Set members`, `Set path`) and one was "Push new". Zero of
four. Salvaging it means replacing the verb list with this repo's own, which is authoring a variant
rule — and the defect it exists to catch, telegraphic style with dropped articles, is not one this
corpus has.

**`STE.Gerunds` — rejected on cost rather than on correctness.** 65 findings on `doc-comments.md` and
941 corpus-wide. Sampled, they are overwhelmingly gerunds after a preposition: "before writing or moving
a comment block", "instead of reading a body", "worth obeying", "when you are changing a rule". Those are
STE violations by the letter, and a few would genuinely improve ("before writing" → "before you write").
Most would not. "including" was also flagged, where the word is a preposition rather than a verb form.

The deciding argument is triage cost against benefit: 941 findings, each needing a judgement, to gain
prose an agent already parses without difficulty. The rule's own header concedes the mechanism —
"imperative-heavy technical prose is out of the tagger's training distribution; expect misses and false
hits".

**A pattern across the six rejections.** Three of them — `NounClusters`, `Gerunds`, `Articles` — are
driven by the part-of-speech tagger, and two say in their own headers that it is unreliable on this kind
of prose. `Articles` is the sharpest case: its header explains that it abandoned a POS implementation for
exactly this reason, and the closed list it fell back on is domain-specific in a way that does not
transfer. The generalisation worth carrying: **a POS-driven rule is guilty until measured here.**

## The three rejected on measurement

**`STE.Modals` — rejected, and it is the one that would have done damage.** It ships at `level: error`
and blind-swaps `should→must`, `may→can`, `might/could→can`. Two of its four findings on
`doc-comments.md` were inside a **quotation of another article's section title**: `engineering.md`'s "A
comment **may** state why; it **may not** state an undated present-tense fact." Applying it would
misquote that article and turn a prohibition ("may not") into an inability ("can not"). More broadly this
repo's most careful writing turns on the may/must distinction — the merge-protocol exemption rests on
"`hardener` **may** refuse an exemption; it may **never** grant itself one." Flattening that is not a
style change.

**`STE.Ambiguity` — rejected, and it was expected to be the best candidate.** Its Latin-abbreviation and
"as required/necessary" tokens are genuinely valuable. Its slash token `[a-z]{3,}/[a-z]{3,}` swamps them:
the actual findings were `interface/implementation`, `interface/type`, `LSP/token`, `left/right` and
`unclebob/swarm` — the last being a GitHub org path. The rule guards against `TCP/IP` by requiring
lowercase, which does not help when the compound terms are themselves lowercase. Salvaging the useful
half means authoring a variant rule, not enabling this one.

**`STE.Dictionary` — rejected on licence, not on precision.** Its own header states it: "this is NOT the
ASD-STE100 Dictionary. The official dictionary of ~900 approved words … is copyrighted by ASD and is
deliberately not reproduced here." What it ships instead is plain-language advice from GOV.UK,
plainlanguage.gov and 18F. Enabling it would enforce readability preferences over a corpus of necessary
jargon, not enforce STE.

## The per-rule precision measurements

**`SentenceLength`.** 29 findings, all genuine, all fixed. The only rule here a sweep can follow. The
first six resisted a single pass and were split individually; none required dropping content.

**`ProcedureLength`.** 12 findings. Roughly two were genuine procedures — the commit-discipline steps.
The other ten were definitions, hazard statements, a numbered-list lead-in and `architect`'s REVIEW
disposition, all bulleted and therefore counted as procedures. Worked down to 6 by restructuring the
genuinely procedural lists; the remaining 6 sit at 21–30 words and were left deliberately.

**`OneInstruction`.** 12 findings corpus-wide across 8 files when first measured, 2 of them on
`doc-comments.md`. Six were read by
hand: three genuine, three not. The two on this file were one of each, which is the useful pair — a real
two-step chain in the commit discipline, and the `// prettier-ignore` ordering where `, then` is not two
actions but one instruction whose content is the order.

**`PassiveVoice`.** 26 findings, 16 read by hand, roughly 4 worth acting on. All 22 residual findings
were then classified: 3 dated past-tense records, 9 descriptive prose with an irrelevant actor, 4
predicate adjectives, 1 passive that already names its agent, 1 deliberate aphorism, and 4 genuinely
arguable cases left in.

**This rule was disabled and then re-enabled, and the reversal is on the record because the first call
was inconsistent.** It was disabled at ~4-in-26 precision while `ProcedureLength` was kept at ~2-in-12.
Those are the same number with opposite verdicts. The claim-discipline conflict that was offered as the
distinguishing reason is an argument for a documented exemption rather than for disabling, which is the
treatment the other two prompt-rules already carried.

## What a missing `.vale/` actually reports, measured 2026-09-10

Taken in the `ratify-the-rationale-tier` worktree on vale 3.20.0, by moving `.vale/` aside and running
`vale .claude/agents/articles/prose-linting.md` with the two streams redirected separately.

| what                | value                                                                             |
| ------------------- | --------------------------------------------------------------------------------- |
| process exit status | **2**                                                                             |
| stdout              | **0 bytes**                                                                       |
| stderr              | 7,482 bytes — `E201 Invalid value`, an echo of `.vale.ini`, then the missing path |
| Vale's closing line | `Execution stopped with code 1.`                                                  |

Two things follow, and the second is why this is recorded rather than assumed. The exit status is **2**
rather than the 1 the report-only section lists for a rule match or a parse failure, so a caller that
tests for 1 reads a config error as success. And the closing line names a different number from the one
the process returns, so quoting Vale at itself is how the wrong figure spreads.

The `grep -c` symptom is a consequence of the empty stdout rather than of the error text. A pipeline
reading stdout counts zero however the run failed.

An earlier draft of CLAUDE.md's worktree-setup note recorded the exit status as 1, taken from that
closing line. It never reached `main`.

## Two mistakes worth not repeating

**`BasedOnStyles = Vale` is not "no style".** It was the first attempt at the sidecar exemption and it is
wrong: the `Vale` style enables the built-in rules, and `Vale.Repetition` and `Vale.Spelling` fire at
error severity. The empty form is undemonstrated in Vale's own documentation and was verified here to
yield zero findings.

**Emptying `BasedOnStyles` does not disable an explicitly-levelled rule.** Measured 2026-09-08: the
sidecar section carried only `BasedOnStyles =` and leaked 78 findings onto `doc-comments.rationale.md`.
The exemption had genuinely worked earlier, when no rule carried an explicit level and the style list was
the only thing turning rules on. It broke the moment rules were named individually — an explicit
`STE.Rule = warning` activates that rule on its own, and `BasedOnStyles` replaces the style list rather
than the per-rule keys. Nothing reported the change. The fix is to switch each enabled rule off by name
in the sidecar section too, and the pairing is now stated as a rule in `prose-linting.md`.

**The role files abort the run.** Pointing Vale at `.claude/agents/` rather than
`.claude/agents/articles/` fails, because `architect.md` and `coder.md` carry a literal `": "` in their
`description:` front matter that a real YAML parser reads as a nested mapping. Measured: those two abort,
`product.md`, `cleaner.md` and `hardener.md` parse clean. This independently reproduces the count CLAUDE.md
already records for `agent-doc-check`, which uses a bespoke line-anchored reader for exactly this reason.
One unparseable file aborts the whole invocation rather than skipping that file, so the failure presents
as a clean run.

## What the shape rules did not do

**They did not shorten the file.** Measured across the passes on `doc-comments.md`: 3,746 words before,
3,690 after the sentence-length work, 3,731 after the procedure-length work. Net roughly flat. Shortening
a sentence splits it; shortening a list item moves its content into prose and costs connective tissue.

Argue these rules on parseability. A slice claiming a size benefit as well would be overclaiming, and the
measurement to cite against that claim is this one.

**They did not reduce emphasis density.** A rule was drafted — "a bolded lead-in only where it opens a
rule" — and it failed: bold-led blocks went from 61% to 54%. In an instruction file nearly every block
_is_ a rule, so the rule as written licenses almost everything. The narrower form, bolding the imperative
clause rather than the sentence around it, is untested.

## The standard this article holds itself to

`ste-shape-rules-for-instruction-files` sets the bar: a stated rule a second author can apply to a second
file and get a comparable result, not a sensibility. Measured against it after all twelve rules were
tried, **three of the six enabled rules clear it** — `SentenceLength`, `ParagraphLength` and
`Contractions`. The other three are prompts a person reads, and they are documented as such rather than
promoted.

**An earlier version of this section said the mechanically enforceable subset was one rule.** That was
written when `SentenceLength` was the only rule enabled, and it was left standing while `Contractions`
and `ParagraphLength` were adopted — so the article and this file spent several commits asserting
opposite headline findings, in the pilot pair for a convention whose whole premise is that a pair stays
consistent. `architect` found it in REVIEW. Recorded rather than quietly corrected, because the failure
is the interesting part: a conclusion drawn from a measurement goes stale when the measurement is
extended, and nothing rereads a conclusion.

**What actually separates the two columns, which is the finding the stale version was groping at.** A
rule is mechanical when **its trigger is the defect**: a sentence over 25 words, a paragraph over six
sentences. A rule is a prompt when its trigger is a **proxy** for the defect: a list item standing in for
a procedure, a `, then` standing in for two actions, a be-verb plus participle standing in for a rule
that hides its actor. Counting is not the distinction — `ProcedureLength` counts and is still a prompt,
because the unit it counts is a stand-in.

**`Contractions` sits at the edge of that, and the qualification matters.** Its trigger is a contraction
_token_ while the defect is a contraction _used_, so the use/mention exemption is a proxy gap — narrower
than the prompts', but real. What keeps it mechanical is that **its exempt class is nameable in advance
and rare**: one class, quotation or mention, recognisable on sight. The three prompts carry three, five
and one class, and each needs a judgement per finding. Exempt-class count is the sharper discriminator;
trigger-versus-proxy is the reason behind it rather than a replacement for it.

**That test predicts four of the six rejections, and naming the two it misses is what keeps it honest.**
`Modals`, `Ambiguity`, `NounClusters` and — in part — `Articles` each fire on a proxy that does not hold
here: three on part-of-speech tags, one on a slash that usually joins a compound term.

The other two were rejected on grounds the test says nothing about:

- **`Dictionary` was rejected on licence, not precision.** A word absent from its list is exactly what it
  claims to find, so its trigger _is_ its defect. The list is simply the wrong list.
- **`Gerunds` was rejected on triage cost, not correctness.** Its findings are STE violations by the
  letter, so the test predicts it should be **on**. 941 findings, almost all idiomatic, is why it is not.

An earlier version of this section claimed the test predicted all six. `architect` refuted it by reading
this file's own rejection sections two headings above, which say "rejected on licence" and "rejected on
cost" in those words. A headline generalisation outrunning the detail beneath it is the same failure this
section was rewritten to fix, committed again in the act of fixing it.

## The triage of this article against its own rules, 2026-09-09

The article was linted finding by finding, under the rule it had just gained. **46 prompt findings, 46
exempt, 0 act-on.** The mechanical rules were at zero before the pass and are at zero after it.

**Read that 46 as history, not as a single measurement.** The triage covered 45. The pass's own edits then
added a 46th — line 140, "its findings are dominated by mentions rather than uses", which names its agent
and is class 4. The figure here is the committed tree, measured after the final commit rather than during
the pass. Recorded this way because the first version of this section carried the mid-pass 45, which the
committed tree already contradicted.

| Rule              | Findings | Act-on |
| ----------------- | -------- | ------ |
| `PassiveVoice`    | 31       | 0      |
| `ProcedureLength` | 13       | 0      |
| `OneInstruction`  | 2        | 0      |

The article's own rule asks for the count in each exempt class, not only in each rule. For the 31
`PassiveVoice` findings:

| Exempt class                              | Count |
| ----------------------------------------- | ----- |
| 1. Dated past-tense record                | 9     |
| 2. Descriptive, actor irrelevant          | 4     |
| 3. Predicate adjective read as participle | 6     |
| 4. Passive already naming its agent       | 2     |
| 5. Deliberate aphorism or heading         | 3     |
| A quoted exempt-class example             | 5     |
| Arguable, left in                         | 2     |

The sixth row is not one of the five classes in the article, and that is the general finding stated
plainly: five of the findings are the passages where the article prints its own exempt-class examples. The
tagger reads a mention as a use and cannot do otherwise. All 13 `ProcedureLength` and both
`OneInstruction` findings fall in their rules' documented false-positive classes — statements rather than
steps, and one specified order rather than two actions.

A clean sheet on a file this long is a result to distrust, so the reason is worth stating. Most of the
findings are the article quoting the defect it governs. The `PassiveVoice` findings at the five
exempt-class examples are the examples themselves — "Four `@see` forms were measured and rejected", "How
it is computed", "Writing is verified by reading" — and the `ProcedureLength` and `OneInstruction`
findings sit on the false-positive classes for those same rules. The tagger reads a mention as a use, and
cannot do otherwise.

That is the general finding, and it is now in the article: a guidance article trips its own rule. The
count is high, the act-on share is near zero, and a reader who has not been told this reads the count as
a dirty file.

**Two residuals were left in as arguable rather than filed under a class.** "It is deliberately not
pointed at `.claude/agents/*.md`" and "This is written down because it went wrong" are both descriptive
passives whose actor is the author. Each sits beside an active instruction that carries the actual
direction, so rewriting them would move no reader. Recorded here rather than silently counted as exempt.

**The pass also found a live defect outside this file.** The act-on grep the article now documents hit
`engineering.md` — a permission written as `is permitted`, in an unsplit house-rules article outside this
slice's manifest. Reported rather than fixed, for the same reason the manifest exists.

## Widening the scope to the role files

**Ruled 2026-09-09 by the user**, which is also the explicit direction `workflow.md` requires before
touching a role file.

**The blocker was real and it was worse than the article recorded.** The article said one unparseable file
"aborts the whole run". Measured: `vale` over a role file and `engineering.md` in the same invocation
reported **zero findings for both**, where `engineering.md` alone reports 107. So the two bad files were not
merely unlinted — they were silencing every other file anyone linted alongside them.

**Two of the five role files were invalid YAML, and the other three were already fine.** `architect.md` and
`coder.md` failed with `E201:yaml: line 2: mapping values are not allowed in this context`. `cleaner.md`,
`hardener.md` and `product.md` parsed cleanly.

**Three fixes were considered. The one taken is the root-cause fix.**

- **A folded block scalar** (`description: >-`) parses, and was measured to clear the error. It was rejected
  because it moves the value off the `description:` line, where `agent-doc-check`'s bespoke line-anchored
  reader looks for it. That check would then have passed while reading `>-` as the description — a gate
  weakened silently, which is the failure direction this repo cares most about.
- **`vale --ignore-syntax`** lints line by line and skips parsing entirely. Rejected: it also discards
  markdown awareness, so fenced code blocks would be linted as prose.
- **Quoting the scalar.** Taken. Measured: all five files parse, `agent-doc-check` still passes, and both
  descriptions survive a real YAML parse **byte-for-byte identical** to what `main` carried. The diff is two
  lines.

**Use double quotes rather than single, and the reason is Prettier rather than YAML.** Both forms parse.
Single-quoting was tried first and required doubling every internal apostrophe, which these descriptions
carry in quantity. `npm run format:check` then failed, because Prettier normalises a YAML scalar to double
quotes — and it had passed on `main`, so the breakage was introduced rather than pre-existing. Double
quotes need no escaping here, since neither description contains a backslash or a double quote. **Check for
both before reaching for this fix on a third file.**

**The scope change is one glob, and the sidecar exemption still wins because it is still last.** Verified in
one invocation after the change: a role file reports findings, an article reports findings, a
`*.rationale.md` sidecar reports zero, and no file reports `E201`.

**Widening the scope creates no obligation to fix what it revealed.** This article's own rule is to lint the
file you are editing rather than the directory, so each role file is worked by the slice that edits it.

## Vale carries a per-rule key across sections, measured 2026-09-10

The article states two mechanisms about per-rule keys that sound contradictory, and both hold. A
per-rule key reaches only the files its own section's glob matches. A per-rule key from an earlier
matching section then survives into every later section that also matches, whatever that later
section does to `BasedOnStyles`.

The probe used `STE.ProcedureLength`, which ships at `suggestion` and so fires only where something
re-levels it. Three throwaway files carried the same over-length list item, under a throwaway config
with three sections: one re-levelling the rule, one naming `STE` and nothing else, and a last one
emptying `BasedOnStyles`. Measured on vale 3.20.0 against this repo's own `StylesPath`:

| Sections the file matches                                  | Result     |
| ---------------------------------------------------------- | ---------- |
| the re-levelling section                                   | 1 finding  |
| the `STE`-only section, and no other                       | 0 findings |
| the re-levelling section and the empty-`BasedOnStyles` one | 1 finding  |

Row 2 is why the enable block repeats three times. The three enable globs match disjoint sets of
files, so a key written for one never reaches the other two. Row 3 reproduces the 78-finding leak of
2026-09-08 in miniature, and is why the sidecar section switches each enabled rule off by name.

**The wrong summary of this is "Vale does not inherit per-rule keys", and that sentence reached the
article for one commit.** Row 3 refutes it. A reader who believes it deletes the six `= NO` lines
from the sidecar section as redundant, which restores the exact leak the paragraph above them
documents. Only row 2 is about the exemption-section edit; row 3 answers a different question, and the two
rows were collapsed into one claim.

## The incidents behind "How a pass damages the file it cleans"

Six files were linted to mechanical zero in one session — the five role files and `orchestration.md`
— each with an independent `architect` REVIEW. Every review found a defect the pass had introduced.
These are those defects, with the figures.

### The direction, four for four

`architect.md`, mechanical 101 to 0. The review found four meaning regressions and every one weakened
an obligation: contract-mode Q2 lost "before a spec has been written around the workaround", removing
the consequence that makes an affordance finding urgent; Q4 kept "read the count" but lost what the
count answers; the property-test duty went from "check that…" to "It also means whoever… showed it
failing", turning an obligation into an assertion; and the Halstead bullet lost "is corroborating
evidence for splitting it up", removing the action the corroboration licenses.

None looked deliberate. Each is a plausible shortening.

**Read the four-for-four framing as the author's, not the reviewer's.** `21cec03`, the REVIEW commit,
names no pattern across the four: it leads with the baseline correction and sorts the regressions into
two classes, "content that left the pair entirely" and "actionable instructions weakened into
descriptions". The phrase first appears in the author's own idea commit `606caad`. The regressions are
real and the count is right. The generalisation over them was written by the person who made them, and
that is worth knowing before treating four instances in one file as a direction.

**One of the four is described more precisely here than in the article's compressed list.** Q4 kept
its measurement. What the pass dropped was the sentence saying what the count answers, which is a
different loss from dropping a measurement.

### The blind spot in a word count

`coder.md`. "your job is done once the underlying wiring exists **and** the unit/Gherkin layer is
green" was split into two sentences, so the first asserted that wiring alone finishes the slice. The
obligation-word count did not catch it: `must` went **1 to 2**, an increase, because the detached
conjunct gained its own modal.

### The connective a fixed list cannot anticipate

`orchestration.md`. "a test file had grown to 38 tests and 19.88s unnoticed, **because** `cleaner`
watched mutant _count_ … and nobody watched test _runtime_" lost its connective and became two
juxtaposed facts. The section's instruction rests on that causation, and the sentence after it has no
antecedent without it. Found by a full token-frequency diff, which showed `because` 4 to 3; a fixed
word list would have had to name that word in advance.

**Note that adjacency is the defect here, not the reassurance.** The two facts above did survive as
adjacent sentences. That is precisely why the loss was invisible, and the word carries the opposite
sense in the paragraph below.

A cross-file total was recorded alongside this — "sixteen causal connectives dropped across the four
landed role files, all sixteen surviving as adjacency". **It does not reproduce, and the inspection it
claims has no record behind it.** Re-derived 2026-09-10 over `because`, `since` and `so`, comparing
each file's pre-lint copy with its post-review copy: 22 drops counting the role file alone, and 14
counting the role file plus its sidecar. Neither figure is 16, and no other definition tried reaches
it. The only inspection in the record is `7bd7388`'s, which read `coder.md`'s three `because` losses
and found each one benign.

**The rule never needed the total.** One real loss, found by a full token diff on a file where a fixed
word list would have missed it, is the whole argument for the check. A cross-file count of drops is
not a count of defects, because a drop is benign until somebody reads the site.

### The list that split under a green gate

`cleaner.md`. A whole-line replacement inside an ordered list dedented traps 3 to 5 and three closing
paragraphs from three spaces to column 0. Step 3 ended at the second trap; the remainder became a
top-level list plus loose prose, and the next item opened a fresh ordered list. **`npm run
format:check` was green over it** — Prettier normalises the break as intentional — so nothing in the
repo could have caught it.

The same pass removed the `(a)`/`(b)` labels from the two-purposes prose while keeping the "from step
3(a)" citation that points at them. Both the pre-lint and the post-lint commit carry that citation, so
the record shows a citation retained past its anchor rather than a citation restored. A word-count
check verifies tokens, not referents, and the citation token itself never moved.

### Findings a pass creates

`orchestration.md`. The pass reported 19 `PassiveVoice` residuals. The true residual was 18, against a
measured baseline of 18, so the reported number was itself one high — worth stating, because the
fixed-one-created-one account below only adds up against 18. It had fixed one passive and created one,
by isolating a quoted `engineering.md` section title that the matcher then read as prose. It reported
18 `ProcedureLength` against a baseline of 17, and that finding was created outright, by a contraction
rewrite that took a bullet from under 20 words to 21.

Writing this article's own additions reproduced it a third time. The commit recorded +3
`PassiveVoice`; re-measured 2026-09-10 against the same baseline of 34, the figure was **+4**.

**A net figure hides its own composition, and this one changed under a second pass.** The +4 above was
measured at the slice's first commit. The REVIEW pass then deleted one of those four sites and added
two more, so the same net +4 now decomposes differently. Measured on the committed tree against
`main`'s copy in scope, five sites added and one removed:

| site                                                              | added or removed |
| ----------------------------------------------------------------- | ---------------- |
| "None is caught by a checker"                                     | added            |
| the "finished, permitted or sufficient" predicates                | added            |
| "A reference is not restored until you confirm its anchor exists" | added            |
| "Two of them left genuine steps unacted on purpose"               | added            |
| the quoted broken string "that is already been done"              | added            |
| the reworded `Contractions` table row                             | removed          |

The last added row demonstrates the verbatim-quotation exempt class these same additions introduced.
Record the composition rather than the net, because a net is what stops reproducing first.
`ProcedureLength` is +1 on the committed tree against a baseline of 13, and was +2 at the first
commit. A `SentenceLength` and a `ParagraphLength` were created and cleared inside the first pass,
which the committed tree cannot show either way.

**The re-review after the rebase left both compositions unmoved**, which is the useful control on the
paragraph above: the baseline itself moved, because `ratify-the-rationale-tier` had edited the article
in the meantime. Re-measured 2026-09-10 on the rebased tree against `main`'s copy in scope, the six
rows above are still the six, and `ProcedureLength` is still +1 against 13. Its one added site is item
4 of the confident-zero list — a hazard rather than a step, so exempt on the documented class. That
pass also created a `SentenceLength` and cleared it, the second time `lint-pass-regressions` did so.

### The `Contractions` delta the first two passes did not record

`Contractions` is mechanical, so a self-inflicted finding on it is worth more than one on a prompt
rule, and neither earlier pass recorded its composition. Measured 2026-09-10, baseline 3 on `main`'s
copy in scope and 4 on the landed tree:

| site                                                 | added or removed |
| ---------------------------------------------------- | ---------------- |
| the possessive on `cleaner's`                        | added            |
| the possessive on `architect's`                      | added            |
| the concurrency prohibition quoting `engineering.md` | removed          |

The two added sites are the sentence that documents the bare-possessive false positive, so they are
exempt under that class rather than under use/mention — and the article's live-example sentence said
use/mention until the re-review corrected it. The rule fires twice on three possessives, exactly as
that sentence claims, so the file is its own fixture.

The removal is a defect fixed rather than a finding cleared. `"Don't run …"` was exempt as a quotation
of `engineering.md`; `split-engineering-article` then linted that file to `"Do not run …"`, and the
quotation kept the old wording. **A quotation's exemption expires when the quoted file is worked, and
nothing reports that.** `reference-check` cannot: it resolves filenames and identifier-shaped symbols,
not quoted prose.

### What `reference-check` does and does not see in doc prose

The article claims `npm run reference-check` leaves the referent half of a citation unchecked for doc
prose, because its citation matcher never reaches the backticked form. Verified 2026-09-10 by
injecting two citations of a symbol that does not exist in `camera.ts` into `prose-linting.md`, and
running the gate. The unbackticked one reported a `cited-symbol-exists` failure. The one written the
way this corpus writes it, with each half in its own code span, reported nothing: `references.ts`'s
`CITATION_PATTERN` requires the possessive to abut the filename token, and the closing backtick sits
between them.

That matters here because the backticked form is what this corpus writes. `references.ts` records
1,448 backticked `.md` tokens against 4 link-form ones, measured on the same tree.

### Two baselines measured mid-pass

`architect.md`'s pass recorded 92 mechanical. Re-derived on `main`'s copy in scope, the figure was
**101** — 65 `SentenceLength` rather than 57, plus a `ParagraphLength`. 92 was the count after the six
worked examples had already been removed.

This repo already carried a commit titled "correct the Vale baseline, which was itself measured
mid-pass". Twice is a rule.

### The Contractions mechanism that was plausible and wrong

This entry has now been wrong twice, in opposite directions, and the second error is the instructive
one because it was written as a refutation.

**Claim 1, `8907adf`.** Vale fires on a bare possessive and not on a backticked one, "which is why the
four landed role files reached zero — they write `product`'s".

**Claim 2, `7bd7388`, offered as a refutation of claim 1.** Derived by reading
`.vale/STE/Contractions.yml`: the possessive token is `\b\w+['’](?:re|ve|ll|d|s)\b(?!\s)`, "the
`(?!\s)` is the whole story", and the peers "reached zero because their possessives are followed by
spaces, NOT because they are backticked".

**Measured 2026-09-10, vale 3.20.0, six probe sentences in one in-scope file.** Each sentence carried
one possessive on `cleaner`, varying only the backticks and the following character:

| form              | followed by | finding |
| ----------------- | ----------- | ------- |
| `` `cleaner`'s `` | comma       | none    |
| `` `cleaner`'s `` | period      | none    |
| `` `cleaner`'s `` | space       | none    |
| `cleaner's`       | comma       | fires   |
| `cleaner's`       | period      | fires   |
| `cleaner's`       | space       | none    |

So there are two independent suppressors, and each claim named one of them. Claim 1 had the mechanism
right and the attribution wrong: backticks do suppress, but the peers it cited carry **bare**
possessives followed by spaces. Claim 2 had the attribution right and the mechanism wrong: it upgraded
"a space also suppresses" into "the `(?!\s)` is the whole story", and asserted the negative.

**The negative is what the command could not support.** Reading a rule's regex tells you what the regex
matches. It cannot tell you what Vale hands the regex, because the Markdown scoper runs first and a
code span never reaches it. A refutation is a claim like any other, and this one outran the file it was
read from. The likely mechanism is that scoping; the table above is what was measured, and it stands
whether or not the explanation does.

### The shape that recurred most: a definition widened by a split

Three of the six files, and the only shape in the set that appeared in more than one. Each time, a
sentence over the 25-word cap was split at a restrictive clause, and the clause became a separate
sentence. A restrictive clause narrows the thing it attaches to; detached, it narrows nothing.

- `product.md`. The ARIA reach-around definition lost its restrictive `because` clause, so it came to
  cover any assertion on a CSS class or a pixel measurement, made for any reason.
- `orchestration.md`. The article's admission criterion lost "Those contracts were documented only on
  the receiving end", leaving a bold criterion that admits any contract a role expects the invoking
  prompt to satisfy. That widened the one file no role reviews, in the seat's own favour.
- `coder.md`. "since that's the layer property tests and mutation testing cover" became "which is the
  layer …", and `which` attaches most naturally to the wrong antecedent. A restrictive reason was
  downgraded to a non-restrictive aside.

The token-frequency diff cannot see any of these, for the same reason it cannot see the split
conjunct: the clause is still there, one sentence later. The article carries this as its own rule
rather than as a footnote to the conjunct rule, because the two fail in opposite directions — the
conjunct case makes a claim too strong, and this one makes a definition too weak.

**The direction is not uniform either, and the counter-case is in the same rollout.** `product.md`'s
VERIFY step 6 gained "in this order" in a list conversion, asserting a sequence nobody had argued.
That is an obligation the split added rather than dropped. Four regressions in one file are still four
regressions; they are not a law about which way a split fails.

### Why the token diff has to cover the pair, not the file

The rollout's passes moved evidence to a sidecar and linted in the same commit, so a file-only token
diff reads every moved sentence as a loss. Measured 2026-09-10 on `architect.md`, `so` counted over
the pre-lint file against the landed state:

| comparison                 | `so`    |
| -------------------------- | ------- |
| role file alone            | 21 → 15 |
| role file plus its sidecar | 21 → 17 |

Six apparent losses, two of which are real. A reviewer accounting for every non-zero delta on the
file-only figure spends the pass clearing four moves, which is the surest way to stop doing the check
at all.

### The `ProcedureLength` divergence, recorded rather than settled

The article says to act on a finding whose list item is a genuine step. Two of the five linted role
files classified findings as genuine steps and deliberately left them: `coder.md`, six of twenty-two,
and `product.md`, five of twenty-four. Both times the reason was the same — the remedy moves a step's
reasoning out from under the step it qualifies, and a role file is read while the step is executed.

`7bd7388` declined to settle it inside one file, on the ground that diverging in one file mid-rollout
is worse than the residual. That reasoning holds and the question is still open. It is recorded here
and flagged in the article so the next pass records its own classification rather than diverging
quietly, which is the outcome nobody would choose deliberately.

Two figures often quoted alongside this are not instances of it. `architect.md`'s 34 and
`hardener.md`'s 20 unacted `ProcedureLength` findings were classified as **statements**, not as steps,
so they are the rule working rather than a divergence from it.

## The JSDoc surface: what `lint-jsdoc-with-vale`'s review pass measured, 2026-09-10

Everything here was measured against vale 3.20.0 on the `lint-jsdoc-with-vale` branch, at the commit
that added the four `JsDoc` rules. Two corpora are named, and they are not the same list. **Tracked**
means `git ls-files '*.ts' '*.tsx' | grep -v '^src/catalyst/'`, which is 272 files. **Corpus** means
that list minus `vale-styles/`, restricted to `.ts`, which is 264 files — the `.tsx` half is out of
scope, since every rule takes the `.ts` block-comment scope.

### The exit code, re-derived at full scope

The article previously said the exit code "is 1 when a rule matched". It is not.

| what happened                     | exit |
| --------------------------------- | ---: |
| a `warning`-severity rule matched |    0 |
| an `error`-severity rule matched  |    1 |
| a file failed to parse (E201)     |    2 |
| the named path does not exist     |    0 |

The last row is the one worth keeping. A path that does not resolve is read as **stdin**: the run
reports `0 errors, 0 warnings and 0 suggestions in stdin` and exits 0. Non-interactively that returns
at once, so a mistyped path in a verification command reads as a clean tree. The tell is the words
"in stdin" where a file count belongs.

### `--no-exit` separates "cannot lint" from "found something", measured 2026-09-10

`scripts/prose-lint/run.sh` declared in its own header that it fails loudly when it cannot lint. It
did not. The `xargs vale` line discarded its status, and the trailing echo returned 0 unconditionally,
so a vale abort printed `E100` to stderr and still closed with "A zero above is a measured zero".
Found by stubbing a `vale` on `PATH` that answered `ls-config` with 0 and the lint invocation with 2.

The fix could not simply fail on any nonzero, because vale's nonzero is overloaded. Measured on vale
3.20.0, over a scratch config carrying one `warning` rule and one `error` rule:

| what happened             | exit | with `--no-exit` |
| ------------------------- | ---: | ---------------: |
| clean file                |    0 |                0 |
| `warning`-severity match  |    0 |                0 |
| `error`-severity match    |    1 |            **0** |
| runtime error (E201/E100) |    2 |            **2** |

`--no-exit` suppresses exactly the finding-driven status and preserves the runtime one, which is the
split the script's design already claimed. Every rule `.vale.ini` enables is `warning` today, so the
middle row is latent rather than live — but the flag is what keeps the script honest if a rule is ever
re-levelled to `error`, instead of silently converting it into a findings gate.

**The shell version read `xargs`' status, not vale's, and it was platform-dependent.** Measured on
macOS's BSD `xargs`: a command exit anywhere in 1-125 was reported as **1**; GNU `xargs` reported 123
for the same case. Both report 127 for a missing command. So that number was fit to test for zero and
unfit to print as vale's own, and the shell script's message named it as an xargs status for that
reason. `prose-lint-runner-is-shell-not-typescript` replaced the pipeline with a single `spawnSync`
carrying the whole path list, which removed the indirection: the status the program now reads and
prints is vale's own.

The four-row table above was re-derived on vale 3.20.0 during that slice's review, and held. The
runtime row was checked in both its forms -- **E100** for no `.vale.ini` anywhere up the tree, and
**E201** for a `StylesPath` naming a directory that does not exist. The second is the fresh-worktree
case before `vale sync`, and it fails the run at the `ls-config` probe rather than mid-lint.

### `occurrence` counts less than it looks like it counts

Three probes over one two-paragraph JSDoc block, at the `.ts` block-comment scope:

| rule                         | result                        |
| ---------------------------- | ----------------------------- |
| token `the`, `max: 1`        | two findings, counts 3 and 2  |
| token `the`, `max: 0`        | **nothing**                   |
| token `\n` or `\s`, `max: 1` | **nothing**                   |
| token `[\w]+`, `max: 1`      | two findings, counts 9 and 10 |

Two separate facts. `max: 0` never fires, so "at most zero" is not expressible. And whitespace is
gone before the counter runs, so a rendered-**line** budget is not expressible either — while a word
budget is. Both read as an enabled rule.

The same probe settles what `block` scope hands a rule: **one text unit per paragraph**, not per
comment. That is why an unflagged `^` anchors at a paragraph opener rather than at the top of a hover.

### `vale test` skips an untested rule file

A directory holding two rules, one with a `tests:` key and one without, reports
`1 file — 1 passed, 0 failed` and exits 0. The untested rule is skipped in silence. That is the
missing-fixture hazard `npm run ast-grep:rules` exists to catch, arriving in a checker that has none —
and the second reason, after the Markdown parsing of `input:`, that the fixtures here are files.

### Prettier normalises a YAML scalar to single quotes

The article said the opposite, and the advice mattered because a `tokens:` entry carrying `\b` must
not be double-quoted. Measured with this repo's own `.prettierrc.json`:

| input                           | after `prettier --write` |
| ------------------------------- | ------------------------ |
| front matter `name: "plain"`    | `name: 'plain'`          |
| front matter with an apostrophe | unchanged, double-quoted |
| YAML `a: "b"`                   | `a: 'b'`                 |
| YAML `c: "d\be"`                | unchanged, double-quoted |

So the apostrophe case is the exception that produced the original advice, and the backslash case is
the one nothing catches.

### `SelfReferentialOpener`: what each anchor costs, over the 264-file corpus

Measured with one token list, varying only the anchor, after this pass rewrote the hover in
`is-strict-equal.ts`:

| form                                 | findings |
| ------------------------------------ | -------: |
| unanchored, `ignorecase: true`       |       25 |
| unanchored, case-sensitive           |        2 |
| sentence-anchored, `(?:^\|[.!?]\s+)` |        2 |
| paragraph-anchored `^` (shipped)     |        0 |

Before the hover rewrite the sentence-anchored form gave 3. The two that survive it are boundary
statements `doc-comments.md` rule 3 protects — a module saying which half of a job is not its own —
in `gherkin-document.ts` and `useAppearance.ts`. The design pass proposed pairing the sentence anchor
with a verb list to keep the third hit and drop those two; the shipped rule takes the narrower anchor
instead, and the hit it would have kept was fixed by hand in the same pass.

### A fixture that pinned nothing, and how the review found it

`SelfReferentialOpener.good.ts` claimed to pin the anchor by carrying the same referring expression
mid-paragraph. It did not. Under a deliberately wrong `(?m)^` variant the fixture stayed **silent**,
because its referring expressions sat mid-**line**, where the two anchors agree. Reflowed so each one
opens a source line, the fixture reports twice under `(?m)^` and stays silent under `^`.

The general form is the one the article now carries: a good fixture is evidence only if it fires
under the wrong rule. The three other good fixtures were checked the same way and all discriminated —
a stemmed token list fires on `ImplementationAltitude.good.ts`, a bare-noun list fires on
`DeadIndexical.good.ts`, and an unanchored matcher fires on `BlockTagVocabulary.good.ts`.

Every token was probed individually as well: all five `DeadIndexical` entries and all six
`ImplementationAltitude` entries fire on their own, and `this passage` and `this slicer` stay silent,
so the word boundaries hold.

### `BlockTagVocabulary`'s anchor, and its one residue

`(?m)^` is per source line, and it has to be: a run of `@param` lines is one Markdown paragraph, so a
bare `^` would reach only the first of them. Measured on a block whose banned tag sat between two
legitimate ones.

The residue is a bare at-rule that **opens** a source line — `@supports` at a line start reports as a
block tag, because nothing in the text distinguishes the two. A backticked at-rule is silent, since
Vale skips code spans; an at-sign inside prose mid-line is silent because of the anchor. Zero
instances on the tracked list, and the remedy is the backticks this repo already writes.

### The three exemption sections reach nested paths

Bait carrying all four violations was written below each exempt path rather than directly inside it —
two levels down in a Stryker sandbox and in a nested checkout under `.claude/worktrees/`, one level
down under `vale-styles/fixtures/` — with an identical control file at the repo root. The three exempt paths reported **nothing** and the control reported **four**
findings, one per rule. So `*` crossing `/` holds for a section glob, and the exemptions are not
merely top-level.

### `vale sync` does not always target the last `StylesPath`

A package can redirect it. `vale-llm-slop` ships `.vale-config/0-vale-llm-slop.ini` declaring
`StylesPath = styles`, so a re-sync in a checkout that already has the package writes to
`.vale/.vale-config/styles` rather than to `.vale/`. Both copies exist in this checkout after one
`vale sync`. Harmless while they are the same package, and worth knowing before reading a stale style
as the live one.

### The per-rule extension ruling, and the two cross-tabulations behind it

The design pass ruled on 2026-09-10 that each rule declares the extensions where its own premise
holds. It cross-tabulated every `.tsx` finding by rule and by comment kind, over the rule set as it
stood then:

| rule                     | JSDoc | JSX | plain `/* */` |
| ------------------------ | ----: | --: | ------------: |
| `NoThisFunction`         |     1 |   0 |             0 |
| `ImplementationAltitude` |     1 |   0 |             0 |
| `MeasurementInDoc`       |     1 |   3 |             0 |
| `ThisSlice`              |     0 |   0 |             0 |

All the noise was one rule, and its three hits were inverted. `LifeBoard.tsx` carried a measurement
inside a `{/* ... */}` block, which is the implementation channel for markup, so the measurement was
correctly placed and flagging it inverted the rule. `MeasurementInDoc` was the rule that lost `.tsx`,
and it never shipped.

The REVIEW pass re-ran the same cross-tabulation on 2026-09-10, over the four rules that did ship and
over the 31 tracked components. `src/components/GridToolbar.tsx` was restored to its pre-widening
state first, so the corpus was the one the widening met:

| rule                     | `.tsx` findings | JSDoc | JSX | plain `/* */` |
| ------------------------ | --------------: | ----: | --: | ------------: |
| `SelfReferentialOpener`  |               0 |     0 |   0 |             0 |
| `DeadIndexical`          |               0 |     0 |   0 |             0 |
| `ImplementationAltitude` |               0 |     0 |   0 |             0 |
| `BlockTagVocabulary`     |               1 |     0 |   1 |             0 |

The shape repeated exactly: all the noise is one rule, and its one hit sits in a JSX comment.

**`BlockTagVocabulary` keeps `.tsx` anyway, and the discriminator is what makes that consistent.**
The earlier table grants `.tsx` to `ImplementationAltitude`, which the ruling names as
premise-carrying. So the premise alone never decided it. What decided it was measured noise that no
remedy can clear without moving correctly-placed prose. `MeasurementInDoc`'s three hits were of that
kind. `BlockTagVocabulary`'s one hit was not: the remedy was a backtick around a CSS at-rule, and
`src/hooks/useAppearance.ts` already backticked the same at-rule before this slice began. Traced with
`git log -L`, the backticks there landed in `no-undated-cross-file-claims` and survived
`migrate-module-depth`. So the remedy is a typographic convention the repo holds independently, not a
concession invented to clear a finding.

**Two figures bound the trade.** Eleven of the 31 tracked components carry a `/** ... */` block, which
is what the `.tsx` scope buys the rule. Six carry a `{/* ... */}` block, which is where its residue
lives. Dropping `.tsx` would blind the rule on the first set to spare the second.

**Reopen this if a later corpus produces two or more JSX hits, or one that a backtick cannot clear.**
That is the ruling's own discriminator, not a fresh judgement.

### Three Vale mechanics measured on 3.20.0 while enforcing that ruling

**Brace expansion in a section glob is real, and a glob matching nothing fails closed.** Measured over
the eight fixtures, counting `JsDoc` findings: `*.ts` gave 4, `*.tsx` gave 4, `*.{ts,tsx}` and
`*.{tsx,ts}` gave 8, `*.ts*` gave 8. The negative controls matter more. `*.{ts,zzz}` gave 4, so the
alternation genuinely selects. `*.{qqq,zzz}` gave 0, so an unmatched glob applies no style rather than
falling back to everything.

**A malformed brace glob is an eighth way to report a confident zero.** `*.{ts` gave 0 findings and
exit 0, with no diagnostic. It is the same shape as "the file matches no section glob", reached
through a typo in the section header rather than through a file's path.

<!-- reference-check: allow text.comment.block.ts -- a Vale scope selector, not a path; the trailing segment is the extension the scope binds to -->
<!-- reference-check: allow text.comment.block.tsx -- the same selector, bound to the other extension -->

**A `scope:` list is OR, confirmed independently of the shipped rules.** A throwaway style carrying one
`existence` rule was run four ways over the two `SelfReferentialOpener` bad fixtures.
`text.comment.block.ts` reported the `.ts` file only. `text.comment.block.tsx` reported the `.tsx`
file only. The two as a list reported both.

**The bare `text.comment.block` selector also reports both, and it is rejected.** It reaches every
extension at once, which moves the extension decision out of the rule and into `.vale.ini`'s section
glob. That is precisely what the per-rule ruling forbids, so the list form is the one to write even
though the bare form is shorter.

### `block` scope never sees a single-line `/** ... */`, measured 2026-09-10

The over-reach half of the scope story is recorded above: `block` means multi-line, so it takes JSX
and plain `/* ... */` blocks too. The under-reach half went unrecorded through the whole slice.

Measured against the shipped `JsDoc` style, on one file carrying the same sentence twice — once in a
single-line `/** ... */` and once in a three-line block:

| where the sentence sat   | `SelfReferentialOpener` |
| ------------------------ | ----------------------- |
| single-line `/** ... */` | silent                  |
| multi-line `/** ... */`  | fired                   |

Nothing else differed. So every rule in the style carries this blind spot, and no scope selector
closes it: `line` would reach the one-liners and every `//` comment with them, which is the untriaged
backlog that shape of change is not allowed to create.

**The census, on the 264-file `.ts` corpus this sidecar already defines**: 49 single-line `/** ... */`
blocks against 277 multi-line ones, spread over 22 files. So roughly one JSDoc block in seven is
outside every rule the style ships.

The design pass recorded 53 single-line blocks with 14 carrying a contraction, over a 104-file corpus
defined by a different command. The two are not comparable and the earlier pair is superseded rather
than refuted. The contraction half is not re-derived here, because `STE` does not run over `.ts` at
all today — that is slice 2's surface.

### The two list-scoped `STE` rules reach a JSDoc, and a tag line defeats them

Measured 2026-09-10 on one `.ts` file, with `STE.ProcedureLength` and `STE.OneInstruction` re-levelled
to `warning` over a comment carrying the same over-length "and then" chain twice:

| where the chain sat  | `ProcedureLength` | `OneInstruction` |
| -------------------- | ----------------- | ---------------- |
| a Markdown list item | fired, 22 words   | fired            |
| a `@param` tag line  | silent            | silent           |

So the answer to the design pass's open question is yes for a list and no for a tag block, and the
corpus zeros for both rules are a fact about this repo's JSDoc rather than about reachability.

**Two calibration notes, because both probes first read as refutations.** `ProcedureLength` fires
above 20 **counted** words, and Vale's count ran one below the raw word count on both fixtures, so a
21-word item is silent. And a comment-scoped `existence` rule fires with no `[formats]` mapping while
a `scope: sentence` rule does not, so a single-rule probe cannot tell a missing mapping from a working
one. Each probe needed its own control before its zero meant anything.

### `extends:` is real style inheritance, and a child's key replaces the parent's

A rule may name another style's rule as its parent. The design pass measured the mechanism and
declined to use it; nothing in the tree uses it today, and the `extends: existence` lines in
`vale-styles/JsDoc/` name a rule **type** rather than a parent rule.

Re-measured on Vale 3.20.0, 2026-09-10:

| probe                                                        | result                                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| a child naming `STE.SentenceLength` and adding only `level:` | fires, reporting under its **own** name — so a child is a rule, not an alias |
| a child naming a style that is not on the search path        | **E201, exit 2**, quoting the offending line, whole run aborts               |

**The hazard, and it is the reason inheritance is not free.** A child key **replaces** the parent's,
it does not merge. Measured with one `.ts` file holding a two-sentence hover, each sentence about
eighteen words and so both under the 25-word cap:

| the child rule                             | result                                  |
| ------------------------------------------ | --------------------------------------- |
| scope inherited from the parent            | silent, as both sentences pass          |
| the same child, plus a comment-block scope | **one finding, "Sentence is 39 words"** |

Adding the comment scope destroyed the parent's `scope: sentence`, so the counter ran over the whole
block while the message still said "Sentence". That is not a confident zero. It is a **confident wrong
number**, which is worse, and it is the shape a JSDoc sentence-length rule would take on the obvious
first attempt.

**This first read as a refutation**, because the first fixture held one long sentence in one block,
where per-sentence and per-block counts coincide. A single-sentence probe cannot discriminate.

**The E201 row is what rules `extends:` out of this repo's style**, independently of any parent's
merits. A tracked rule with an inherited parent makes a synced `.vale/` a hard precondition for
loading **any** rule, and the fixture harness exists precisely because it needs none: it runs in a
fresh worktree before `vale sync`.

### `Packages = Std` was measured and declined for slice 1, 2026-09-10 -- RE-OPENED 2026-09-10

**Status: re-opened by the user, same day, and the decline no longer binds.** Read what follows as the
measurement that informed a slice-1 scoping decision, not as a closed decision. The re-evaluation is
`ideas/candidates/mechanise-prose-soundness-with-a-style-package.md`, which widens it to `Google` and
`Microsoft` as well.

The four reasons below were written as reasons to decline. Three of them survive as **findings about
the package**, and that is how to use them -- inputs to the new evaluation. Two argue for a shape
rather than against adoption: reason 2 forbids enabling wholesale and says nothing about enabling a
rule by name, and reason 3 is a configuration fact with a known fix whose cost was judged against
slice 1's purchase rather than Wave 1's. Reason 1 is the substantive one and is the thing to test.

The sentence "the first three do not rot" below was too strong. The _findings_ do not rot; the
_ruling_ built on them did, within a day, because what the repo wanted from a style package changed.

`vale-cli/Std` is 14 rules in six namespaced directories, covering abbreviations, date and time
formats, two grammar rules, three punctuation rules, readability, and four usage rules. It is not
installed here and no `Packages` line names it.

Four reasons as originally written, retained verbatim:

1. **Nothing in it speaks to this style's premise.** The repo's own rules encode `doc-comments.md`
   invariants — interface altitude, opener form, tag vocabulary, dated-record vocabulary. Its 14 are
   general English style, so there is no parent worth inheriting from.
2. **Its `Contractions` rule inverts the house rule.** It is a `substitution` rule from Microsoft
   style, swapping `are not` to `aren't` and `cannot` to `can't` — the opposite of what
   `STE.Contractions` asks for. A wholesale `BasedOnStyles = Std` enables it.
3. **All 14 ship at `suggestion`** against this repo's `MinAlertLevel = warning`. Enabled as shipped
   they are silent and look enabled. Re-levelling each by name is 14 lines, so declining the package
   is cheaper than adopting it even before anyone reads a finding.
4. **The `.vale/` precondition above**, which any `extends:` into it would create.

The design pass ran all 14 over its own corpus at `MinAlertLevel = suggestion`. **Those counts are
superseded and are not restated here**, because that corpus was defined by a command that no longer
describes anything in this tree. What survives is the ranking it produced, which is a fact about the
rules rather than about the corpus: two readability rules duplicate `STE` equivalents and count
differently, an acronym rule fires on `AST` throughout, and the remainder either invert the house rule
or fire on legitimate technical prose.

**Two were declined on the landing constraint rather than on merit** — a Latin-abbreviation rule and
two first-person usage rules. Each would land a backlog nobody has triaged, which is what that
constraint forbids. They stay legitimate candidates for a slice that pairs the rule with its
remediation.

### Why the running is a script and not an editor hook, researched 2026-09-10

The design pass asked who runs Vale and when, and ruled **two mechanisms, because the surfaces
differ**. Only one of the two landed. `npm run prose-lint` covers everything; the hook half was
researched, and installing a plugin is a user action this slice could not perform. The research is
recorded here so the decision is not re-taken from scratch, and so nobody reads the missing half as an
oversight.

Measured against `vale-cli/agent-tools` and `vale-cli/vale-ls` on 2026-09-10, by reading the shipped
hook script and running it directly.

**The hook cannot reach a code comment at all.** It hard-filters to markup extensions — Markdown,
AsciiDoc, reStructuredText, Org and plain text — and exits 0 on anything else **before** consulting
any config. Proven by running it against a `.ts` and a `.md` file carrying an identical
`error`-level finding: the `.md` fired with a full alert and the `.ts` was silent. That filter is the
whole reason the ruling needs two mechanisms rather than one.

**Three traps, and two of them produce a silence that reads as installed.**

| trap                                                                        | consequence                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| its level defaults to `error`, and this repo levels every rule to `warning` | installed as shipped it is **silent forever and looks installed**. It needs its level option set to `warning`             |
| it exits 0 when its output template is missing from beside it               | a first probe was silent for **both** files for this reason, which would have given the right answer for the wrong reason |
| its companion rule-authoring tools are behind a paid subscription           | see below                                                                                                                 |

The second trap is the same control-first discipline the fault-injection rules elsewhere demand: the
control has to fire before a silence means anything.

**The third trap is the one that could retire the fixture harness by mistake.** The project's
companion server offers rule scaffolding, rule testing and style auditing — the tools that read as
exactly the harness this repo built by hand. They require a paid Vale subscription. So the
build-it-ourselves ruling stands with a **named alternative rejected on cost**, rather than never
considered. Anyone who finds those tools and concludes the hand-built fixtures were redundant should
read this row first, then the `vale test` sections above, which rule out the free runner on separate
grounds.

**`vale-ls` was declined.** Its documented capabilities are editor ergonomics: hover documentation,
`StylesPath` autocomplete, document links and click-to-fix code actions. Agents do not drive an
editor, and they get the same diagnostics from `--output=JSON`. Its page does not say whether it
handles source-code comments at all, so even the one plausible gain — autocomplete while authoring a
rule — is unverified.

**One idea from the hook is worth stealing and has not been taken.** It anchors on the file's own
config by walking up from the file rather than trusting the working directory, because a path-scoped
section never matches otherwise. `npm run prose-lint` resolves its file list from the repo root
instead, which is correct for the way this repo invokes it and would not survive being run from a
subdirectory.

**What the hook does not solve, if it is ever adopted.** It fires on an agent's edits only. It covers
no human edit, no CI run and no deliberate audit. So it would narrow the question rather than close
it, and the script would still carry the rest.

### Why two `StylesPath` lines are safe, measured 2026-09-10

`.vale.ini` lists `vale-styles` then `.vale`, and that one ordering does two jobs: lookup is
first-wins, so the tracked style takes priority, and `vale sync` targets the last path, so it keeps
writing where `.gitignore` already points. The whole `JsDoc` style rests on Vale accepting a repeated
key, which its documentation does not describe. **That is worth an argument rather than a shrug, and
the argument is that the failure is loud.**

| probe                                                         | result                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| two `StylesPath` lines, `JsDoc` named by a section            | resolves from the **second** listed path while the first is searched too |
| **the last-only future simulated** — only `.vale` on the path | **E100, `style 'JsDoc' does not exist on StylesPath`, exit 2**           |
| comma-joined `StylesPath = A, B`                              | **E201, exit 2** — read as one path containing a comma, not as two       |

Row 2 is the one that matters. If a later Vale ever takes the last key only rather than accumulating,
`BasedOnStyles = JsDoc` aborts the run instead of reporting a confident zero. So the undocumented
behaviour fails **safe**, and the version pin is a convenience rather than the only thing holding this
up. Row 3 rules out the form somebody will reach for first.

**Row 3's exit code took two runs to get right, and the first one was wrong in this repo's own
documented way.** Piping the output to `head` reported exit 0, because a pipe replaces the exit status
with the pipe's. Redirect to a file and read `$?` on the next line, exactly as the merge protocol says
for `npm run mutation-invariance`.

## Moved out of the article when it was reduced to instructions, 2026-09-10

The user ruled on 2026-09-10 that `prose-linting.md` carries instructions and this sidecar carries the
explanation. Five passages had no home here already and were moved rather than deleted. The rest of
what left the article that day was a restatement of something recorded above, or in `CLAUDE.md`'s
routing branch 5.

### The `ProcedureLength` classification on a rules article

Measured on `engineering.md`: **56 findings, 56 statements, none acted on** — rule-with-rationale
bullets, the four test-layer definitions, the per-role command substitutions, and the standing
verification obligations. That is the measurement behind the article's instruction to classify an
article's bullet convention once rather than reaching the same verdict 56 times.

The role-file half of that instruction rests on the five role files linted under `lint-the-role-files`.
Two left genuine steps unacted on purpose, because the remedy separates a step's reasoning from the
step it qualifies. The divergence is recorded rather than settled; see "The `ProcedureLength`
divergence, recorded rather than settled" above.

### The `is sanctioned` construction, and how often it has paid

Three instances have been found by the grep the article gives, in three different articles. That is the
whole of the act-on class for `PassiveVoice` so far, and it is why the article offers the grep as a
shortcut into the class rather than as a replacement for the pass.

Four residuals fitting none of the five exempt classes were left in `doc-comments.md` deliberately, as
genuinely arguable. They are the reason the article says to act on such a case or name it in the commit,
rather than to widen a class.

### The whole-directory count, measured 2026-09-09

After `lint-the-role-files` widened the scope, `vale .claude/agents/` reported over a thousand findings,
and most of those files had never been worked. The role files were the whole of the newly scoped
surface and none had been worked. That figure is what the article's "read a big number as unworked"
instruction is derived from; the figure itself dates and the instruction does not.

### The two typo-shaped confident zeros, and the controls that pinned them

**A misspelled re-levelling line.** `STE.ProcedureLenght = warning` was measured against the correct
spelling on the same file. The correct spelling fired; the misspelling enabled nothing, disabled
nothing, emitted no diagnostic and exited 0, leaving the rule at its shipped `suggestion` level.

**A nonexistent scope selector.** The same rule that fired under `text.comment.block.ts` reported
nothing under `text.comment.documentation.ts`, with no diagnostic and exit 0. There is no documentation
scope, and Vale does not say so.

<!-- reference-check: allow text.comment.documentation.ts -- a Vale scope selector that does not exist, named here as the measured negative control; not a path -->

### The rule names the first cross-tabulation uses

The design pass wrote its table under earlier names. `NoThisFunction` became `SelfReferentialOpener`,
`ThisSlice` became `DeadIndexical`, and `MeasurementInDoc` never shipped. `BlockTagVocabulary` arrived
after that ruling and was ruled separately, in the REVIEW pass. Read the first table in "The per-rule
extension ruling" above through that mapping.

Each shipped rule records its own extension answer in its own header, in `vale-styles/JsDoc/`. The
article carried a fourth copy of those answers as a table; the headers and the two cross-tabulations
above are the record.
