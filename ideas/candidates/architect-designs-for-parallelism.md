---
name: architect-designs-for-parallelism
title: Make architect optimise for concurrent coder work, and keep an experiment log of whether it worked
created: 2026-08-23
---

## Context

Design mode's deliverable today is **an ordering** — "an ordering of
behavior-preserving steps each of which leaves the suite green, so `coder` has a
regression net at every commit rather than only at the end." That phrasing is
sequential by construction, and deliberately so. `coder` already runs "usually
in more than one invocation" per design pass; those invocations are simply
serial.

The proposal is that design mode should instead produce **a partition** — the
largest set of work units that can be authored at the same time without
touching each other — and that architect should treat maximising that number as
a design objective, not a happy accident.

The repo already practises the principles this would lean on; it just doesn't
name them or aim them at parallelism:

- **Open/Closed** — `split-grid-render-props` inverted `Grid`'s overlay imports
  behind a `renderOverlays` render prop, so new overlays extend `LifeBoard`
  without modifying `Grid`. Two slices adding two overlays would not collide.
- **Dependency inversion** — the framework-free module → hook → component
  direction, already mechanically enforced by `rules/domain-imports-upward.yml`.
- **Single responsibility** — the seven-then-eight-then-sixteen module split at
  `src/` root, each module owning one thing.

What's missing is the feedback: nothing measures whether a boundary change
actually bought concurrency. The evidence arrives slices later, as a rebase that
did or didn't conflict, and by then nobody is looking.

## Sketch

**1. Design mode gains a parallelism objective.** Alongside the ratified file set
and interfaces, the pass produces a partition: which units can be authored
concurrently, and which sequencing edges are irreducible. Where a boundary is
the only thing forcing two units to be serial, that boundary becomes a
candidate for the OCP/DIP/SRP treatment above — the refactor is the deliverable,
and the parallelism it buys is the justification.

The cost has to be stated plainly, because it is real: an ordering guarantees a
green suite at every step, and a partition does not. Parallel branches have no
shared regression net until they land.

**2. Architect keeps an experiment log.** One record per architectural bet, in
hypothesis → experiment → evidence form:

```markdown
## Hypothesis

Inverting X behind a render prop lets overlay slices proceed concurrently.

## Experiment

Slices A and B, authored concurrently in separate worktrees.

## Evidence

2026-09-14 — A and B both rebased onto main with 0 conflicts; 0 files touched
by both. Status: corroborated.
```

Status advances on evidence, borrowing the epistemic ladder from
[Design Rationale Records](https://arxiv.org/html/2601.21116) — **conjecture**
(the bet, untested) → **substantiated** (the boundary holds logically, rules
pass) → **corroborated** (concurrent slices actually landed clean). That paper's
central observation is the one that applies here: traditional ADRs have no
mechanism for detecting when their rationale has stopped being true. Its
apparatus — F-G-R trust tuples, computed reliability scores, weakest-link
propagation — is far too much machinery for a solo repo and should not be
imported. The three-rung ladder is the whole borrowing.

**3. The orchestrator writes the evidence, not architect.** This is forced, not
chosen. `handoffs.md` says a role sees only its own slice — "that is deliberate
— don't go looking for the others" — and `workflow.md` forbids every role from
`checkout`, `rebase`, `merge`, and `push`. Conflicts surface at merge, which is
the orchestrator's step in a worktree architect cannot see. So merge-protocol
step 1 (rebase) gains a line: record the conflict outcome against whichever
hypothesis is open. Giving architect cross-slice read access would work too and
should be rejected — it reverses an explicit rule to save the orchestrator one
line.

**4. Proposed metric**, so the log records a number rather than an impression:
**rebase conflict count** and **files touched by two or more concurrent
slices**, both readable from git at merge time. (Alternates if those prove too
coarse: whether `--ff-only` succeeded first try, or re-verification wall time.)

## Touches

`.claude/agents/architect.md` (design mode's deliverable, plus ownership of the
log), `CLAUDE.md`'s "The optional architect design pass" and merge-protocol
step 1, and a new directory for the records.

No `src/` change. The refactors this would motivate are separate slices — this
one only changes how they get chosen.

## Open questions

- **The premise may be capped by something architecture can't move.** CLAUDE.md
  already says parallelism "buys concurrent _authoring_, not concurrent
  _landing_ — the second slice to land pays a full re-verification. That cost is
  why two or three is the sensible ceiling." If the binding constraint is the
  serial gate rather than module coupling, then perfect boundaries still leave
  the ceiling at two or three, and this whole idea buys smoother rebases rather
  than more concurrency. **Worth testing before building any of it**: check the
  last several slices for how often a rebase actually conflicted. If the answer
  is rarely, the problem being solved isn't the binding one.
- **Which reading of "concurrent coder invocations"?** This sketch assumes
  partitioning into concurrently-authorable **slices**, which the existing
  worktree machinery already supports. The other reading — multiple `coder`
  invocations running at once inside one slice's worktree, on one branch —
  needs machinery that doesn't exist (sub-branches, or a merge step inside the
  slice) and isn't designed here.
- **These are not decision records.** They record whether an experiment came
  out, which is a lab notebook. Calling them ADRs invites the wrong template and
  the wrong lifecycle. Naming and location are open: `adr/`, `experiments/`, or
  architect-owned under `.claude/`. Top-level would match how `ideas/`,
  `features/`, `rules/`, and `perf/` are treated; architect-owned would match
  the fact that these are notes it keeps for itself.
- **What retires a hypothesis that never gets tested?** A bet whose slices never
  ran concurrently sits at conjecture forever. Either that's honest, or the log
  needs an expiry — and an expiry is the thing the DRR paper is really about.
