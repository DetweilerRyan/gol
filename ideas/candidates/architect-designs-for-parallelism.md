---
name: architect-designs-for-parallelism
title: Make architect optimise for concurrent coder work, decide who executes the partition, and log whether it worked
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

**5. Per-unit briefs.** A partition nobody can hand to a `coder` is not
actionable, so design mode emits one brief per parallel unit: its files, its
interface, and its correctness obligations. This is required under either answer
to the ownership question below, which is why it sits here rather than there.

**6. Defendable correctness, using an obligation that already exists.**
`architect` already checks that "any property added this slice was shown to fail
against a deliberately broken implementation. A property nobody has seen fail is
documentation." Nothing applies that standard to `coder`'s TDD unit tests.
Extending it — the reviewer confirms the failing test genuinely preceded the
implementation — makes per-unit correctness auditable rather than asserted, and
needs no change of ownership at all.

**7. Cross-unit duplication, and the fan-in it implies.** `cleaner` is scoped to
"the files named in the coder's handoff manifest" and runs on its own branch, so
with N concurrent units no cleaner can see its siblings: two units can
independently grow the same helper and both passes stay green. The proposed fix
is that **architect runs `npm run dry4ts`**.

Two things follow, and they are what make the fix real:

- **It requires a convergence point.** `dry4ts` cannot see cross-unit
  duplication until the units are in one tree. So the shape is fan-out to N
  `coder`→`cleaner` pairs, **fan back in** to the slice branch, then a single
  architect pass over the union. That also partly answers the reading-(i)-vs-(ii)
  question below.
- **No new tooling.** `npm run dry4ts` is already whole-`src/` (`dry4ts src`),
  not manifest-scoped. What changes is who runs it and when, not what it does.

## Touches

`.claude/agents/architect.md` — design mode's deliverable, ownership of the log,
the "shown to fail" obligation in item 6, and the gate prohibition in the last
open question. `CLAUDE.md`'s "The optional architect design pass" and
merge-protocol step 1. A new directory for the records.

If the ownership question resolves toward ownership, add `.claude/agents/coder.md`
and `cleaner.md` and an `Agent` tool grant; if it resolves toward briefs only,
neither is touched. That difference in blast radius is itself worth weighing.

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
- **Should `architect` own `coder` and `cleaner`, or only brief them?** Someone
  has to turn a partition into running work, and the two answers are genuinely
  different designs. Neither is recommended here.

  _For ownership_: the role that computed the partition knows what each unit
  needs, and routing that through a general-purpose orchestrator loses fidelity;
  someone must fan out N coders and architect is closest to the plan; a single
  owner for both goals stops parallelism and correctness being traded against
  each other invisibly.

  _Against ownership_: architect reviews `coder`'s output at step 4, so
  directing that output turns the review into self-review — the repo already
  makes this argument twice, splitting `hardener` out so "architectural review
  and mutation hardening don't compete for the same pass", and justifying
  adjudicate mode with "You were not in the room when the contract was written.
  That is the point, not a gap." Nested subagents also remove the orchestrator's
  visibility and sequencing, `workflow.md` forbids taking over another role's
  workflow without user direction, and it needs an `Agent` tool grant that **no
  role currently has** — all five allowlists are identical.

  _A middle position, named but not endorsed_: architect owns the brief, the
  orchestrator owns the invocation.

- **Architect running `dry4ts` reverses a written rule, and the rule's stated
  reason is the thing to argue with.** `architect.md` lists the full gate and
  says it "is `hardener`'s job, not yours; don't run those here even to 'check
  your own work,' **since hardener runs them next regardless**." That reason
  still holds under fan-in — `hardener` runs after architect on the same merged
  tree, so it _would_ catch cross-unit duplication before the slice reaches
  `main`. So this is not about catching it. It is about **who learns from it**:
  `hardener` would dedupe locally and move on, whereas the same finding at
  architect is evidence that the partition was wrong, which is exactly what the
  experiment log in item 2 exists to record. Against: it reintroduces the
  competition-for-one-pass that split `hardener` out in the first place. Either
  way `hardener` still runs `dry4ts` afterwards — this would be an additional
  earlier run, not a transfer.

- **These are not decision records.** They record whether an experiment came
  out, which is a lab notebook. Calling them ADRs invites the wrong template and
  the wrong lifecycle. Naming and location are open: `adr/`, `experiments/`, or
  architect-owned under `.claude/`. Top-level would match how `ideas/`,
  `features/`, `rules/`, and `perf/` are treated; architect-owned would match
  the fact that these are notes it keeps for itself.
- **What retires a hypothesis that never gets tested?** A bet whose slices never
  ran concurrently sits at conjecture forever. Either that's honest, or the log
  needs an expiry — and an expiry is the thing the DRR paper is really about.
