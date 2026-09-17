# Article: Orchestration: the seat that invokes the roles

**Audience:** the orchestrating session - **Read when:** at session start, before composing any role invocation, and at every merge-protocol step.

The roles have files. The seat that invokes them does not, and until this article it had no reading list either. That is the gap this article exists to close. **Everything here is either a duty no role can perform, or a contract a role expects the invoking prompt to satisfy. A contract earns its place here only if the role's own file was the one place that documented it.** Nothing here restates a role's own work.

**Why this is an article and not a sixth file in `.claude/agents/`.** That directory's direct `*.md` children are agent files by definition. `listAgentFiles` in `scripts/agent-doc-check/run.ts` hands every one of them to check 2. Check 2 requires frontmatter naming a `tools` allowlist and a `model`. This seat is never invoked as an agent and has neither, so a role file here could only pass the gate by asserting something untrue. `articles/` is excluded from that scan for exactly this reason, and `mutation-testing.md` already names this seat on its Audience line.

## Read these three, unconditionally, the way every role does

`engineering.md`, `workflow.md`, `handoffs.md`, `claim-discipline.md`. They are labelled "house rules every role reads unconditionally", and this seat is not a role, so nothing used to route it there. But their content is not role-specific. The omission was an accident of the file layout, not a decision.

**`claim-discipline.md` is the article this seat most needs.** The first is "The scope of a claim is the scope of the command that produced it". The second is "A conclusion from a plausible mechanism outlives a measurement." Both were written after roles published false conclusions, and they apply here identically. This seat published four in a single five-slice run — see "Prose discipline" below.

Topic articles keep their own triggers, and exactly one names this seat: **`mutation-testing.md`**, on its Audience line and again in its exemption trigger. Read it for a second thing its triggers do _not_ route you to. That is its fourth failure mode: the shell pipeline that eats the exit status of the thing being measured. It is the one place that trap is written down. It bit this seat on a `npm run test:perf` run rather than on anything to do with mutants.

## The pipeline reference is this seat's operating manual

The invocation contracts, the counters only this seat can carry, the sequencing rules, and the
escalation lanes all moved to `.claude/references/pipelines.md` on 2026-09-16. That file states
each backlog kind's full class of service — the steps, what every invoking prompt must carry,
and where handoffs route. **Read it before composing any role invocation.** This article keeps
the seat's conduct: prose discipline, the exemption-flag protocol, the VERIFY-skip
demonstration, and what this seat runs that no role does.

## The idea board belongs to this seat

`backlog/` is a duty no role can perform. No role reads the board, and an item reaches a role as prompt content rather than as a file path. CLAUDE.md's "Idea board" section carries the procedures — the lanes, the folder-per-item shape, the `kind:` field, the move-only promotion commit, the `done/` move and its retrospective. This article carries the conduct.

- **Assess against `definition-of-ready.md`** before promoting a candidate, and rule one of its four dispositions. The scores rank; the written findings decide. Read that article's own header for the full trigger.
- **Hold the epic and spike exits open.** A candidate that fails assessment is not merely refused. The disposition names what kind of not-ready it is. A spike it generates is a first-class slice.
- **Keep `ready/` at about three.** The cap is prose, deliberately — the board has no gate, and a hard refusal would be its first.
- **The kind plans the cycle; the diff authorizes it.** An enabler's expected cycle omits `product`, but the skip is confirmed by the walk-every-path demonstration below, never by the label alone.

## What this seat runs that no role does

- **`npm run test:perf`, followed by `npm run perf-report`.** A role may _recommend_ a run; none runs it. The procedure lives at the end of `.claude/references/merge-protocol.md`, and that is the source of truth rather than this bullet. It covers when a slice is perf-relevant, and why the second command is not optional. It also covers when the `main` baseline has to be regenerated first.
- **The merge protocol**, end to end, per `.claude/references/merge-protocol.md`. `main` is written by nothing else.
- **Rebase-conflict resolution belongs to the slice session, not to this seat** — the slice has the context. `main` never enters a conflicted state.

## Prose discipline

`claim-discipline.md` covers the general case and is not repeated here. One rule is specific to this seat:

**Restating a subagent's figure propagates its error under your name.** A handoff's numbers are that role's measurement at that role's scope. Re-derive before writing one into CLAUDE.md, an article, a brief, or a summary for the user — `npm ls` for a version, `grep`/`comm` for a count. This seat wrote `playwright-core 1.63.0` into CLAUDE.md on one `hardener`'s authority and a later `hardener` falsified it: 1.62.1.

Two habits that caught more than care did:

- **Name the claims a gate should derive**, in its invoking prompt. Telling `hardener` "derive these rather than read them, and treat the surrounding list as unverified" caught three of this seat's four false claims in one run. The catch rate depends on remembering to ask, so ask every time.
- **`grep` counts comments.** Filter them before reporting a symbol's reach. Twice this seat read a comment mention as live code, once nearly contradicting a correct finding.

Why this matters more here than elsewhere: every other artifact has a reviewer upstream of `hardener`. `features/` has `architect` CONTRACT and `product` VERIFY. `src/` has `cleaner` and `architect` REVIEW. `rules/` has its own fixture. Documentation authored from this seat has none. **A green gate is not evidence a comment is true**: a false `.feature` step reds, a false comment never does.

