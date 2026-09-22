---
name: prose-md-has-an-untriaged-interior
title: Triage prose.md's interior — an undocumented style, two fail-open counts, a live census
created: 2026-09-22
---

Found by `editor` AUDIT on `slice/a-reader-finds-a-sidecar-without-an-inventory`, 2026-09-22,
and ruled the highest-priority item in that slice's closing review. Every finding below was
verified pre-existing on `main`, so none is that slice's regression. They surfaced because AUDIT
read `prose.md` against `.vale.ini` to check a wording constraint, which nothing routinely does.

`prose.md` is the article every prose question in the corpus routes to.

## Situation

Five defects sit inside one article. Two of them fail open.

**The `Claim` style is enabled and documented nowhere.** Measured 2026-09-22: `.vale.ini` carries
**26** `Claim.` enable entries, reaching the agents, skills, references, `CLAUDE.md` and `src/`
tiers. `prose.md` contains the string `Claim` **zero** times. `CLAUDE.md` asserts of that article:
"`Claim` matches the fingerprinted claim forms. The article carries their fixture run." It does
not.

**Both rule-editing place-counts are wrong against the config.** The article states that enabling
an `STE` rule is a seven-place edit across three enabling sections. Live: five enabling sections,
nine places. It states that adding an `Instruction` rule is a seven-place edit with one enabling
key and five off-by-name entries. Live: two enabling keys and six off-by-name entries. The
references tier is missing from both lists.

**A live census names the wrong population.** The article describes Vale's reach as
`.claude/agents/**/*.md` — "every topic article, the house-rules articles, and the five role
files". Eight agent files exist. The three process-role files are the omission, which is the
family that authors process change.

**The skill-tier style roster is short by one style**, omitting `Claim` from what a skill file
gets.

**One clause is ungrammatical.** "whose a duty is" in the bullet on facts about another role's
file. That one is being repaired in-cycle by the slice that found it, as its amendment 3 item C3,
so it is recorded here only so the list is complete.

## Complication

**Two of these fail open rather than loudly, and that is what ranks this item.** An `architect`
following either place-count enables a rule that is silently off on two whole tiers, or live on a
tier it was never scoped to. Nothing reports the gap: `vale-fixture-check` asserts that a style is
wired into `fixtures.vale.ini`, not that the article describing it is accurate.

**The `Claim` gap strands a reader mid-task.** Every read trigger in the corpus sends a role
hitting a Vale finding to `prose.md` to learn what the rule means and which classes are exempt. A
role hitting `Claim.AudienceRoster` arrives and finds nothing. The article's own table heads "The
six enabled rules, and what to do with each" — a roster omitting three live enabled rules.

**The article's own authoring convention requires what is missing.** It states that adding an
`Instruction` rule is a multi-place edit whose places include "this article's own rule section
above". The `Claim` style was added without that step and nothing noticed.

**The counts are censuses of external state**, which `claim-discipline.md` names as the class to
drop in favour of the enumeration. So the repair is not only to correct the numerals.

## Question

What does `prose.md` owe a reader who arrives at it from a Vale finding or to edit a rule — and
which of these five is a wording repair against which is a missing section?

## Answer

Shaped, not specified.

The `Claim` half needs a rule section written from the style's own three rules, their scope, and
their exempt classes — which means reading `vale-styles/Claim/` rather than inferring from
findings. **That half reaches `architect`**, who is the only role that authors or changes a
tracked style, and who would rule what each rule's exempt classes are.

The two place-counts want re-deriving against `.vale.ini` and then writing in a form that cannot
drift — the enumeration without the numeral, per the census rule.

The census and the roster are one-line corrections once the count is taken.

## No-gos

- **No change to any `vale-styles/` rule.** This documents what is enabled; it does not re-level,
  narrow or widen anything. A tension found while writing goes to `architect` as a finding.
- **Does not repair the ungrammatical clause.** The slice that found it is fixing it in-cycle.
- **Not a sweep of the whole corpus for stale counts.** Two further instances are known in other
  articles and belong to the spike that asks whether the shape is detectable at all.

## Open questions

- **Does this need `architect` alongside the process pipeline, or two slices?** The `Claim`
  section needs a ruling only `architect` can make, but an `enabler-process` cycle has no
  `architect` pass. Running one outside the declared cycle is the improvisation the pipeline
  exists to prevent, so the honest options are a two-slice sequence or an amendment to the cycle.
- **Is the six-rule table's frame still right?** It heads "The six enabled rules" over a corpus
  that now enables at least nine. Correcting the numeral keeps a census; dropping it needs the
  table to carry the enumeration, which it already does.
- **How was `Claim` added without its article section?** The convention naming that step is in
  the same article. Whether the step was skipped or the convention postdates the style is
  unmeasured, and the answer decides whether anything needs strengthening beyond the prose.
