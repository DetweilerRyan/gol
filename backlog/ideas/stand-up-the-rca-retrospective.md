---
name: stand-up-the-rca-retrospective
title: Define the RCA retrospective workflow and the impediments lane
created: 2026-09-21
---

## Situation

`backlog/done/` is the retrospective queue. Measured 2026-09-21: sixteen folders, none
retrospected — six `enabler`, six `enabler-process`, two `enabler-technical`, two `spike`,
and no story.

The pass that consumes the lane has never been defined. CLAUDE.md's "Idea board" section
states the retrospective's job, then says its trigger and owner are not yet ruled, so folders
wait. `coach`'s file reserves the retro intake and names building it as a future spec of its
own. `adr/0001` recorded the same gap as a negative consequence — deletion waiting on a
retrospective whose trigger and owner were left unruled, so until ruled the lane only grows —
and that record's status is `Accepted (not yet frozen)`, which keeps it editable.

Two slices recorded findings during the work regardless, in `retro.md` files.
`the-board-hook-misfits-per-item-artifacts` already ruled that artifact's shape: a spec, a
design, an amendment, a task list, a spike's findings and a retro each carry no frontmatter.
CLAUDE.md's per-item artifact list does not name it.

## Complication

The lane only grows, and its contents expire. A folder's artifacts are the only durable record
of what the work taught, and the deletion that would retire them is the same act the
retrospective was meant to earn. The lessons are held by a queue nothing drains.

An agentic retrospective can read artifacts alone. A human team mines recollection; a role's
context dies with its invocation, which this repo has already slice-named and fixed for one
artifact class, tagged `slice/assessment-records-die-with-the-conversation`. So the pass is
forensic, and the artifacts it must read are the ones its own deletion destroys.
Contemporaneous capture would close that gap, and today it happens by luck: two slices wrote
findings during the work, nothing asks any role for them, and the board does not name the
artifact.

The findings already recorded are unruled by design — questions with evidence, deciding
nothing. A nine-amendment chain, a census that failed more than once, and a seat that sent a
role outside its boundary sit diagnosed and unadjudicated.

A root cause has nowhere to land. It is not a candidate, since it proposes nothing. It is not a
decision record, since nothing is decided. It is not a per-item artifact, since its item is the
folder the pass deletes.

A pass run without discipline costs more than no pass. A retrospective expected to produce
findings will produce them, and an agreeable participant asked for causes will supply them. The
corpus then accretes rules nobody needed.

## Question

What discipline turns a completed slice into a ruled root cause, when the evidence is the
artifacts the pass itself deletes and the participants are agreeable readers with no stake in
the finding?

## Answer

Shaped, not specified.

The pass is facilitated rather than solo. `coach` gains a third mode and runs the
retrospective; it rules and routes, and it does not vote. Every role can be seated as a
participant in a retro mode of its own, since a participant brings a standing lens rather than
membership of the slice under examination, and a lens reads a slice it never ran. The
facilitator recommends the roster for approval, and a seated role may return nothing, as
outside its lens.

Two techniques, and the general case is the default. A five-whys pass finds one chain
terminating in a foundational why. A fishbone pass co-creates a tree of candidate chains,
weights it by participant vote, and may then refine the weighted tree to the single likeliest
path — the same output a five-whys gives, earned by a more rigorous route. The rounds follow
from the technique rather than from the facilitator's preference: diverge blind and in
parallel, merge the partial trees into one skeleton, weight blind, refine if the inquiry asks.
Blind divergence substitutes for a shared whiteboard without inheriting its anchoring.
Fishbone is the default here, inverting human practice, because parallel participation removes
the cost that makes a single chain attractive to a room and leaves its failure mode intact:
one chain presented with confidence it has not earned.

A vote carries evidence, not preference. Aggregating the preferences of stakeless readers
aggregates nothing, so a vote cites an artifact, a branch collecting votes without citations
weighs down rather than up, and a cited refutation outweighs uncited support.

Every retrospective declares what a null result would look like before it runs, alongside its
inquiry, its roster, its rounds and its exits. A pass that cannot come back empty manufactures
findings, which is the cost the Complication names. A chain's links carry the same discipline
one by one, marked evidenced or inferred, and a chain depending on an inferred link exits as a
measurement rather than a remedy.

A root cause lands in a lane of its own on the board, as a folder, and a remedied one moves to
a sublane rather than being deleted. It carries the technique's own structured output — the
chain, per-link evidence, the weighting, the rejected neighbours, the terminal layer that
routes its remedy's kind — and not the candidate's narrative shape, which has no slot for any
of them. It inlines its evidence by quotation rather than by path, because the folders it was
read from are deleted by the same pass and no checker resolves a citation on this board.

The trigger is the user's word, scope is outcome-shaped and approved before the pass runs, and
the entry point varies by retrospective type.

