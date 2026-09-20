---
name: no-vale-rule-reaches-the-assessment-record
title: Lint the assessment record while it is still mutable, in the ideas lane alone
created: 2026-09-20
---

## Situation

The assessment record is a new board artifact: a judge writes it beside an idea, a human rules
on it, and a promotion freezes it. It is prose that a retrospective reads months later, and
`claim-discipline.md` binds it the way it binds every other record.

## Complication

The board carries one Vale rule, and it is structural rather than register. That is right for a
candidate, which is raw by definition, and it leaves the record with nothing mechanical behind
the forms a judge is most likely to break — an unmeasured majority above all.

Enabling a rule over the whole board would be worse than nothing. A record freezes at promotion,
so a finding on a promoted record cannot be cleared without breaking the immutability rule, and
a standing lint would accumulate findings nobody may fix.

`coach` recommended the enable on 2026-09-20 and then found that this pipeline cannot execute
it. Two reasons were measured that day, each sufficient alone. Every role attribution on the
Vale config names `architect`, and the write-time prose hook's scope test accepts only the skills
and references surfaces, so it refuses a board path whatever the settings send it.

## Question

Which rules reach a record that is mutable in one lane and frozen in the next, and what has to
change for a finding to arrive while it can still be fixed?

## Answer

Shaped, not specified, and both halves are `coach`'s recommendation rather than a ruling.

Scope the enable to the ideas lane alone. A section matching the record there, placed after the
board section, leaves a promoted record matching only the existing board rule. Immutability is
then answered by the glob rather than argued away: a finding exists exactly where it is
clearable.

The three `Claim` rules are the recommendation, at warning. The unmeasured-majority rule is the
one likeliest to fire on judge prose. The register families wait for a corpus of roughly ten
records, since the landing constraint forbids enabling over a backlog nobody has read.

The second half is reach: the write-time hook delivers a finding to the agent that made the
edit, which for a record is the judge itself, and its scope test has to admit the lane for that
loop to close.

Depends on `assessment-records-die-with-the-conversation`, which creates the surface. Nothing
here can be measured before a record exists.

## No-gos

- No enable over the promoted lane. A frozen record with an unclearable finding is the outcome
  this whole shape exists to avoid.
- No register families on the first pass. They wait for the corpus.

## Open questions

- Does the enable belong with the hook's reach in one item, or are they separable? The config
  edit alone leaves the loop open at the write moment.
- Which role owns each half? The Vale config reads as `architect`'s by practice, and the hook is
  a tested-tier program, so one item may span two owners.
- Is a record in the promoted lane better served by a rule that fires at the move, rather than by
  no rule at all?
