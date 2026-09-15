---
name: the-touches-section-fights-negotiable
title: Reshape the Touches prompt so a candidate bounds its size without committing a solution
created: 2026-09-15
---

## Context

`TEMPLATE.md`'s Touches prompt asks a candidate for the modules, config, and docs likely in
scope — a file set, written before `product`, the design pass, or any implementer has looked.
Under the Definition of Ready's Negotiable predicate (ruled 2026-09-15: a candidate is a
proposal, not a contract), a pre-enumerated file set is a pre-negotiated solution. The template
rewards on one section what the rubric penalises on another.

The tension is real on both sides. Touches is what makes size boundable — the design-pass
checklist reads against it, and an empty one leaves the split question unanswerable. Surfaced
2026-09-15 while re-founding the Estimable predicate, which was decoupled from the section by
name for exactly this reason: the rubric now asks whether size can be bounded from what the
file says, wherever it says it.

## Sketch — direction chosen by the user, 2026-09-15

Reshape `TEMPLATE.md` to SCQA: Situation, Complication, Question, then an optional Answer or
Sketch, with Open questions kept for subsidiary decisions. Three facts back the direction:

- The board drifted there on its own. Measured 2026-09-13: 22 of 61 idea files open with
  Situation/Complication/Question instead of Context, and 12 use Answer for Sketch.
- SCQA dissolves the conflict structurally. The Question section is negotiability — a candidate
  whose core is an explicit open question is a proposal by shape. Touches stops existing as a
  prompt, so capture never asks for a file set.
- The Definition of Ready already survives the reshape unedited. Its E and S were re-founded off
  the template by name on 2026-09-15: size is read from what the file says, wherever it says it,
  and a candidate that bounds nothing routes to E=1 and S's own read-the-tree spike rather than
  faking a file set at capture time.

The earlier directions (reword the prompt toward reach; make the section optional below `todo/`;
a size-clues prompt) stand only as fallbacks if the reshape stalls.

### Precedent, researched 2026-09-15

- **SCQA proper is Minto's Pyramid Principle structure**, built for memos and executive
  summaries. No external precedent was found for SCQA as a backlog-item template, so the honest
  claim is transfer, not adoption: the external pedigree covers the communication shape, and the
  backlog application's precedent is this board's own drift.
- **Shape Up's pitch is the closest engineering-native cousin** — Problem, Appetite, Solution,
  Rabbit Holes, No-Gos, decided at a betting table. Problem maps to Situation plus Complication,
  Rabbit Holes to Open questions, the betting table to promotion. Its Appetite exists explicitly
  instead of an estimate — the same stance the Definition of Ready's Estimable ruling and Wake's
  retrospective took independently.
- **Two imports worth taking.** The solution register: Shape Up's Solution is shaped, not
  specified — rough, right-altitude, no file-set commitment — which is what an optional Answer
  section should ask for, and how the board's existing Answer sections already behave. And
  No-Gos: an explicit exclusions section the board already grows organically ("What this epic
  does not claim"); the reshape can name what practice invented.
- **One deliberate divergence to record.** Shape Up insists problem and solution travel
  together; SCQA with an optional Answer is more negotiable than Shape Up allows. Keeping the
  Answer optional is a stance beyond the precedent, not covered by it.
- **Tooling prior art, compared 2026-09-15 and declined.** The `abreed05/claude-shapeup` plugin
  walks a raw idea through the five pitch sections and hard-stops on discipline violations.
  Declined for adoption on three grounds: it gates, and the board's no-gate ruling stands; its
  pitch directories break the one-file, name-is-identity chain; and a marketplace plugin sits
  outside every checker this repo's skills were deliberately brought inside. Two things worth
  keeping from the comparison: its violation catalog maps letter-for-letter onto the readiness
  predicates (solutioning-in-the-problem is N, vague-appetite is E's spirit), which confirms the
  finding set independently; and its section-walking interaction is prior art for a capture-time
  SCQA walk, if `/idea-capture` grows one with this reshape. `rjs/shaping-skills` — shaping and
  breadboarding skills published by Shape Up's own author — was compared the same day: no
  conflicts with the board's design, because it improves ideas rather than judging them, and its
  own README calls it non-evaluative. Not adopted as-is (personal-skill install sits outside the
  checkers), but it is the named technique source for executing shaping-type spikes — the
  Negotiable spike's compare-two-approaches is its shaping skill, and the contract-bearing
  Testable spike's probe-for-the-observable is its breadboarding, which independently converges
  on the affordance vocabulary the anchors already use.

## Touches

- `ideas/TEMPLATE.md`
- `.claude/references/definition-of-ready.md` — the anchors that read size off the file
- The board's existing files only if the prompt rewording invalidates their sections, which it
  should not

## Open questions

- How do SCQA's Question and the existing Open questions section divide the work? Board
  practice suggests they coexist — the Question is the candidate's core, Open questions carry
  subsidiary decisions — but the reshape must say so or the two blur.
- Does the sizing prompt disappear entirely, or does a todo-lane note say where size evidence
  helps? The Definition of Ready asks at promotion either way.
- Does the sizing job move to the design pass entirely, leaving candidates with no size section
  at all? That trades the conflict for unscorable size letters on every assessment.
- The section is named in many board files today; a reshape binds only future candidates unless
  a sweep is worth it — is it?
