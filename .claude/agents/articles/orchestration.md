# Article: Orchestration: the seat that invokes the roles

**Audience:** the orchestrating session - **Read when:** at session start, before composing any role invocation, and at every merge-protocol step.

The five roles have files. The seat that invokes them does not, and until this article it had no reading list either — which is the gap it exists to close. **Everything here is either a duty no role can perform, or a contract a role expects the invoking prompt to satisfy and that was documented only on the receiving end.** Nothing here restates a role's own work.

**Why this is an article and not a sixth file in `.claude/agents/`.** That directory's direct `*.md` children are agent files by definition — `scripts/agent-doc-check/run.ts`'s `listAgentFiles` hands every one of them to check 2, which requires frontmatter naming a `tools` allowlist and a `model`. This seat is never invoked as an agent and has neither, so a role file here could only pass the gate by asserting something untrue. `articles/` is excluded from that scan for exactly this reason, and `mutation-testing.md` already names this seat on its Audience line.

## Read these three, unconditionally, the way every role does

`engineering.md`, `workflow.md`, `handoffs.md`. They are labelled "house rules every role reads unconditionally" and this seat is not a role, so nothing used to route it there — but their content is not role-specific and the omission was an accident of the file layout, not a decision.

**`engineering.md`'s two claim-discipline sections are the ones this seat most needs**: "The scope of a claim is the scope of the command that produced it" and "A conclusion from a plausible mechanism outlives a measurement." Both were written after roles published false conclusions, and they apply here identically. This seat published four in a single five-slice run — see "Prose discipline" below.

Topic articles keep their own triggers, and exactly one names this seat: **`mutation-testing.md`**, on its Audience line and again in its exemption trigger. Read it for a second thing its triggers do _not_ route you to — its fourth failure mode, the shell pipeline that eats the exit status of the thing being measured, which is the one place that trap is written down and which bit this seat on a `npm run test:perf` run rather than on anything to do with mutants.

## The invocation contracts

Each of these is something a role expects to be told. Nothing on the role's side can supply it; a missing one either hard-fails or, worse, succeeds wrongly.

