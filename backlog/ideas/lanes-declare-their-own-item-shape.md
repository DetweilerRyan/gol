---
name: lanes-declare-their-own-item-shape
title: Let each board lane declare its own item shape, and warn on what no lane declares
created: 2026-09-21
---

## Situation

`scripts/board-shape-hook/board-shape.ts` classifies a written board file with three mechanisms
rather than one. `isAssessmentRecordPath` refuses an assessment record by basename. `isCandidatePath`
then tests position: two board-relative segments, or three ending in `proposal.md`. `assessmentSummary`
reads the lane as a literal, so a stale blob is a finding in `ideas` and a frozen record everywhere
else. The lane literal is therefore already in the file.

Measured 2026-09-21: every item file in the `ready` and `done` lanes is named `proposal.md`, and no
lane holds a divergent item shape. One shape serves all three lanes today.

`backlog/TEMPLATE.md` was named for the whole board while holding the shape of one lane's item, until
the corpus child renamed it to `backlog/IDEA-TEMPLATE.md` on 2026-09-22. The basename was shared with
`adr/TEMPLATE.md`, and `npm run reference-check` resolves a citation by basename against the live
tree, so a bare mention resolved against either file. A sweep on 2026-09-21
with `grep -rn 'TEMPLATE\.md'` found live citations in the auto-loaded index, the pipelines reference,
a skill, and the hook's own unit test, plus a bare one in the decision-record tier.

R1 of `backlog/done/the-board-hook-misfits-per-item-artifacts/spec.md` ruled the discriminator
positional, and listed "a new lane directory needs no literal" among the four properties arguing for
that form. It named the epics lane as the survival test for that property.

## Complication

The positional test answers which files are candidates. It cannot answer what shape each candidate
owes. Those were one question while every lane owed the idea shape, and `epics-promote-to-their-own-lane`
splits them: an epic's item file carries a goal and an ordered child sequence rather than the
Situation/Complication/Question shape the template states.

A lane whose items owe a different shape then fails in both directions. An item file the positional
test does not recognise draws no checks at all, and prints the same refusal line a per-item artifact
draws, so a missed item reads exactly like a correctly skipped spec. An item file that happens to
carry the recognised basename draws the full candidate checks, and reports missing sections it never
owed.

R1's evidence does not reach this case. The artifact kinds it protects are an open population that
arrives unannounced — `retro.md` landed outside every census, which is the measured argument for
covering artifacts positionally. Lanes are a different population: few, and each one so far arrived
with a user ruling behind it. The cost of a literal scales with how often the population grows, and
the two grow at different rates.

## Question

What does a lane declare about its own items, and what happens to a board path no lane declares?

## Answer

Shaped, per the user's 2026-09-21 direction.

- **Split R1's scope by axis rather than overturning it.** The lane axis becomes literal. Inside a
  declared lane the artifact test stays positional, so an artifact kind nobody has named yet is still
  covered on the day it lands.
- **A lane declares its item's depth as well as its basename.** Ruled by the user 2026-09-21. A flat
  lane holds its item at `<lane>/<slug>.md` and a folder lane at `<lane>/<item>/<basename>`. Depth is
  what makes a mismatch mechanical: a folder in a flat lane, or a flat file in a folder lane, is
  detectable with no artifact name written anywhere. At the declared depth inside a folder lane the
  artifact test stays positional, so anything that is not the declared item file is an artifact and
  stays silent.
- **A finding is reserved for a declared item in a declared lane.** Ruled by the user 2026-09-21.
  Everything else — an undeclared lane, an item file no lane declares — reports a warning that is
  neither counted in the tally nor delivered to the editing role. The board has no gate and this adds
  none, and the envelope keeps firing on the finding count exactly as it does today. The register
  already exists: the script prints uncounted lines today, distinct from a counted finding and from a
  refusal that reports zero checks.
- **The warning buys a diagnosable line rather than an interrupt.** An unrecognised item file draws
  the same refusal a per-item artifact draws under the rule in force, so the two causes are
  indistinguishable in the log stream. A warning naming its own cause separates them. It does not
  close the gap it names: the file still draws no checks, and the role editing it is still not told.
- **A lane declares the template its item is written from, and the idea template is renamed for its
  lane rather than for the board.** Ruled by the user 2026-09-21. The template a lane's items are
  written from is a property of that lane, so the declaration is where it belongs. A name at the
  board root claims the whole board for a shape only one lane uses, and the basename it claims is not
  even unique in the tree.
- **The declarations live in a board data file rather than a constant in the script.** Adding a lane
  stays a board edit. The script validates that input rather than trusting it.
- **A path directly under the board root is its own class, and it stays silent.** Ruled by the user
  2026-09-21, provisionally. The board root is not a lane, so the segment count classifies such a path
  before the lane lookup is reached and it draws neither checks nor a warning. The declaration file is
  then quiet when edited, and the template keeps falling out with no literal naming it.
- **The rationale lands in a sidecar beside the module, and not only in this file.** Ruled by the
  user 2026-09-21. These decisions are depth about one module, which CLAUDE.md's routing sends to a
  `<module>.meta.md` beside the source, and its subject-wins tie-break keeps them there rather than in
  an article. This file reaches the done lane and the retrospective deletes it, so a ruling whose
  argument lives only here loses that argument on the day the board clears.