**`npm run prose-lint` is the mechanical half of this.** Vale is report-only. Nothing reads its exit
code. Of its six enabled rules, five surface in a default run and all five are mechanical;
`PassiveVoice` sits below `MinAlertLevel`. So the script fails only when it **cannot lint**.

That means no binary, no `.vale/`, a config that will not load, or
an empty file list. A run that cannot lint reports zero. That zero reads exactly like a clean pass,
which is why the script treats it as a failure.

**The trigger is an edit, not a stage.** Run it after editing `.claude/**`, `CLAUDE.md`, a module
sidecar, or a JSDoc block. This seat edits the first two constantly. That is why the trigger is
written here and in the role files both.

**No role owns the running, because four seats do the editing.** What `architect` owns is the
**rules** under `vale-styles/JsDoc/`. Read `prose.md` before acting on any finding. Read its
"Triaging a finding in a comment" section when the finding sits in a JSDoc. The remedy there is often
a move rather than a rewrite.

## Handing a role an exemption gets flagged, and the flag is fair

**A subagent cannot verify that you are relaying a real user ruling.** It sees only your prompt. So an
instruction to skip a gate on the user's authority is, from inside that role, an unverifiable claim
of consent. Expect the harness to flag the hand-back as a possible gate bypass. Measured on
`lint-jsdoc-with-vale`, where this seat handed `hardener` a stage-5 skip against an exit-2 predicate.

**Treat the flag as information for the user, not as an obstacle to route around.** What it says is
structurally true and does not depend on the ruling being genuine. Three things follow:

- **Do not let your own relay settle it.** Surface the flag to the user before the landing action it
  gates. Say plainly which stage you are skipping, and what the predicate returned.
- **Give the role the refusal right explicitly**, in the prompt. `hardener` may refuse an exemption.
  It may never grant itself one. Naming the flag makes that right easier to exercise, not harder. A
  role that re-tests the claims and cannot falsify them has produced evidence, not a rubber stamp.
- **Record a skip granted on a ruling as a risk acceptance**, never as a predicate discharge, in the
  handoff and in the tag. The two read identically a month later unless the difference is written down.

**Give the role the technical claims to re-test rather than to inherit.** On that slice, `hardener`
proved the `src/` diff comment-only by emitting both files through `tsc --removeComments` and diffing
the output, which is stronger than any path predicate. It then checked the emitted text no longer
contained the changed string, closing the "identical for the wrong reason" hole. That evidence exists
because the prompt asked for falsification rather than confirmation.

## `product` VERIFY does not run on a slice with no behaviour change

The cycle says `product` opens and closes every slice. **VERIFY is a black-box check through the real
UI, so a slice that changes no behaviour gives it nothing to verify.** Ruled by the user on
`lint-jsdoc-with-vale`, a documentation and tooling slice whose only `src/` changes were comments.

**Demonstrate it rather than asserting it**, the same way you claim the comment-only mutation
exemption per diff. Three inputs are where such a change usually shows. They are `features/*.feature`,
`features/steps/*.ts`, and whether any `src/` change is non-comment.

**Those three are necessary and not sufficient.** Clearing them is not the demonstration.
`index.html` moves the UI with no `src/` diff. `features/screenplay/*.ts` moves what VERIFY itself
observes. Neither one is among the three.

So walk **every** path in the diff and account for it. CLAUDE.md rules the same way on the mutation
predicate, and for the same reason. A check that lists what to look at fails open. A skipped VERIFY
then reads exactly like a passing one.

Handle one consequence rather than skipping it silently. **Merge step 8 carries the
acceptance-mutation figure forward from `product`'s VERIFY handoff.** There is now no such handoff.
Say in the merge record that the step is moot, and why. A step with no output reads as a step nobody
ran.

## When a slice exposes a missing guardrail, amend the role that should have caught it

Treat the gap as part of the work. The worked example: a test file had grown to 38 tests and 19.88s unnoticed. That happened because `cleaner` watched mutant _count_ as a split signal, and nobody watched test _runtime_ — the other factor in mutation cost. Fixing only the symptom leaves the blind spot.

`workflow.md` forbids a role editing another role's file without explicit user direction. So **propose the amendment and get the go-ahead** rather than folding it in. Make the edit from this seat rather than from inside a peer role. Say in the commit message that the user authorized it, so it stays traceable. Prefer the narrowest home: one role's file over a shared article when only one role needs it.

## Before building a checker, search for one

A bespoke `scripts/<program>/` checker pays full gate freight — its own vitest suite, CRAP ≤ 6, `dry4ts:scripts`, mutation testing — and becomes permanent maintenance. Web-search the tool landscape first and put the findings in the plan, rejections included. When nothing exists the search is not wasted. It turns "I will build this" into "nothing covers this, here is the evidence", which is a far stronger justification. It also surfaces adjacent tools worth adopting.

## Worktree setup

**Run `npm ci` when the worktree is created, not when a gate first needs it.** Two commands in one run returned **127** — command not found — where this seat had assumed they had run; only `$?` on its own line caught it. A missing install does not announce itself, it just makes every `npm run` a silent no-op.

**Never `ln -s` a shared `node_modules` into a worktree that already has one.** The link lands _inside_ the existing directory as `node_modules/node_modules`, Node then resolves `@playwright/test` twice, and every Playwright entry point dies at config load with `Requiring @playwright/test second time`. Measured here; it cost a role most of an invocation to diagnose.