- **`product` requires a mode.** SPECIFY or VERIFY, named in the prompt. It refuses to guess, so omitting it costs a round trip and nothing else.
- **`architect` requires a mode, and omitting it does _not_ hard-fail.** Its file says the prompt will name one and that absent a name **you are reviewing**. A DESIGN, CONTRACT or ADJUDICATE request sent without its mode comes back as a REVIEW pass that looks entirely successful. This is the most dangerous contract in the set, because the failure is silent and the output is plausible.
- **The mutation-invariant exemption exists only as a thing you say.** `hardener` runs stage 4 absent an instruction not to — "full stop", in its own words. It may check the predicate and must run the stage anyway if it can falsify it; a verification that comes back "invariant" grants nothing. Compute the predicate, name the diff it was computed over, and put both in the prompt. See the merge protocol in CLAUDE.md for the predicate itself; **that is the source of truth, and this article defers to it if the two ever disagree**.
- **`cleaner`'s scope is `coder`'s handoff manifest.** Cleaner cannot see the previous invocation. Carry the manifest forward into its prompt, or its mutation scan and its cleanup both aim at nothing in particular.
- **The slice name must be re-injected into every downstream prompt.** `product` invents it in SPECIFY (`product.md`'s handoff section); `coder`, `cleaner`, `architect` and `hardener` each close their own handoff with it. It is also the branch, the worktree directory, and the `slice/<name>` tag.

## State only this seat can carry

Subagents are stateless between invocations. Two counters therefore belong here and nowhere else.

- **The two-round-trip budget on an adjudicated finding.** `handoffs.md` states the rule and `architect.md` repeats it; what neither can do is apply it, because **nothing but this seat can count to two** — the roles are stateless between invocations and a third appearance looks like a first to both of them. Hold the count, and escalate to the user when it is reached.
- **Whether an acceptance spike ran.** `hardener` is told to check that a spike left nothing behind _if the slice ran one_, and only this seat knows. The spike also leaves a throwaway implementation that this seat discards.

## The escalation lanes that end here

Four lanes terminate in this seat, and each is described only as an outbound prohibition on the role that takes it. When one fires, the role has stopped and is waiting.

- **`product`, triage bucket D** — reports and stops.
- **`product` dissent** — `architect` is authoritative on code-vs-spec; **the user is authoritative on what the product should do**, and only this seat can reach the user.
- **`architect` ADJUDICATE, outside the changed-files manifest** — routed here by name.
- **`hardener`, a gate failure outside the slice manifest** — reports and stops. `workflow.md` states the general form: a failure there is either a pre-existing break on `main` or something a rebase brought in, and both belong to this seat.

## Sequencing this seat owns

- **`cleaner` runs after _every_ `coder` invocation**, not once after the last. Measured cost of the alternative: one slice shipped a function at CRAP 8.0 against a threshold of 6 that stood until a much later pass, and another left three `dry4ts` clones — a hard gate failure — that `cleaner` structurally could not have caught because they were authored after its single scan. Each pass also gets a small diff instead of the union of every invocation.
- **Re-invoke `hardener` whenever an adjudicated fix touches `src/`**, before `product` re-verifies. Not optional, and mostly cheap — Stryker runs `--incremental`, so the cost tracks the diff.
- **Do not widen `coder`'s scope.** It writes focused unit tests and the implementation, and runs `test:unit`, `build`, `ast-grep`, lint and format — plus `test:browser` if it touched that layer. Property tests are `architect`'s. `crap4ts`, `dry4ts`, `acceptance-mutation` and every mutation run belong to `cleaner` and `hardener`. Handing `coder` another role's work inflates an invocation from minutes to tens of minutes, runs the gates twice, and turns `architect`'s property-coverage review into reviewing someone else's work rather than authoring it. A design step reading "module + unit **and property** suite" is a split, not one invocation.
- **The design pass is this seat's call, not `product`'s.** Its triggers are facts about the current shape of `src/`, which `product` is deliberately blind to. They live in CLAUDE.md's "The optional architect design pass"; no article states them.

## What this seat runs that no role does

- **`npm run test:perf`, followed by `npm run perf-report`.** A role may _recommend_ a run; none runs it. The procedure — when a slice is perf-relevant, why the second command is not optional, and when the `main` baseline has to be regenerated first — is CLAUDE.md's, at the end of the merge-protocol section, and that is the source of truth rather than this bullet.
- **The merge protocol**, end to end. `main` is written by nothing else.
- **Rebase-conflict resolution is the slice session's, not this seat's** — the slice has the context. `main` never enters a conflicted state.

## Prose discipline

`engineering.md`'s two claim-discipline sections cover the general case and are not repeated here. One rule is specific to this seat:

**Restating a subagent's figure propagates its error under your name.** A handoff's numbers are that role's measurement at that role's scope. Re-derive before writing one into CLAUDE.md, an article, a brief, or a summary for the user — `npm ls` for a version, `grep`/`comm` for a count. This seat wrote `playwright-core 1.63.0` into CLAUDE.md on one `hardener`'s authority and a later `hardener` falsified it: 1.62.1.

Two habits that caught more than care did:

- **Name the claims a gate should derive**, in its invoking prompt. Telling `hardener` "derive these rather than read them, and treat the surrounding list as unverified" caught three of this seat's four false claims in one run. The catch rate depends on remembering to ask, so ask every time.
- **`grep` counts comments.** Filter them before reporting a symbol's reach. Twice this seat read a comment mention as live code, once nearly contradicting a correct finding.

Why this matters more here than elsewhere: every other artifact has a reviewer upstream of `hardener` — `features/` has `architect` CONTRACT and `product` VERIFY, `src/` has `cleaner` and `architect` REVIEW, `rules/` has its own fixture. Documentation authored from this seat has none. **A green gate is not evidence a comment is true**: a false `.feature` step reds, a false comment never does.

## When a slice exposes a missing guardrail, amend the role that should have caught it

Treat the gap as part of the work. The worked example: a test file had grown to 38 tests and 19.88s unnoticed, because `cleaner` watched mutant _count_ as a split signal and nobody watched test _runtime_ — the other factor in mutation cost. Fixing only the symptom leaves the blind spot.

`workflow.md` forbids a role editing another role's file without explicit user direction, so **propose the amendment and get the go-ahead** rather than folding it in. Make the edit from this seat rather than from inside a peer role, and say in the commit message that the user authorized it, so it stays traceable. Prefer the narrowest home: one role's file over a shared article when only one role needs it.

## Before building a checker, search for one

A bespoke `scripts/<program>/` checker pays full gate freight — its own vitest suite, CRAP ≤ 6, `dry4ts:scripts`, mutation testing — and becomes permanent maintenance. Web-search the tool landscape first and put the findings in the plan, rejections included. When nothing exists the search is not wasted: it turns "I'll build this" into "nothing covers this, here is the evidence", which is a far stronger justification, and it surfaces adjacent tools worth adopting.

## Worktree setup

**Run `npm ci` when the worktree is created, not when a gate first needs it.** Two commands in one run returned **127** — command not found — where this seat had assumed they had run; only `$?` on its own line caught it. A missing install does not announce itself, it just makes every `npm run` a silent no-op.

**Never `ln -s` a shared `node_modules` into a worktree that already has one.** The link lands _inside_ the existing directory as `node_modules/node_modules`, Node then resolves `@playwright/test` twice, and every Playwright entry point dies at config load with `Requiring @playwright/test second time`. Measured here; it cost a role most of an invocation to diagnose.
