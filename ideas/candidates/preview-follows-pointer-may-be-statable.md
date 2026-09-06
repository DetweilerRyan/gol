---
name: preview-follows-pointer-may-be-statable
title: Try stating "the preview follows the pointer" as a scenario, retiring the last pixel test in its file
created: 2026-09-05
---

## Context

Raised by `product` during `re-audit-hand-written-e2e-residue` and **agreed by `architect` as a
separate slice** — it is a new-scenario contract question rather than a deletion, and that pass had
already ruled the test category 3 (rendered pixel geometry). Recorded in
`features/hud-layout-and-shortcuts.e2e.spec.ts`'s own header; filed here because the board is where
work gets picked up.

**The observation that makes it plausible: preview cells announce their own world coordinates.** That
is already the channel `features/steps/pattern-library.ts` reads all eight pattern shapes through. So
_"the preview follows the pointer"_ may be statable as a scenario about **which cells the preview
covers after the aim moves** — a claim about coordinates rather than about pixels.

**If it lands, it retires the last hand-written test in that file**, which would take
`hud-layout-and-shortcuts.e2e.spec.ts` from 9 tests at the start of the audit to 0 and delete the
file. That is not the goal, but it is the consequence, and it is worth knowing before starting: the
file's whole remaining content is this one claim.

## Why it was not done in the audit slice

`architect` ruled it category 3 **on the shape the test currently takes** — two measured bounding
boxes. The question is whether the _same claim_ can be made through a different channel, which is a
contract question rather than an audit finding. Doing it inside the audit would have meant writing a
scenario nobody had ruled admissible, in a slice already carrying three of `architect`'s rulings.

## Sketch

The scenario form `architect` named: _which cells the preview covers after the aim moves_, read
through the world coordinates preview cells already announce.

**The deletion is conditional and the order matters.** The hand-written test dies only when the claim
lands in `features/**` and is shown to catch what the test catches — that is the standing rule from
`triage-paired-specs`, and this slice's own audit applied it four times. Restate first, probe, then
delete.

**The probe to use**: break the preview's position tracking (something that stops `movePreviewTo`
updating, or offsets it) and confirm the new scenario reds. If it does not, the coordinate channel
does not carry the claim and the pixel test stays — which is a legitimate outcome and closes this.

## Touches

`features/pattern-library.feature` (**at 11 of the cap of 12** after the audit raised it — one slot
left), `features/steps/pattern-library.ts`, and `features/hud-layout-and-shortcuts.e2e.spec.ts`
(deleted entirely if the claim lands). Possibly `features/screenplay/questions.ts` if the coordinate
read needs a helper.

No `src/` change. Expect `acceptance-mutation` unmoved unless the scenario takes an Examples table.

## Open questions

- **Does the coordinate channel actually carry it?** The preview announces which cells it covers;
  "follows the pointer" is a claim about the _relationship between_ two aims. Whether one scenario can
  state that without becoming a two-`When` shape — the exact thing `only-one-when` and
  `keywords-in-logical-order` jointly forbid, measured in the audit — is the first thing to check.
- If the file empties, is deleting it right? A spec file with zero tests is dead weight, but
  `hud-layout-and-shortcuts` is also where several measured facts about the HUD live in comments.
  Those would need a home.
- Is one slot enough? `pattern-library.feature` is at 11 of 12. If the claim needs a pair the way the
  cancel claim did, the cap binds again — and `architect` has just ruled once on what that cap is for.