- **Declaring the lanes that exist has value before the epics lane arrives.** Ruled by the user
  2026-09-21. Every path directly under the board root reports its own filename where a lane name
  belongs, and nothing today makes that visible. The epics lane is the first consumer of the
  mechanism, not the justification for it.

## No-gos

- **No gate.** Nothing here can fail a run, and the hook continues to exit zero. A warning that
  hardens into a finding is a separate ruling.
- **The artifact axis is untouched.** Which files inside an item folder are artifacts stays
  positional, and no artifact basename earns an entry anywhere.
- **The declaration file is not hidden, and a dotfile would not hide it.** Measured 2026-09-21: a
  probe written to `backlog/ideas/.zz-probe-dot.md` drew the same seven checks and five findings its
  undotted control drew, so the hook trigger's board pattern matches a leading dot. Hiding the file
  would cost a directory listing the board is meant to be read from, and would buy nothing the
  classifier cannot give by recognising the path.

  Rewriting the trigger instead is closed by the hook contract rather than by preference. A
  conditional hook holds exactly one permission rule, with no operator for combining or negating
  rules, and its path patterns follow gitignore syntax — under which a wildcard matches a leading dot
  by design. A positive character class is the only remaining form, it would exclude a dot on the
  final segment alone, and it would move the invariant into a surface no suite in this repo covers.

- **The epics lane is not created here.** `epics-promote-to-their-own-lane` owns that, and this idea
  states no opinion on what an epic's item file is called.

## Open questions

- **A basename mismatch at the declared depth stays undetectable, and the depth rule narrows that
  residue rather than closing it.** A file at `<lane>/<item>/<basename>` that is not the declared item
  reads as an ordinary per-item artifact, which is precisely what an artifact table would catch and
  what R1 refused on measured evidence. One way to narrow it further without a table: on a write to a
  non-item file inside a folder lane, test whether the declared item file exists in that folder at
  all, and warn when no file holds it.
- **The silent root is a knowing inconsistency, and what would reopen it is unsettled.** Every other
  undeclared position on the board reports a warning; the root alone reports nothing, so a stray file
  landing there stays as invisible as it is under the rule in force. Declaring the permitted root
  files in the same declaration would put the root under the rule the rest of the design rests on,
  and would make the declaration file quiet by declaring itself rather than by exemption. The cost is
  one more thing to declare, and the provisional ruling above defers it rather than refusing it.
- **What does the classifier do when its own declaration file is missing or malformed?** Reading that
  state as every lane declared, or as every lane undeclared, are both wrong. `scripts/vale-fixture-check/`
  carries the precedent for a checker that refuses to report a clean run it cannot substantiate.
- **The declaration file sits on the board it describes.** The hook fires on every write under the
  board root with no extension filter, so editing the declarations runs the classifier against them.
- **Three surfaces would then state the lane set** — CLAUDE.md's board section, `.claude/references/pipelines.md`,
  and the declaration file. Two statements of one fact earn their duplication only when a disagreement
  is detectable, which is the argument `epics-promote-to-their-own-lane` makes for child membership.
  Nothing checks these three against each other.
- **Does a machine-read declaration change a stated property of the board?** CLAUDE.md records that
  the board has no gate, no checker, and no test beyond one advisory style. A file the tooling parses
  is not a gate, and whether it is a checker is the question.
- **Where does a lane's template sit, now that the lane tree is itself classified?** Inside the lane
  it serves collides with the item shape: a template at `<lane>/TEMPLATE.md` in a flat lane matches
  the item shape exactly, so the classifier would check it as a candidate and it would fail every
  identity check. A directory gathering the templates reads as an undeclared lane unless the
  declaration says otherwise. The board root keeps it in the class that draws no checks at all.
- **A sidecar under `scripts/` would be the first of its tier.** Measured 2026-09-21: the three live
  module sidecars all sit under `src/`, and `.vale.ini` carries a section for that tree with no
  counterpart for `scripts/`. The `.meta.md` half is exempt either way by the last-wins section at the
  end of that file, so the gap blocks nothing here — it does leave the instruction half of that tier
  unlinted in `scripts/`. CLAUDE.md's index of which pairs exist names those three, and a fourth makes
  that line stale.
- **The general question already has a candidate, and this idea should not re-rule it.**
  `the-retrospective-deletes-evidence-a-landed-ruling-cites` asks where evidence lives once the
  retrospective deletes a folder, and names copying into the citing sidecar as the cheapest of three
  answers. The ruling above applies that answer to one slice. Whether it generalises belongs to that
  file.
- **Which kind is this, and does it split?** The executable change lands in `scripts/`, which reads as
  a technical enabler. The per-item-artifact prose naming the positional rule would go stale in the
  same breath, and corpus prose is process work — which `.claude/references/pipelines.md` names as a
  split signal rather than a side edit. The template rename widens that corpus surface again, since
  its citations sit in the auto-loaded index, the pipelines reference and a skill, and one of those
  is an instruction a skill executes rather than prose a reader consults.
