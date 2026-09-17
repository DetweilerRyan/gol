# Rationale: Pipelines

**Audience:** whoever is changing a rule in `pipelines.md`. **Read when:** amending, narrowing,
or overturning one — never in order to follow one.

## Provenance

Ruled by the user on 2026-09-16, at point 8 of the `backlog-board-redesign` reevaluation (the
epic's git history carries the full record). The problem it answered: no surface stated a
slice's pipeline end to end, so "what happens, in order, for an enabler?" meant synthesizing
CLAUDE.md's cycle string and design-pass triggers, `orchestration.md`'s invocation contracts and
sequencing rules, `handoffs.md`'s handoff shape, and the role files' own closings. The kind
system made the spread worse: kind selects a cycle, and the per-kind variations existed only as
scattered exceptions.

The concept is Kanban's **classes of service** — explicit, per-work-item-type policies for how
an item moves through the system — with the same folder-blueprint shape Kiro and GitHub
spec-kit converged on for agent workflows (researched 2026-09-16 during the reevaluation; the
epic's history carries the sources).

## Why the gates cells cite instead of listing

Ruled by the user 2026-09-16, extending point 8, after a scan of all five role files. The
measured drift instances that motivated it: `architect.md` carried a verbatim copy of
`hardener`'s eight-stage sequence, and `product.md` carried the six-step acceptance-spike
choreography naming three other seats' steps. A restated list drifts the moment its source
moves; a citation cannot. The same scan found `coder.md`, `cleaner.md`, and `hardener.md`
clean — their gate lists are their own, which is the ownership principle the article states:
role files hold within-invocation facts, this file holds between-invocation facts.

The counterpart ruling, recorded so a future editor does not "deduplicate" it away: both sides
of an invocation contract existing is not duplication. `architect.md`'s "absent a mode you are
reviewing" is the role's side; the article's "name the mode" is the seat's.

## The migration record, 2026-09-16

What moved where when the reference was authored, so a reader tracing a sentence's history knows
which file to `git log`:

- `orchestration.md` → here: "The invocation contracts", "State only this seat can carry",
  "Sequencing this seat owns", and "The escalation lanes that end here". That article kept seat
  conduct (prose discipline, the exemption-flag protocol, the VERIFY-skip demonstration, perf
  runs, worktree setup) plus a pointer.
- `product.md` → here: the six-step acceptance-spike sequence. The conduct rules (refinement
  may only strengthen; approval once at step 6; commit-provisional) stayed there.
- `architect.md`: its verbatim quote of hardener's eight stages became a pointer. Nothing moved
  in — the quote was a copy, not a source.
- CLAUDE.md: the "Subagent pipeline" section slimmed to routing, keeping the cycle string that
  `agent-doc-check`'s check 4 pins byte-identical everywhere it appears — including in
  `pipelines.md`'s story section, which is deliberate: the gate now covers this file for free.

## The slice-name contract's correction

`orchestration.md`'s migrated bullet said `product` invents the slice name in SPECIFY. Under
the `backlog/` board that is true only for slices with no board item: a promoted item's name is
its `ready/` folder basename, fixed at promotion. The article states the split form. The old
absolute form predated the board redesign rather than being wrong when written.

## Diagrams are unverified by anything

The Mermaid flow and the step table are two representations kept consistent by hand — ruled
2026-09-16 (user chose flow-plus-table over table-only, accepting the cost). No checker parses
a Mermaid block. When they disagree, the table is the authority, since the gates that do reach
the file (`agent-doc-check`, `reference-check`, prose-lint) all read text, not topology.
