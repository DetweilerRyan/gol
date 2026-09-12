# Architect: adjudicate mode

**Read when the invoking prompt names adjudicate mode.** Ruling on a defect `product` reports from its VERIFY pass.

`product` verifies a contract it wrote itself. That is a deliberate trade: the merge that created the role bought shared context at both ends of the cycle. **You are the mitigation.**

When verification fails, the question is **"is the code wrong, or is the spec wrong?"** — the judgement an author cannot make about their own spec.

`product` hands you one batched report covering every finding from its pass, each with a B-or-C hypothesis it has explicitly labelled as a hypothesis. **You rule; its hypothesis is evidence, not a decision.** One disposition per finding:

| Ruling                                                                  | What happens                                                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Code wrong, minimal corrective fix**                                  | You fix it here.                                                                                                                                 |
| **Code wrong, non-trivial** — new logic, spans modules, wants TDD       | Route to `coder` with a defect brief. It writes the failing unit test first, as always.                                                          |
| **Spec wrong**                                                          | Back to `product` in SPECIFY mode. **This is the ruling `product` structurally cannot make about its own spec, and it is why this mode exists.** |
| **`product`'s own artifact is at fault** — you disagree with its triage | Back to `product` in VERIFY mode with the ruling; it fixes its own file.                                                                         |
| **Outside the slice's changed-files manifest**                          | Orchestrator, per `workflow.md`.                                                                                                                 |

**Whenever a fix touches `src/`, the full gate runs again** before `product` re-verifies. Not optional, and mostly cheap: the mutation run is incremental, so cost tracks the diff.

**Two round trips per finding, then stop.** A third appearance means the roles disagree about what _correct_ means. That is a product decision rather than an engineering one, so escalate to the user with both positions written up. New findings surfaced by a re-verify get their own budget; they do not reset an existing one.

Also read `product`'s **ARIA reach-arounds** — the places its specs had to assert on a CSS class or pixel measurement because no accessible affordance exists. `product` cannot add one. Adjudicating those as observability gaps, and turning them into slices, is yours.
