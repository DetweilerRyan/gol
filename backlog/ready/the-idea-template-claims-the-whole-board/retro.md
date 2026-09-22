# Retro intake — the-idea-template-claims-the-whole-board

Written by the orchestrating seat during the slice, on the seat's own practice. It is an intake for
a later retrospective rather than the retrospective itself: nothing here is ruled, and a reader
should expect to re-measure anything dated before acting on it.

## Findings, numbered as the slice numbered them

### P1 — the seat routed role findings to the user instead of to `coach`

**What happened.** `editor` CLEAN returned five findings on 2026-09-22, two of them in text the
signed spec supplied verbatim and therefore outside every role's authority to fix. The seat
assembled them into a multiple-choice question and put it to the user: amend now, amend narrowly,
or carry to review. The user stopped the question before it was answered and ruled that the seat
must not present decisions `coach` has not ruled on, and that the user's pause point is a `coach`
review that produced an amendment.

**Why it is a defect rather than caution.** `editor`'s own file already routes a substantive
contradiction to `coach` and never to the seat. `coach`'s file already owns impediment diagnosis
and authors every amendment in either mode. The pipeline reference already names the amendment as
the instrument and the user's signature as its gate. A finding is not yet a decision, and the seat
converted one into a user-facing fork by treating itself as the router.

**What it cost.** The user's attention spent on options nobody had ruled on, and a pause in a cycle
that had no reason to pause. Nothing landed wrongly, because the question was refused before it was
answered.

**What would have caught it.** The seat carried a general habit of surfacing divergence to the
user, which is correct for a design divergence the seat itself must resolve and wrong for a role
finding with a named owner. Neither the seat's article nor the pipeline reference states the
discriminator: **a finding with an owning role goes to that role; a finding with no owner goes to
the user.** That sentence exists nowhere.

**Recorded, not ruled.** Whether that discriminator belongs in `orchestration.md`, in
`pipelines.md`'s escalation lanes, or nowhere is a later retrospective's question. The seat has
recorded the same class of error twice in one session, the other being a user ruling reversed
during implementation and relayed as a benefit, which this slice's proposal parks in its own open
questions for the same retrospective.

### P2 — the seat wrote a process ruling to its private memory rather than to this file

**What happened.** On being corrected, the seat wrote the ruling to its own session memory, which
no role and no later reader of this repo can see. The user redirected it here.

**Why it matters beyond tidiness.** A process correction held privately by one seat is invisible to
`coach`, which owns the process, and dies with the memory rather than reaching the corpus. The
retro intake is the built path for exactly this, and the seat had already read that path in
`coach`'s own file, which reserves retro intake to `coach` and records that the intake itself is
not yet built.

**The open question this raises.** `coach.md` calls the retro intake reserved and unbuilt, while
three `done/` folders carry a `retro.md` the seat wrote. The practice runs ahead of the rule. Which
is correct is not this slice's to settle.

### P3 — a spec that dictates prose verbatim has no reviewer before it binds

**Named by `coach` at REVIEW on 2026-09-22 as this cycle's real output**, and recorded here rather
than fixed, since it is an `enabler-process` question rather than a defect any role may repair.

**The mechanism.** `coach` writes corpus prose into `spec.md`. `writer` reproduces it. `editor`
reads the landed file. So a defect in that prose surfaces only after the user's signature, when the
text is immutable without an amendment. The two roles positioned to catch it have no standing to:
`writer`'s correctness is defined as faithful reproduction, and `editor`'s own boundary forbids it
editing text a signed artifact supplied verbatim, ruling that such a finding is a report rather than
an edit.

**Measured on this slice.** Two amendments, five corrective items, and zero role divergences.
`coach` diffed the landed tree against both signed artifacts and found every one of the nine signed
items had landed byte for byte. Every defect the three review passes found sat in text the spec
itself supplied.

**What the corpus already says, and did not enforce.** `coach.md` calls for a spec that is
"file-by-file, verbatim where wording is load-bearing". The qualifier was the rule all along. What
was missing was any pass that asks, per item, whether the wording is load-bearing — so verbatim
became the default register rather than the exception the sentence describes.

**The user's ruling, 2026-09-22.** Revise the unsigned amendment 2 to state each item's invariant
and its anchor, and leave `writer` and `editor` the latitude to write and clean. That is the
near-term half. `coach` carried the durable half out as an `enabler-process` recommendation.

**The trade, so a later reader does not mistake it for a free improvement.** Autonomy moves the
catch rather than removing it. A `writer` given an invariant may satisfy it with a sentence `coach`
would not have written, and `editor` CLEAN becomes the pass that finds it — which is earlier than an
amendment and cheaper, but not nothing. The stopping condition in amendment 2 is the instrument that
keeps that bounded.

**One property of the old register is worth keeping in view.** Four of amendment 2's five stopping
conditions were already written as invariants checkable by reading, and they survived the revision
untouched. Only the fifth depended on the verbatim blocks existing. A stopping condition written as
properties is register-independent; one written as a reproduction check is not.

**Open, and not this slice's to settle.** Where the per-item load-bearing test belongs — `coach.md`,
`prose.md`, or `pipelines.md`'s amendment section — and whether `editor` should gain standing to
edit spec-supplied prose when the spec marks it non-load-bearing.
