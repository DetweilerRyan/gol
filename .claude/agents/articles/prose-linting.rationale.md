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

## The style ships twelve rules. Four are on.

| rule              | on? | findings on `doc-comments.md` | why                                                    |
| ----------------- | --- | ----------------------------: | ------------------------------------------------------ |
| `SentenceLength`  | yes |                        29 → 0 | mechanical, no judgement needed                        |
| `ProcedureLength` | yes |                        12 → 6 | ~2 of 12 genuine; the rest are its declared over-count |
| `OneInstruction`  | yes |                         2 → 0 | ~50% precision corpus-wide; one class is dangerous     |
| `PassiveVoice`    | yes |                       26 → 22 | ~4 of 26 genuine; five exempt classes are enumerable   |
| `Gerunds`         | no  |                            65 | volume; 941 corpus-wide, unread                        |
| `Dictionary`      | no  |                             7 | not ASD's wordset — see below                          |
| `Modals`          | no  |                             4 | would do damage — see below                            |
| `NounClusters`    | no  |                             2 | fails its own example — see below                      |
| `Contractions`    | yes |                         3 → 1 | mechanical; the 1 left is a quotation                  |
| `Ambiguity`       | no  |                             2 | slash token false-positives — see below                |
| `Articles`        | no  |                             0 | nothing to learn here                                  |
| `ParagraphLength` | no  |                             0 | nothing to learn here                                  |

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

**`OneInstruction`.** 12 findings corpus-wide across 8 files, 2 on `doc-comments.md`. Six were read by
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
file and get a comparable result, not a sensibility. Measured against it, only `SentenceLength` clears
the bar. The other three enabled rules are prompts a person reads, and they are documented as such rather
than promoted.

That is the finding this whole exercise produced, and it is narrower than the candidate assumed: **the
mechanically enforceable subset of STE on this corpus is one rule.** Everything else needs a reader.
