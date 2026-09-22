---
name: a-lead-count-disagrees-with-the-list-it-heads
title: Probe whether a lead count disagreeing with its own list is detectable
created: 2026-09-22
---

Recommended by `coach` REVIEW on `slice/a-reader-finds-a-sidecar-without-an-inventory`,
2026-09-22, after `editor` CLEAN and `editor` AUDIT each found an instance independently. Both
were verified pre-existing on `main`.

## Situation

`claim-discipline.md` rules that a count standing beside its own complete enumeration **fails
loudly**, and tolerates that form for exactly that reason: a reader can check the numeral against
the list in the same breath, and a drift makes the sentence visibly self-contradictory.

The rule's tolerance rests on somebody looking.

## Complication

**Two live instances, in two articles, neither caught until a slice happened to read those files
for another purpose.**

`ast-grep-rules.md` heads five bullets with "Four things that make a rule inert, all of them
measured". Verified 2026-09-22: the heading and the same five bullets are byte-identical on
`main`.

`engineering.md` names five gating checkers, describes them in four bullets, and closes "Do not
generalize 'the `scripts/` tools are advisory' to any of these four." Read literally,
`vale-fixture-check` falls outside a prohibition written to cover it.

**The loud form failed silently in both cases.** The numeral and the list sit adjacent, exactly as
the rule's tolerance assumes, and both survived every gate, every `prose-lint` run and every role
that read those articles on its own triggers.

**One of the two is self-aware about the failure mode.** The paragraph immediately above
`engineering.md`'s instance reads: "It counted seven when eight had landed, so count the
directories under `scripts/` rather than trusting a figure in prose." The article warns about the
defect and then commits it four lines later.

**Nothing mechanical reaches this.** `prose-lint`'s enabled rules read sentence length, paragraph
length, contractions, list markers and the verb after a connective. None counts list items.
`agent-doc-check` asserts binary facts about scripts, frontmatter, retired roles, cycle strings
and rule documentation. None reads a numeral.

## Question

Is a number word immediately heading a list of a different length mechanically detectable — by a
Vale rule or a `scripts/` check — and is the detector worth what it costs?

## Answer

A spike, because the answer may be no and nobody has measured it.

**The probe.** Establish the true rate first: sweep the corpus by hand for the shape and count the
instances, so a detector has something to be measured against. Then try the cheap mechanism — a
Vale rule matching a cardinal followed by a list — against that set, and record its false
positives as well as its catches.

**The false-positive surface is the reason this is not obviously an enabler.** A cardinal before
a list is not always a census of it. "Two levels and no more" is a constraint. "Three of the
twenty import nothing" counts a subset deliberately. A purely syntactic matcher cannot tell those
from a lead count, and `claim-discipline.md`'s own exempt classes are semantic.

**`orchestration.md` binds the first step: search for an existing tool before proposing to build
one.** Vale has a substantial rule ecosystem, and a count-versus-list check may already exist.

**A negative answer is a real deliverable.** The corpus already carries decisions of exactly that
shape, written down so nobody reopens them annually.

## No-gos

- **Does not fix the two known instances.** Those are prose repairs, cheap either way, and they
  belong with whoever next opens those articles. The durable half is the guard.
- **Builds nothing.** If the answer is yes, the rule belongs to `architect` and the checker to an
  `enabler-technical`, either way as its own slice.
- **Does not re-open `claim-discipline.md`'s tolerance for the form.** The rule is right that the
  form fails loudly. This asks whether anything is listening.

## Open questions

- **Does the shape extend past cardinals?** `apply-the-census-count-rule-everywhere` records that
  an ordinal is a census form the rule does not name — "a ninth checker", "an eighth checker" —
  and that a reader hunting numerals will not see those. A detector that reads only cardinals
  would miss a class the corpus already knows about.
- **Is the true rate worth knowing on its own?** Two instances found by accident in one slice
  suggests more. If the hand sweep finds a dozen, that is an argument for the detector; if it
  finds two, the honest answer may be that the form is rare and the tolerance is fine.
- **Would a detector reach the sidecars?** Both known instances are in linted articles, but
  `*.meta.md` is exempt from every Vale rule by design, and a count can drift there too.
