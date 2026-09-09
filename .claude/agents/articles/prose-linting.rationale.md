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
