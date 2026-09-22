# Retro intake — `a-reader-finds-a-sidecar-without-an-inventory`

By the orchestrating seat, 2026-09-22, at the merge. Findings the cycle produced that no
candidate already carries. The six candidates this slice filed are listed at the end so the
retrospective does not re-file them.

## The seat's own errors, five of one kind

**P1 — the seat kept doing a downstream pass's job.** Three instances, all the same shape:
instructing `coder` to run `cleaner`'s gates; sorting `editor`'s findings into dispositions and
putting that sort to the user before `coach` REVIEW had ruled them; and naming `coach` REVIEW as
the next step, skipping `editor` AUDIT. The user caught each one.

**The durable form: the seat synthesises the next move instead of letting the defined pass
produce it.** The pipeline exists to stop one agent being author, reviewer and adjudicator at
once, and the seat is the one participant with no role file telling it to stop.

**P2 — the seat relayed two subagent figures without re-deriving them, and both were wrong.** It
passed `editor` AUDIT's "at least two checks are neither restated nor counted" to `coach`, which
overturned it: the sentence lists exactly four and the next sentence disclaims completeness. It
also told `writer` to expect `reference-check` to fall on a deletion whose text carried no
filename token, because an earlier item had already removed it. `writer` followed the amendment
rather than the prompt, which was the correct order of authority.

`orchestration.md` already states this rule — "Restating a subagent's figure propagates its error
under your name." It was read and not applied.

**P3 — the seat's own measurement instruments under-reported three times in one session.** A
backtick-anchored grep missed dotted-path tokens. A basename grep missed sidecars named by stem.
`git log -1 -- <path>` was used to find which commit added a file, where `--diff-filter=A`
answers that question. Each produced a number that went into a board file before being caught.

**The durable form: an instrument that under-reports produces a confident wrong number, not an
error.** The corpus has a whole vocabulary for this on tools it owns — the confident-zero list in
`prose.md` — and none for greps the seat writes in the moment.

## Corpus contradictions this cycle surfaced

**P4 — `pipelines.md`'s amendment re-entry omits `editor` AUDIT, and P14 says AUDIT is
load-bearing.** The re-entry text names CLEAN then `coach` REVIEW. The parent slice's retro
recorded P14 — that AUDIT is the pipeline's only independent reading of a cited rule, because
`coach` REVIEW reviews text `coach` authored. Both are live text and they disagree.

**Measured on this slice: AUDIT paid out twice.** It falsified A10's discriminator after two
`coach` passes read past it, and it falsified B1's reach after `writer` and `editor` CLEAN had
both checked it. The user ruled AUDIT in twice and then made it a standing rule.

**P5 — `hardener.md`'s stage 6 does not state its prerequisite.** `npm run crap4ts` exits 3 with
"No coverage data found" in a checkout that has not run coverage, and `coverage/` is gitignored
and per-worktree. On the slice gate this read as a stage failure until `npm run test:coverage`
was run first. On the integration gate the coverage happened to be present and fresh, so the same
stage passed straight through. **A prerequisite that only bites in a fresh worktree is one the
stage list should name.**

**P6 — the stage 5/6 test-count reconciliation is structurally unavailable under the
mutation-invariant exemption.** That arithmetic subtracts against a Stryker dry-run count, and
the exemption means no Stryker run happened. Both `hardener` invocations reported this rather
than letting stage 6's number stand as reconciled. **`hardener.md` states the arithmetic as a
standing check without naming the one sanctioned case where it cannot run.**

## Two method lessons, both earned rather than asserted

**P7 — an amendment's own check table must count its own file.** Amendment 3 predicted
`prose-lint` would read 586 and stated "this amendment adds none". It read 587, because
`backlog/**` is in `prose-lint`'s tracked list and `amendment-3.md` is itself the added file.
`coach` ruled the error its own. The general form: a check table written inside the artifact it
describes has to include that artifact.

**P8 — a token-grep cannot find a rule that states its subject in words.** `editor` AUDIT swept
for `.meta.md` tokens, newline-collapsed, and concluded a prohibition had lost coverage. `coach`
overturned it by finding a destination-agnostic sentence four blocks up in the same section —
`prose.md`'s "A sidecar carries no read trigger, and that is the point" — which contains no
`.meta.md` token and so was invisible to the sweep. **The seat verified the sentence is
byte-identical on `main`.** The method that found three defects across two AUDIT passes has a
blind spot exactly where a rule is stated in prose rather than in tokens.

## What the cycle cost, measured

Four `writer` passes, five `editor` passes, four `coach` REVIEWs, two `hardener` gates, three
signed amendments, eighteen paths landed. Two `editor` passes returned empty diffs, which is the
success mode for that mode and not waste.

**The amendment count is the number to weigh.** The user's stated reason for the two brake slices
earlier in this session was that enabler-process cycles spawn more work with each one. This slice
ran three amendments. Each was triggered by a finding the previous pass could not have made, and
each was authored by `coach` and signed by the user — so the mechanism worked as designed. Whether
three is the mechanism working or the mechanism failing to converge is the retrospective's
question, not this file's.

## Filed already — do not re-file

`vale-ini-does-not-reach-four-prose-surfaces`, `is-the-sidecar-placement-rule-checkable`,
`an-absolute-path-write-crosses-checkouts`, `prose-md-has-an-untriaged-interior`,
`a-lead-count-disagrees-with-the-list-it-heads`, `a-stopping-condition-is-scoped-to-the-diff`.

Two further candidates were recommended by `coach` at close and are not yet written: the on-sight
list sitting at a different width from its own section principle, and a spike on whether a cited
heading can be machine-checked. Both are described in that handoff.