The board's shape checker reads position rather than lane, so a flat record in any lane
collects an idea file's findings. The folder form chosen here is already silent under that
predicate, so nothing in this item waits on it. Teaching the checker to read the lane, so a
lane may declare its own shape, belongs to the promoted technical item that already owns the
defect.

Four checks read this work, and their readings on 2026-09-21 are these.

| Check                                  | Today                                              | Afterwards                                                    |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `npm run agent-doc-check`              | 55 doc files, 8 agent files, 32 rules, no failures | more doc files, still 8 agent files, no failures              |
| `npm run reference-check`              | 538 files scanned, 3226 references, no failures    | more of each, no failures                                     |
| `npm run prose-lint`                   | 556 tracked files, 164 findings                    | more tracked files, and no finding from a file this work adds |
| The board's shape checker, folder form | `not a candidate, 0 checks`                        | unchanged, which is the reason for the form                   |

The agent count holding at eight is a reading rather than an accident. A participant mode file
sits in a role's own subdirectory, and the roster scan filters for files, so it never descends.
The same measurement on the flat form in a new lane reports six checks and five findings, and
measures the record against the retired board era, since a structured record carries no Situation
heading.

Two of those readings would be a confident zero rather than a pass. The roster scan's blindness
is the same fact as the frontmatter exemption, so a mode file with broken frontmatter passes by
being unreachable and nothing validates what a mode file declares. A missing `vale` binary
reports zero exactly as a clean run does, which is why the prose linter states that its zero was
measured.

The pass's own observable is a ruled root cause in the new lane, or the null result the pass
declared before it ran. `coach` REVIEW against its signed spec closes the cycle either way.

## No-gos

- Pre-mortems and futurespectives. Both invert a retrospective's direction, and neither reads a
  record of work that happened. Named here so the omission is not read as a gap.

- Sentiment techniques — sailboat, mad-sad-glad, starfish. They mine what participants felt,
  and a stateless reader felt nothing. Declined on the same ground that makes the pass forensic.

- Retrospective types other than root-cause analysis. A thematic pass tests whether a suspected
  pattern is real, a sweep discovers its own inquiry, and a calibration pass asks whether a
  prior remedy held. Each carries a different entry point, since each knows something different
  at the start. This item defines the root-cause type alone.

- Any gate that makes a retrospective happen. The board carries no gate by design, and nothing
  here changes that: no run reds because a folder waited, and the merge protocol gains no
  retrospective step.

- Any automatic trigger. The user's word starts a pass. A count threshold, a symptom-fired pass
  and a schedule are later work rather than exclusions on principle.

## Open questions

- What are the children, if the assessment rules this an epic? The candidate split is the frame
  — the facilitation reference, `coach`'s third mode, the two lanes, the board documentation and
  the `adr/0001` edit — then the participant modes, then the fishbone facilitation protocol. A
  frame with no participants seated is one role's opinion, so it is not obvious the first child
  delivers value alone.

- Does a remedied impediment ever leave the board? The sublane records that a remedy landed and
  nothing retires it, which is the shape `adr/0001` already named as a lane that only grows. An
  impediment whose remedy was a decision may belong in the decision-record tier instead.

- Does this item ask roles for contemporaneous capture, or does a sibling? The cost is named in
  the Complication and the artifact is already ruled, but asking for it changes conduct in every
  role file. The board's per-item artifact list omits the artifact either way, and that
  correction needs an owner.

- Is the weighted skeleton retained anywhere? Each impediment can inline its own chain and the
  neighbours it beat, which leaves no reader able to reconstruct the whole tree. That is either
  an acceptable loss or the reason the record is thin.

- Is the set of terminal layers closed, and is it one set or two? A closed set is what makes the
  routing mechanical, and an open one drifts. The corpus case is the only one worked so far, and
  a defect in `src/` may terminate somewhere the corpus layers cannot express.

- Who writes the impediment record — the facilitator or the seat? The facilitator already writes
  its own item's artifacts, which argues for it. Its boundary forbids editing the corpus, and a
  board lane is not the corpus, so the question is whether that reading holds.

- Where do the weighting scheme and the spine categories belong — the frame or the facilitation
  protocol? Both are the technique's own mechanics rather than the frame's, unless the smallest
  honest weighting scheme turns out to be a frame-level rule.

- May a participant refute the effect itself, rather than a branch? A pass whose problem
  statement is wrong produces a well-evidenced answer to the wrong question, and the approved
  scope is what a participant would be contesting.

- Is a retrospective a declared role cycle? The configuration declares the story and the process
  cycles, and the documentation gate holds every bare arrow sequence byte-identical to one of
  them, while a mode-bearing sequence stays exempt. Declaring nothing and writing nothing both
  read green, so the answer has to be deliberate rather than inherited.
